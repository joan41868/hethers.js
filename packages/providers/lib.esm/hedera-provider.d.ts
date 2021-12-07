import { BaseProvider } from "./base-provider";
import { BigNumber } from "@ethersproject/bignumber";
import { BlockTag, TransactionResponse } from "@ethersproject/abstract-provider";
export declare enum HederaNetworks {
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
export declare class DefaultHederaProvider extends BaseProvider {
    private readonly hederaClient;
    private readonly hederaNetwork;
    constructor(network: string);
    /**
     *  AccountBalance query implementation, using the hashgraph sdk.
     *  It returns the tinybar balance of the given address.
     *
     * @param addressOrName The address to check balance of
     * @param blockTag -  not used. Will throw if used.
     */
    getBalance(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<BigNumber>;
    /**
     * Transaction record query implementation using the mirror node REST API.
     *
     * @param txId - id of the transaction to search for
     */
    getTransaction(txId: string | Promise<string>): Promise<TransactionResponse>;
}
//# sourceMappingURL=hedera-provider.d.ts.map