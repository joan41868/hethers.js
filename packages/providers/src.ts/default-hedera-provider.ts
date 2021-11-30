import { BaseProvider } from "./base-provider";
import { AccountBalanceQuery, AccountId, Client, NetworkName, } from '@hashgraph/sdk';
import { BigNumber } from "@ethersproject/bignumber";
import { BlockTag, TransactionResponse } from "@ethersproject/abstract-provider";
import { getAccountFromAddress } from "ethers/lib/utils";
import axios from 'axios';
import { Logger } from '@ethersproject/logger';
import { version } from "./_version";

const logger = new Logger(version);

// resolves network string to a hedera network name
function resolveNetwork(net: string) {
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
function resolveMirrorNetworkUrl(net: string): string {
    switch (net) {
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

// contains predefined, sdk acceptable hedera network strings
export enum HederaNetworks {
    TESTNET = "testnet",
    PREVIEWNET = "previewnet",
    MAINNET = "mainnet"
}

/**
 * The hedera provider uses the hashgraph module to establish a connection to the Hedera network.
 * As every provider, this one also gives us read-only access.
 *
 * Constructable with a string, which automatically resolves to a hedera network via the hashgraph SDK.
 */
export class DefaultHederaProvider extends BaseProvider {
    private readonly hederaClient: Client;
    private readonly hederaNetwork: string;

    constructor(network: string) {
        super('testnet');
        this.hederaNetwork = network;
        this.hederaClient = Client.forName(resolveNetwork(network))
    }

    /**
     *  AccountBalance query implementation, using the hashgraph sdk.
     *  It returns the tinybar balance of the given address.
     *
     * @param addressOrName The address to check balance of
     * @param blockTag -  not used. Will throw if used.
     */
    async getBalance(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<BigNumber> {
        if (blockTag || await blockTag) {
            logger.throwArgumentError("Cannot use blockTag for hedera services.", "blockTag", blockTag);
            return BigNumber.from(0);
        }
        addressOrName = await addressOrName;
        const { shard, realm, num } = getAccountFromAddress(addressOrName);
        const shardNum = BigNumber.from(shard).toNumber();
        const realmNum = BigNumber.from(realm).toNumber();
        const accountNum = BigNumber.from(num).toNumber();
        const balance = await new AccountBalanceQuery()
            .setAccountId(new AccountId({ shard: shardNum, realm: realmNum, num: accountNum }))
            .execute(this.hederaClient);
        return BigNumber.from(balance.hbars.toTinybars().toNumber());
    }

    /**
     * Transaction record query implementation using the mirror node REST API.
     *
     * @param txId - id of the transaction to search for
     */
    async getTransaction(txId: string | Promise<string>): Promise<TransactionResponse> {
        txId = await txId;
        const [ accId, , ] = txId.split("-");
        const ep = '/api/v1/transactions?account.id=' + accId;
        const url = resolveMirrorNetworkUrl(this.hederaNetwork);
        let { data } = await axios.get(url + ep);
        while (data.links.next != null) {
            const filtered = data.transactions
                .filter((e: { transaction_id: string | Promise<string>; }) => e.transaction_id === txId);
            if (filtered.length > 1) {
                return filtered[0];
            }
            ({ data } = await axios.get(url + data.links.next));
        }
        return null;
    }
}
