"use strict";

import {
    EventType, Filter, FilterByBlockHash,
    Listener, Log, Provider, TransactionReceipt, TransactionRequest, TransactionResponse
} from "@ethersproject/abstract-provider";
import { BigNumber } from "@ethersproject/bignumber";
import { arrayify, hexDataLength, hexlify } from "@ethersproject/bytes";
import { getNetwork, Network, Networkish, HederaNetworkConfigLike } from "@ethersproject/networks";
import { Deferrable, defineReadOnly, getStatic, resolveProperties } from "@ethersproject/properties";
import { Transaction } from "@ethersproject/transactions";
import { TransactionReceipt as HederaTransactionReceipt } from '@hashgraph/sdk';

import { Logger } from "@ethersproject/logger";
import { version } from "./_version";
const logger = new Logger(version);

import { Formatter } from "./formatter";
import { getAccountFromTransactionId, AccountLike, asAccountString, getAddressFromAccount } from "@ethersproject/address";
import { AccountBalanceQuery, AccountId, Client, NetworkName, Transaction as HederaTransaction } from "@hashgraph/sdk";
import axios from "axios";
import {base64} from "ethers/lib/utils";

//////////////////////////////
// Event Serializeing
// @ts-ignore
function checkTopic(topic: string): string {
    if (topic == null) { return "null"; }
    if (hexDataLength(topic) !== 32) {
        logger.throwArgumentError("invalid topic", "topic", topic);
    }
    return topic.toLowerCase();
}

// @ts-ignore
function serializeTopics(topics: Array<string | Array<string>>): string {
    // Remove trailing null AND-topics; they are redundant
    topics = topics.slice();
    while (topics.length > 0 && topics[topics.length - 1] == null) { topics.pop(); }

    return topics.map((topic) => {
        if (Array.isArray(topic)) {

            // Only track unique OR-topics
            const unique: { [ topic: string ]: boolean } = { }
            topic.forEach((topic) => {
                unique[checkTopic(topic)] = true;
            });

            // The order of OR-topics does not matter
            const sorted = Object.keys(unique);
            sorted.sort();

            return sorted.join("|");

        } else {
            return checkTopic(topic);
        }
    }).join("&");
}

function deserializeTopics(data: string): Array<string | Array<string>> {
    if (data === "") { return [ ]; }

    return data.split(/&/g).map((topic) => {
        if (topic === "") { return [ ]; }

        const comps = topic.split("|").map((topic) => {
            return ((topic === "null") ? null: topic);
        });

        return ((comps.length === 1) ? comps[0]: comps);
    });
}


//////////////////////////////
// Helper Object


function stall(duration: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, duration);
    });
}

function base64ToHex(hash: string): string {
    return hexlify(base64.decode(hash));
}

//////////////////////////////
// Provider Object


/**
 *  EventType
 *   - "block"
 *   - "poll"
 *   - "didPoll"
 *   - "pending"
 *   - "error"
 *   - "network"
 *   - filter
 *   - topics array
 *   - transaction hash
 */

const PollableEvents = [ "block", "network", "pending", "poll" ];

export class Event {
    readonly listener: Listener;
    readonly once: boolean;
    readonly tag: string;

    constructor(tag: string, listener: Listener, once: boolean) {
        defineReadOnly(this, "tag", tag);
        defineReadOnly(this, "listener", listener);
        defineReadOnly(this, "once", once);
    }

    get event(): EventType {
        switch (this.type) {
            case "tx":
               return this.hash;
            case "filter":
               return this.filter;
        }
        return this.tag;
    }

    get type(): string {
        return this.tag.split(":")[0]
    }

    get hash(): string {
        const comps = this.tag.split(":");
        if (comps[0] !== "tx") { return null; }
        return comps[1];
    }

    get filter(): Filter {
        const comps = this.tag.split(":");
        if (comps[0] !== "filter") { return null; }
        const address = comps[1];

        const topics = deserializeTopics(comps[2]);
        const filter: Filter = { };

        if (topics.length > 0) { filter.topics = topics; }
        if (address && address !== "*") { filter.address = address; }

        return filter;
    }

    pollable(): boolean {
        return (this.tag.indexOf(":") >= 0 || PollableEvents.indexOf(this.tag) >= 0);
    }
}

export interface Avatar {
    url: string;
    linkage: Array<{ type: string, content: string }>;
}

let defaultFormatter: Formatter = null;
const MIRROR_NODE_TRANSACTIONS_ENDPOINT =  '/api/v1/transactions/';
const MIRROR_NODE_CONTRACTS_RESULTS_ENDPOINT = '/api/v1/contracts/results/';
const MIRROR_NODE_CONTRACTS_ENDPOINT = '/api/v1/contracts/';

export class BaseProvider extends Provider {
    _networkPromise: Promise<Network>;
    _network: Network;

    _events: Array<Event>;

    _pollingInterval: number;


    formatter: Formatter;

    readonly anyNetwork: boolean;
    private readonly hederaClient: Client;
    private readonly _mirrorNodeUrl: string; // initial mirror node URL, which is resolved from the provider's network

    /**
     *  ready
     *
     *  A Promise<Network> that resolves only once the provider is ready.
     *
     *  Sub-classes that call the super with a network without a chainId
     *  MUST set this. Standard named networks have a known chainId.
     *
     */

    constructor(network: Networkish | Promise<Network> | HederaNetworkConfigLike) {
        logger.checkNew(new.target, Provider);
        super();

        this.formatter = new.target.getFormatter();
        // If network is any, this Provider allows the underlying
        // network to change dynamically, and we auto-detect the
        // current network
        defineReadOnly(this, "anyNetwork", (network === "any"));
        if (this.anyNetwork) { network = this.detectNetwork(); }

        if (network instanceof Promise) {
            this._networkPromise = network;
            // Squash any "unhandled promise" errors; that do not need to be handled
            network.catch((error) => { });

            // Trigger initial network setting (async)
            this._ready().catch((error) => { });
        } else {
            if (!isHederaNetworkConfigLike(network)) {
                const asDefaultNetwork = network as Network;
                // defineReadOnly(this, "_network", getNetwork(network));
                this._network = getNetwork(asDefaultNetwork);
                this._networkPromise = Promise.resolve(this._network);
                const knownNetwork = getStatic<(network: Networkish) => Network>(new.target, "getNetwork")(asDefaultNetwork);
                if (knownNetwork) {
                    defineReadOnly(this, "_network", knownNetwork);
                    this.emit("network", knownNetwork, null);
                } else {
                    logger.throwArgumentError("invalid network", "network", network);
                }
                this.hederaClient = Client.forName(mapNetworkToHederaNetworkName(asDefaultNetwork));
                this._mirrorNodeUrl = resolveMirrorNetworkUrl(this._network);
            } else {
                const asHederaNetwork = network as HederaNetworkConfigLike;
                this.hederaClient = Client.forNetwork(asHederaNetwork.network);
                this._mirrorNodeUrl = asHederaNetwork.mirrorNodeUrl;
                defineReadOnly(this, "_network", {
                    // FIXME: chainId
                    chainId: 0,
                    name: this.hederaClient.networkName
                });
            }
        }

        this._pollingInterval = 3000;
    }

    async _ready(): Promise<Network> {
        if (this._network == null) {
            let network: Network = null;
            if (this._networkPromise) {
                try {
                    network = await this._networkPromise;
                } catch (error) { }
            }

            // Try the Provider's network detection (this MUST throw if it cannot)
            if (network == null) {
                network = await this.detectNetwork();
            }

            // This should never happen; every Provider sub-class should have
            // suggested a network by here (or have thrown).
            // if (!network) {
            //     logger.throwError("no network detected", Logger.errors.UNKNOWN_ERROR, { });
            // }

            // Possible this call stacked so do not call defineReadOnly again
            if (this._network == null) {
                if (this.anyNetwork) {
                    // this._network = network;
                    defineReadOnly(this, "_network", network);
                } else {
                    this._network = network;
                }
                this.emit("network", network, null);
            }
        }

        return this._network;
    }

    // @TODO: Remove this and just create a singleton formatter
    static getFormatter(): Formatter {
        if (defaultFormatter == null) {
            defaultFormatter = new Formatter();
        }
        return defaultFormatter;
    }

    // @TODO: Remove this and just use getNetwork
    static getNetwork(network: Networkish): Network {
        return getNetwork((network == null) ? "mainnet": network);
    }

    get network(): Network {
        return this._network;
    }

    public _checkMirrorNode(): void {
        if (!this._mirrorNodeUrl) logger.throwError("missing provider", Logger.errors.UNSUPPORTED_OPERATION);
    }

    // This method should query the network if the underlying network
    // can change, such as when connected to a JSON-RPC backend
    // With the current hedera implementation, we do not support a changeable networks,
    // thus we do not need to query at this level
    async detectNetwork(): Promise<Network> {
        this._networkPromise = Promise.resolve(this._network);
        return this._networkPromise;
    }

    async getNetwork(): Promise<Network> {
        const network = await this._ready();

        // Make sure we are still connected to the same network; this is
        // only an external call for backends which can have the underlying
        // network change spontaneously
        const currentNetwork = await this.detectNetwork();
        if (network.chainId !== currentNetwork.chainId) {

            // We are allowing network changes, things can get complex fast;
            // make sure you know what you are doing if you use "any"
            if (this.anyNetwork) {
                this._network = currentNetwork;
                // The "network" event MUST happen before this method resolves
                // so any events have a chance to unregister, so we stall an
                // additional event loop before returning from /this/ call
                this.emit("network", currentNetwork, network);
                await stall(0);

                return this._network;
            }

            const error = logger.makeError("underlying network changed", Logger.errors.NETWORK_ERROR, {
                event: "changed",
                network: network,
                detectedNetwork: currentNetwork
            });

            this.emit("error", error);
            throw error;
        }

        return network;
    }

    get pollingInterval(): number {
        return this._pollingInterval;
    }

    set pollingInterval(value: number) {
        if (typeof(value) !== "number" || value <= 0 || parseInt(String(value)) != value) {
            throw new Error("invalid polling interval");
        }
        this._pollingInterval = value;
    }

    async waitForTransaction(transactionId: string, timeout?: number): Promise<TransactionReceipt> {
        return this._waitForTransaction(transactionId, timeout);
    }

    async _waitForTransaction(transactionId: string, timeout: number): Promise<TransactionReceipt> {
        let remainingTimeout = timeout;
        return new Promise(async (resolve, reject) => {
            while (remainingTimeout == null || remainingTimeout > 0) {
                const txResponse = await this.getTransaction(transactionId);
                if (txResponse == null) {
                    await new Promise((resolve) => {
                        setTimeout(resolve, this._pollingInterval);
                    });
                    if (remainingTimeout != null) remainingTimeout -= this._pollingInterval;
                } else {
                    return resolve(this.formatter.receiptFromResponse(txResponse));
                }
            }
            reject(logger.makeError("timeout exceeded", Logger.errors.TIMEOUT, { timeout: timeout }));
        });
    }

    /**
     *  AccountBalance query implementation, using the hashgraph sdk.
     *  It returns the tinybar balance of the given address.
     *
     * @param accountLike The address to check balance of
     */
    async getBalance(accountLike: AccountLike | Promise<AccountLike>): Promise<BigNumber> {
        accountLike = await accountLike;
        const account = asAccountString(accountLike);
        try {
            const balance = await new AccountBalanceQuery()
                .setAccountId(AccountId.fromString(account))
                .execute(this.hederaClient);
            return BigNumber.from(balance.hbars.toTinybars().toNumber());
        } catch (error) {
            return logger.throwError("bad result from backend", Logger.errors.SERVER_ERROR, {
                method: "AccountBalanceQuery",
                params: {address: accountLike},
                error
            });
        }
    }

    /**
     *  Get contract bytecode implementation, using the REST Api.
     *  It returns the bytecode, or a default value as string.
     *
     * @param accountLike The address to get code for
     * @param throwOnNonExisting Whether or not to throw exception if address is not a contract
     */
    async getCode(accountLike: AccountLike | Promise<AccountLike>, throwOnNonExisting?: boolean): Promise<string> {
        this._checkMirrorNode();
        accountLike = await accountLike;
        const account = asAccountString(accountLike);
        try {
            let { data } = await axios.get(this._mirrorNodeUrl + MIRROR_NODE_CONTRACTS_ENDPOINT + account);
            return data.bytecode ? hexlify(data.bytecode) : `0x`;
        } catch (error) {
            if (error.response && error.response.status &&
                (error.response.status != 404 || (error.response.status == 404 && throwOnNonExisting))) {
                logger.throwError("bad result from backend", Logger.errors.SERVER_ERROR, {
                    method: "ContractByteCodeQuery",
                    params: {address: accountLike},
                    error
                });
            }
            return "0x";
        }
    }

    // This should be called by any subclass wrapping a TransactionResponse
    _wrapTransaction(tx: Transaction, hash?: string, receipt?: HederaTransactionReceipt): TransactionResponse {
        if (hash != null && hexDataLength(hash) !== 48) { throw new Error("invalid response - sendTransaction"); }

        const result = <TransactionResponse>tx;
        if (!result.customData) result.customData = {};
        if (receipt && receipt.fileId) {
            result.customData.fileId = receipt.fileId.toString();
        }
        if (receipt && receipt.contractId) {
            result.customData.contractId = receipt.contractId.toSolidityAddress();
        }
        if (receipt && receipt.accountId) {
            result.customData.accountId = receipt.accountId;
        }

        // Check the hash we expect is the same as the hash the server reported
        if (hash != null && tx.hash !== hash) {
            logger.throwError("Transaction hash mismatch from Provider.sendTransaction.", Logger.errors.UNKNOWN_ERROR, { expectedHash: tx.hash, returnedHash: hash });
        }

        result.wait = async (timeout?: number) => {
            const receipt = await this._waitForTransaction(tx.transactionId, timeout);
            if (receipt.status === 0) {
                logger.throwError("transaction failed", Logger.errors.CALL_EXCEPTION, {
                    transactionHash: tx.hash,
                    transaction: tx,
                    receipt: receipt
                });
            }
            return receipt;
        };
        return result;
    }

    public getHederaClient() : Client {
        return this.hederaClient;
    }

    public getHederaNetworkConfig(): AccountId[] {
        return this.hederaClient._network.getNodeAccountIdsForExecute();
    }

    async sendTransaction(signedTransaction: string | Promise<string>): Promise<TransactionResponse> {
        signedTransaction = await signedTransaction;
        const txBytes = arrayify(signedTransaction);
        const hederaTx = HederaTransaction.fromBytes(txBytes);
        const ethersTx = await this.formatter.transaction(signedTransaction);
        const txHash = hexlify(await hederaTx.getTransactionHash());
        try {
            // TODO once we have fallback provider use `provider.perform("sendTransaction")`
            // TODO Before submission verify that the nodeId is the one that the provider is connected to
            const resp = await hederaTx.execute(this.hederaClient);
            const receipt = await resp.getReceipt(this.hederaClient);
            return this._wrapTransaction(ethersTx, txHash, receipt);
        } catch (error) {
            const err = logger.makeError(error.message, error.status?.toString());
            (<any>err).transaction = ethersTx;
            (<any>err).transactionHash = txHash;
            throw err;
        }
    }

    async _getFilter(filter: Filter | FilterByBlockHash | Promise<Filter | FilterByBlockHash>): Promise<Filter | FilterByBlockHash> {
        filter = await filter;

        const result: any = { };

        if (filter.address != null) {
            result.address = filter.address.toString();
        }

        ["blockHash", "topics"].forEach((key) => {
            if ((<any>filter)[key] == null) { return; }
            result[key] = (<any>filter)[key];
        });

        ["fromBlock", "toBlock"].forEach((key) => {
            if ((<any>filter)[key] == null) { return; }
        });

        return this.formatter.filter(await resolveProperties(result));
    }

    async estimateGas(transaction: Deferrable<TransactionRequest>): Promise<BigNumber> {
        return logger.throwArgumentError("estimateGas not implemented", Logger.errors.NOT_IMPLEMENTED, {
            operation: "estimateGas"
        });
    }

    /**
     * Transaction record query implementation using the mirror node REST API.
     *
     * @param transactionId - id of the transaction to search for
     */
    async getTransaction(transactionId: string | Promise<string>): Promise<TransactionResponse> {
        this._checkMirrorNode();
        transactionId = await transactionId;
        const transactionsEndpoint = MIRROR_NODE_TRANSACTIONS_ENDPOINT + transactionId;
        try {
            let { data } = await axios.get(this._mirrorNodeUrl + transactionsEndpoint);
            if (data) {
                const filtered = data.transactions.filter((e: { result: string; }) => e.result != 'DUPLICATE_TRANSACTION');
                if (filtered.length > 0) {
                    let record: any;
                    record = {
                        chainId: this._network.chainId,
                        transactionId: transactionId,
                        result: filtered[0].result,
                    };

                    const transactionName = filtered[0].name;
                    if (transactionName === 'CRYPTOCREATEACCOUNT') {
                        record.from = getAccountFromTransactionId(transactionId);
                        record.timestamp = filtered[0].consensus_timestamp;

                        // Different endpoints of the mirror node API returns hashes in different formats.
                        // In order to ensure consistency with data from MIRROR_NODE_CONTRACTS_ENDPOINT
                        // the hash from MIRROR_NODE_TRANSACTIONS_ENDPOINT is base64 decoded and then converted to hex.
                        record.hash = base64ToHex(filtered[0].transaction_hash);

                        record.accountAddress = getAddressFromAccount(filtered[0].entity_id);
                    }
                    else {
                        const contractsEndpoint = MIRROR_NODE_CONTRACTS_RESULTS_ENDPOINT + transactionId;
                        const dataWithLogs = await axios.get(this._mirrorNodeUrl + contractsEndpoint);
                        record = Object.assign({}, record, {...dataWithLogs.data});
                    }

                    return this.formatter.responseFromRecord(record);
                }
            }
        } catch (error) {
            if (error && error.response && error.response.status != 404) {
                logger.throwError("bad result from backend", Logger.errors.SERVER_ERROR, {
                    method: "TransactionResponseQuery",
                    error
                });
            }
        }
        return null;
    }

    /**
     * Transaction record query implementation using the mirror node REST API.
     *
     * @param transactionId - id of the transaction to search for
     */
    async getTransactionReceipt(transactionId: string | Promise<string>): Promise<TransactionReceipt> {
        return logger.throwError("getTransactionReceipt not implemented", Logger.errors.NOT_IMPLEMENTED, {
            operation: 'getTransactionReceipt'
        })

        // await this.getNetwork();
        // transactionId = await transactionId;
        // try {
        //     let receipt = await new TransactionReceiptQuery()
        //         .setTransactionId(transactionId)
        //         .execute(this.hederaClient);
        //     console.log("getTransactionReceipt: ", receipt);
        //     return null;
        // } catch (error) {
        //     return logger.throwError("bad result from backend", Logger.errors.SERVER_ERROR, {
        //         method: "TransactionGetReceiptQuery",
        //         error
        //     });
        // }
    }

    async getLogs(filter: Filter | FilterByBlockHash | Promise<Filter | FilterByBlockHash>): Promise<Array<Log>> {
        await this.getNetwork();
        const params = await resolveProperties({ filter: this._getFilter(filter) });
        const logs: Array<Log> = await this.perform("getLogs", params);
        return Formatter.arrayOf(this.formatter.filterLog.bind(this.formatter))(logs);
    }

    async getHbarPrice(): Promise<number> {
        return logger.throwError("NOT_IMPLEMENTED", Logger.errors.NOT_IMPLEMENTED);
    }

    perform(method: string, params: any): Promise<any> {
        return logger.throwError(method + " not implemented", Logger.errors.NOT_IMPLEMENTED, { operation: method });
    }

    _addEventListener(eventName: EventType, listener: Listener, once: boolean): this {
        return this;
    }

    on(eventName: EventType, listener: Listener): this {
        return this._addEventListener(eventName, listener, false);
    }

    once(eventName: EventType, listener: Listener): this {
        return this._addEventListener(eventName, listener, true);
    }

    emit(eventName: EventType, ...args: Array<any>): boolean {
        return false;
    }

    listenerCount(eventName?: EventType): number {
        return 0;
    }

    listeners(eventName?: EventType): Array<Listener> {
        return null;
    }

    off(eventName: EventType, listener?: Listener): this {
        return this;
    }

    removeAllListeners(eventName?: EventType): this {
        return this;
    }
}


// resolves network string to a hedera network name
function mapNetworkToHederaNetworkName(net: Network | string | number | Promise<Network>) {
    switch (net) {
        case 'mainnet':
            return NetworkName.Mainnet;
        case 'previewnet':
            return NetworkName.Previewnet;
        case 'testnet':
            return NetworkName.Testnet;
        default:
            logger.throwArgumentError("Invalid network name", "network", net);
            return null;
    }
}

// resolves the mirror node url from the given provider network.
function resolveMirrorNetworkUrl(net: Network): string {
    switch (net.name) {
        case 'mainnet':
            return 'https://mainnet.mirrornode.hedera.com';
        case 'previewnet':
            return 'https://previewnet.mirrornode.hedera.com';
        case 'testnet':
            return 'https://testnet.mirrornode.hedera.com';
        default:
            logger.throwArgumentError("Invalid network name", "network", net);
            return null;
    }
}

function isHederaNetworkConfigLike(cfg : HederaNetworkConfigLike | Networkish): cfg is HederaNetworkConfigLike {
    return (cfg as HederaNetworkConfigLike).network !== undefined;
}
