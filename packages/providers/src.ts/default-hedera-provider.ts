import { BaseProvider } from "./base-provider";
import { Network, Networkish } from "@ethersproject/networks";
import { logger } from "ethers";

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
        // automatically resolve to a mirror node URL by the given network ( will select test mirror node for testnet )
        if (!options.mirrorNodeUrl) {
            this.mirrorNodeUrl = resolveMirrorNetworkUrl(this._network);
        } else {
            // always prefer the given URL if explicitly given
            this.mirrorNodeUrl = options.mirrorNodeUrl;
        }
        this.consensusNodeUrl = options.consensusNodeUrl;
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
