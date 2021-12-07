"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Formatter = exports.showThrottleMessage = exports.isCommunityResourcable = exports.isCommunityResource = exports.getNetwork = exports.getDefaultProvider = exports.DefaultHederaProvider = exports.Resolver = exports.BaseProvider = exports.Provider = void 0;
var abstract_provider_1 = require("@ethersproject/abstract-provider");
Object.defineProperty(exports, "Provider", { enumerable: true, get: function () { return abstract_provider_1.Provider; } });
var networks_1 = require("@ethersproject/networks");
Object.defineProperty(exports, "getNetwork", { enumerable: true, get: function () { return networks_1.getNetwork; } });
var base_provider_1 = require("./base-provider");
Object.defineProperty(exports, "BaseProvider", { enumerable: true, get: function () { return base_provider_1.BaseProvider; } });
Object.defineProperty(exports, "Resolver", { enumerable: true, get: function () { return base_provider_1.Resolver; } });
var default_hedera_provider_1 = require("./default-hedera-provider");
Object.defineProperty(exports, "DefaultHederaProvider", { enumerable: true, get: function () { return default_hedera_provider_1.DefaultHederaProvider; } });
var formatter_1 = require("./formatter");
Object.defineProperty(exports, "Formatter", { enumerable: true, get: function () { return formatter_1.Formatter; } });
Object.defineProperty(exports, "isCommunityResourcable", { enumerable: true, get: function () { return formatter_1.isCommunityResourcable; } });
Object.defineProperty(exports, "isCommunityResource", { enumerable: true, get: function () { return formatter_1.isCommunityResource; } });
Object.defineProperty(exports, "showThrottleMessage", { enumerable: true, get: function () { return formatter_1.showThrottleMessage; } });
var logger_1 = require("@ethersproject/logger");
var _version_1 = require("./_version");
var logger = new logger_1.Logger(_version_1.version);
////////////////////////
// Helper Functions
function getDefaultProvider(network, options) {
    if (network == null) {
        network = "mainnet";
    }
    // If passed a URL, figure out the right type of provider based on the scheme
    if (typeof (network) === "string") {
        // Handle http and ws (and their secure variants)
        var match = network.match(/^(ws|http)s?:/i);
        if (match) {
            switch (match[1]) {
                // case "http":
                //     return new JsonRpcProvider(network);
                default:
                    logger.throwArgumentError("unsupported URL scheme", "network", network);
            }
        }
    }
    var n = (0, networks_1.getNetwork)(network);
    if (!n || !n._defaultProvider) {
        logger.throwError("unsupported getDefaultProvider network", logger_1.Logger.errors.NETWORK_ERROR, {
            operation: "getDefaultProvider",
            network: network
        });
    }
    return n._defaultProvider({
        DefaultHederaProvider: default_hedera_provider_1.DefaultHederaProvider,
    }, options);
}
exports.getDefaultProvider = getDefaultProvider;
//# sourceMappingURL=index.js.map