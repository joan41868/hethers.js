"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultHederaProvider = exports.HederaNetworks = void 0;
var base_provider_1 = require("./base-provider");
var ethers_1 = require("ethers");
// contains predefined, sdk acceptable hedera network strings
var HederaNetworks;
(function (HederaNetworks) {
    HederaNetworks["TESTNET"] = "testnet";
    HederaNetworks["PREVIEWNET"] = "previewnet";
    HederaNetworks["MAINNET"] = "mainnet";
})(HederaNetworks = exports.HederaNetworks || (exports.HederaNetworks = {}));
/**
 * The hedera provider uses the hashgraph module to establish a connection to the Hedera network.
 * As every provider, this one also gives us read-only access.
 *
 * Constructable with a string, which automatically resolves to a hedera network via the hashgraph SDK.
 */
var DefaultHederaProvider = /** @class */ (function (_super) {
    __extends(DefaultHederaProvider, _super);
    function DefaultHederaProvider(network, options) {
        var _this = _super.call(this, network) || this;
        if (options == null) {
            options = {};
        }
        // automatically resolve to a mirror node URL by the given network ( will select test mirror node for testnet )
        if (!options.mirrorNodeUrl) {
            _this.mirrorNodeUrl = resolveMirrorNetworkUrl(_this._network);
        }
        else {
            // always prefer the given URL if explicitly given
            _this.mirrorNodeUrl = options.mirrorNodeUrl;
        }
        _this.consensusNodeUrl = options.consensusNodeUrl;
        return _this;
    }
    return DefaultHederaProvider;
}(base_provider_1.BaseProvider));
exports.DefaultHederaProvider = DefaultHederaProvider;
// resolves the mirror node url from the given provider network.
function resolveMirrorNetworkUrl(net) {
    switch (net.name) {
        case 'mainnet':
            return 'https://mainnet.mirrornode.hedera.com';
        case 'previewnet':
            return 'https://previewnet.mirrornode.hedera.com';
        case 'testnet':
            return 'https://testnet.mirrornode.hedera.com';
        default:
            ethers_1.logger.throwArgumentError("Invalid network name", "network", net);
            return null;
    }
}
//# sourceMappingURL=default-hedera-provider.js.map