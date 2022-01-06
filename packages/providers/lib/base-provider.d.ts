/// <reference types="node" />
import { BlockTag, EventType, Filter, FilterByBlockHash, Listener, Log, Provider, TransactionReceipt, TransactionRequest, TransactionResponse } from "@ethersproject/abstract-provider";
import { BigNumber } from "@ethersproject/bignumber";
import { Network, Networkish } from "@ethersproject/networks";
import { Deferrable } from "@ethersproject/properties";
import { Transaction } from "@ethersproject/transactions";
import { Formatter } from "./formatter";
import { TransactionReceipt as HederaTransactionReceipt } from "@hashgraph/sdk";
export declare class Event {
    readonly listener: Listener;
    readonly once: boolean;
    readonly tag: string;
    constructor(tag: string, listener: Listener, once: boolean);
    get event(): EventType;
    get type(): string;
    get hash(): string;
    get filter(): Filter;
    pollable(): boolean;
}
export interface EnsResolver {
    readonly name: string;
    readonly address: string;
    getAddress(coinType?: 60): Promise<null | string>;
    getContentHash(): Promise<null | string>;
    getText(key: string): Promise<null | string>;
}
export interface EnsProvider {
    resolveName(name: string): Promise<null | string>;
    lookupAddress(address: string): Promise<null | string>;
    getResolver(name: string): Promise<null | EnsResolver>;
}
export interface Avatar {
    url: string;
    linkage: Array<{
        type: string;
        content: string;
    }>;
}
export declare class Resolver implements EnsResolver {
    readonly provider: BaseProvider;
    readonly name: string;
    readonly address: string;
    readonly _resolvedAddress: null | string;
    constructor(provider: BaseProvider, address: string, name: string, resolvedAddress?: string);
    _fetchBytes(selector: string, parameters?: string): Promise<null | string>;
    _getAddress(coinType: number, hexBytes: string): string;
    getAddress(coinType?: number): Promise<string>;
    getAvatar(): Promise<null | Avatar>;
    getContentHash(): Promise<string>;
    getText(key: string): Promise<string>;
}
export declare class BaseProvider extends Provider implements EnsProvider {
    _networkPromise: Promise<Network>;
    _network: Network;
    _events: Array<Event>;
    formatter: Formatter;
    _emitted: {
        [eventName: string]: number | "pending";
    };
    _pollingInterval: number;
    _poller: NodeJS.Timer;
    _bootstrapPoll: NodeJS.Timer;
    _lastBlockNumber: number;
    _fastBlockNumber: number;
    _fastBlockNumberPromise: Promise<number>;
    _fastQueryDate: number;
    _maxInternalBlockNumber: number;
    _internalBlockNumber: Promise<{
        blockNumber: number;
        reqTime: number;
        respTime: number;
    }>;
    readonly anyNetwork: boolean;
    private readonly hederaClient;
    private readonly mirrorNodeUrl;
    /**
     *  ready
     *
     *  A Promise<Network> that resolves only once the provider is ready.
     *
     *  Sub-classes that call the super with a network without a chainId
     *  MUST set this. Standard named networks have a known chainId.
     *
     */
    constructor(network: Networkish | Promise<Network>);
    _ready(): Promise<Network>;
    get ready(): Promise<Network>;
    static getFormatter(): Formatter;
    static getNetwork(network: Networkish): Network;
    poll(): Promise<void>;
    resetEventsBlock(blockNumber: number): void;
    get network(): Network;
    detectNetwork(): Promise<Network>;
    getNetwork(): Promise<Network>;
    get polling(): boolean;
    set polling(value: boolean);
    get pollingInterval(): number;
    set pollingInterval(value: number);
    waitForTransaction(transactionHash: string, confirmations?: number, timeout?: number): Promise<TransactionReceipt>;
    _waitForTransaction2(transactionId: string, timeout: number): Promise<TransactionReceipt>;
    _waitForTransaction(transactionId: string, timeoutMs: number): Promise<TransactionReceipt>;
    /**
     *  AccountBalance query implementation, using the hashgraph sdk.
     *  It returns the tinybar balance of the given address.
     *
     * @param addressOrName The address to check balance of
     */
    getBalance(addressOrName: string | Promise<string>): Promise<BigNumber>;
    getCode(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<string>;
    _wrapTransaction(tx: Transaction, receipt?: HederaTransactionReceipt): TransactionResponse;
    sendTransaction(signedTransaction: string | Promise<string>): Promise<TransactionResponse>;
    _getTransactionRequest(transaction: Deferrable<TransactionRequest>): Promise<Transaction>;
    _getFilter(filter: Filter | FilterByBlockHash | Promise<Filter | FilterByBlockHash>): Promise<Filter | FilterByBlockHash>;
    call(transaction: Deferrable<TransactionRequest>, blockTag?: BlockTag | Promise<BlockTag>): Promise<string>;
    estimateGas(transaction: Deferrable<TransactionRequest>): Promise<BigNumber>;
    _getAddress(addressOrName: string | Promise<string>): Promise<string>;
    /**
     * Transaction record query implementation using the mirror node REST API.
     *
     * @param txId - id of the transaction to search for
     */
    getTransaction(transactionId: string | Promise<string>): Promise<TransactionResponse>;
    sleep(ms: number): Promise<void>;
    getTransactionReceipt(transactionId: string | Promise<string>): Promise<TransactionReceipt>;
    getLogs(filter: Filter | FilterByBlockHash | Promise<Filter | FilterByBlockHash>): Promise<Array<Log>>;
    getHbarPrice(): Promise<number>;
    getResolver(name: string): Promise<null | Resolver>;
    _getResolver(name: string): Promise<string>;
    resolveName(name: string | Promise<string>): Promise<null | string>;
    lookupAddress(address: string | Promise<string>): Promise<null | string>;
    getAvatar(nameOrAddress: string): Promise<null | string>;
    perform(method: string, params: any): Promise<any>;
    _startEvent(event: Event): void;
    _stopEvent(event: Event): void;
    _addEventListener(eventName: EventType, listener: Listener, once: boolean): this;
    on(eventName: EventType, listener: Listener): this;
    once(eventName: EventType, listener: Listener): this;
    emit(eventName: EventType, ...args: Array<any>): boolean;
    listenerCount(eventName?: EventType): number;
    listeners(eventName?: EventType): Array<Listener>;
    off(eventName: EventType, listener?: Listener): this;
    removeAllListeners(eventName?: EventType): this;
}
//# sourceMappingURL=base-provider.d.ts.map