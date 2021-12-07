import { BaseProvider } from "./base-provider";
import { Networkish } from "@ethersproject/networks";
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
    consensusNodeUrl: string;
    constructor(network: Networkish, options?: {
        mirrorNodeUrl?: string;
        consensusNodeUrl?: string;
    });
}
//# sourceMappingURL=default-hedera-provider.d.ts.map