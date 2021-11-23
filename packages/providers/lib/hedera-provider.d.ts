import { BaseProvider } from "./base-provider";
import { BigNumber } from "@ethersproject/bignumber";
import { BlockTag } from "@ethersproject/abstract-provider";
export declare class HederaProvider extends BaseProvider {
    private hederaClient;
    constructor(network: string);
    /**
     *
     * @param addressOrName The address to check balance of
     * @param blockTag - not used
     */
    getBalance(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<BigNumber>;
}
//# sourceMappingURL=hedera-provider.d.ts.map