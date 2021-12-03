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

import { BaseProvider, EnsProvider, EnsResolver, Resolver } from "./base-provider";

import { AlchemyProvider, AlchemyWebSocketProvider } from "./alchemy-provider";
import { CloudflareProvider } from "./cloudflare-provider";
import { EtherscanProvider } from "./etherscan-provider";
import { Web3Provider } from "./web3-provider";
import { FallbackProvider, FallbackProviderConfig } from "./fallback-provider";
import { InfuraProvider, InfuraWebSocketProvider } from "./infura-provider";
import { JsonRpcProvider, JsonRpcSigner } from "./json-rpc-provider";
import { JsonRpcBatchProvider } from "./json-rpc-batch-provider";
import { StaticJsonRpcProvider, UrlJsonRpcProvider } from "./url-json-rpc-provider";
import { WebSocketProvider } from "./websocket-provider";
import { ExternalProvider, JsonRpcFetchFunc } from "./web3-provider";
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
                case "http":
                    return new JsonRpcProvider(network);
                case "ws":
                    return new WebSocketProvider(network);
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
        DefaultHederaProvider,
        FallbackProvider,
        AlchemyProvider,
        EtherscanProvider,
        InfuraProvider,
        JsonRpcProvider,
    }, options);
}

////////////////////////
// Exports

export {

    // Abstract Providers (or Abstract-ish)
    Provider,
    BaseProvider,

    Resolver,

    UrlJsonRpcProvider,

    ///////////////////////
    // Concrete Providers

    FallbackProvider,
    Web3Provider,
    AlchemyProvider,
    AlchemyWebSocketProvider,
    CloudflareProvider,
    EtherscanProvider,
    InfuraProvider,
    InfuraWebSocketProvider,
    JsonRpcProvider,
    JsonRpcBatchProvider,
    StaticJsonRpcProvider,
    WebSocketProvider,

    DefaultHederaProvider,

    ///////////////////////
    // Signer

    JsonRpcSigner,


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

    ExternalProvider,
    JsonRpcFetchFunc,

    FallbackProviderConfig,

    Network,
    Networkish,

    EnsProvider,
    EnsResolver,

    CommunityResourcable
};

