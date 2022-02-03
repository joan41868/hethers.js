"use strict";

import {
    Block,
    BlockTag,
    EventType,
    FeeData,
    Filter,
    Log,
    Listener,
    Provider,
    TransactionReceipt,
    TransactionRequest,
    TransactionResponse
} from "@ethersproject/abstract-provider";

import { getNetwork } from "@ethersproject/networks";
import { Network, Networkish } from "@ethersproject/networks";

import { BaseProvider, Resolver } from "./base-provider";

import { FallbackProviderConfig } from "./fallback-provider";
import { DefaultHederaProvider } from "./default-hedera-provider";
import {
    CommunityResourcable,
    Formatter,
    isCommunityResourcable,
    isCommunityResource,
    showThrottleMessage
} from "./formatter";

import { Logger } from "@ethersproject/logger";
import { version } from "./_version";
import HederaProvider from "./hedera-provider";

const logger = new Logger(version);

////////////////////////
// Helper Functions

function getDefaultProvider(network?: Networkish, options?: any): BaseProvider {
    if (network == null) { network = "mainnet"; }

    // If passed a URL, figure out the right type of provider based on the scheme
    if (typeof (network) === "string") {

        // Handle http and ws (and their secure variants)
        const match = network.match(/^(ws|http)s?:/i);
        if (match) {
            switch (match[1]) {
                // case "http":
                //     return new JsonRpcProvider(network);
                default:
                    logger.throwArgumentError("unsupported URL scheme", "network", network);
            }
        }
    }

    const n = getNetwork(network);
    if (!n || !n._defaultProvider) {
        logger.throwError("unsupported getDefaultProvider network", Logger.errors.NETWORK_ERROR, {
            operation: "getDefaultProvider",
            network: network
        });
    }

    return n._defaultProvider({
        HederaProvider,
        DefaultHederaProvider,
    }, options);
}

////////////////////////
// Exports

export {

    // Abstract Providers (or Abstract-ish)
    Provider,
    BaseProvider,

    Resolver,


    ///////////////////////
    // Concrete Providers


    DefaultHederaProvider,
    HederaProvider,
    ///////////////////////
    // Signer


    ///////////////////////
    // Functions

    getDefaultProvider,
    getNetwork,
    isCommunityResource,
    isCommunityResourcable,
    showThrottleMessage,


    ///////////////////////
    // Objects

    Formatter,


    ///////////////////////
    // Types

    Block,
    BlockTag,
    EventType,
    FeeData,
    Filter,
    Log,
    Listener,
    TransactionReceipt,
    TransactionRequest,
    TransactionResponse,

    FallbackProviderConfig,

    Network,
    Networkish,


    CommunityResourcable
};

