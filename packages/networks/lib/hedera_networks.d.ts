import { AccountID } from "@hashgraph/proto";
import { Network } from "@ethersproject/providers";
export declare const HEDERA_CHAIN_IDS: {
    MAINNET: number;
    TESTNET: number;
    PREVIEWNET: number;
};
declare type HederaNetworkConfigLike = {
    [key: string]: (string | AccountID);
};
export declare enum NetworkType {
    MAINNET = "mainnet",
    TESTNET = "testnet",
    PREVIEWNET = "previewnet"
}
export declare const MAINNET: Network;
export declare const TESTNET: Network;
export declare const PREVIEWNET: Network;
export declare const MAINNET_CONFIG: HederaNetworkConfigLike;
export declare const TESTNET_CONFIG: HederaNetworkConfigLike;
export declare const PREVIEWNET_CONFIG: HederaNetworkConfigLike;
declare type MirrorNetworkConfigLike = string[];
export declare const MIRROR_MAINNET_CONFIG: MirrorNetworkConfigLike;
export declare const MIRROR_TESTNET_CONFIG: MirrorNetworkConfigLike;
export declare const MIRROR_PREVIEWNET_CONFIG: MirrorNetworkConfigLike;
export {};
//# sourceMappingURL=hedera_networks.d.ts.map