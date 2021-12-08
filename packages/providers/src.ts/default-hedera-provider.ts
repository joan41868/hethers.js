import { BaseProvider } from "./base-provider";
import { Networkish } from "@ethersproject/networks";

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
    consensusNodeUrl: string;
    constructor(network: Networkish, options?: {
        mirrorNodeUrl?: string,
        consensusNodeUrl?: string
    }) {
        super(network);
        if (options == null) {
            options = {};
        }
        this.consensusNodeUrl = options.consensusNodeUrl;
    }
}

