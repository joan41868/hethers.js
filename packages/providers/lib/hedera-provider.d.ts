import { BaseProvider } from "./base-provider";
import { Client } from '@hashgraph/sdk';
import { BigNumber } from "@ethersproject/bignumber";
import { BlockTag } from "@ethersproject/abstract-provider";
export declare class HederaProvider extends BaseProvider {
    private readonly hederaClient;
    private readonly hederaNetwork;
    constructor(network: string);
    /**
     *
     * @param addressOrName The address to check balance of
     * @param blockTag - not used
     */
    getBalance(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<BigNumber>;
    /**
     *
     * @param txId - id of the transaction to search for
     */
    getTransaction(txId: string | Promise<string>): Promise<any>;
    getClient(): Client;
}
//# sourceMappingURL=hedera-provider.d.ts.map