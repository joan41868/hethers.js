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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultHederaProvider = exports.HederaNetworks = void 0;
var base_provider_1 = require("./base-provider");
var sdk_1 = require("@hashgraph/sdk");
var bignumber_1 = require("@ethersproject/bignumber");
var utils_1 = require("ethers/lib/utils");
var axios_1 = __importDefault(require("axios"));
var logger_1 = require("@ethersproject/logger");
var _version_1 = require("./_version");
var logger = new logger_1.Logger(_version_1.version);
function sleep(timeout) {
    return new Promise(function (res) {
        setTimeout(res, timeout);
    });
}
// resolves network string to a hedera network name
function getNetwork(net) {
    switch (net) {
        case 'mainnet':
            return sdk_1.NetworkName.Mainnet;
        case 'previewnet':
            return sdk_1.NetworkName.Previewnet;
        case 'testnet':
            return sdk_1.NetworkName.Testnet;
        default:
            throw new Error("Invalid network name");
    }
}
// resolves the mirror node url from the given provider network.
function resolveMirrorNetGetTransactionUrl(net) {
    switch (net) {
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
    function DefaultHederaProvider(network) {
        var _this = _super.call(this, 'testnet') || this;
        _this.hederaNetwork = network;
        _this.hederaClient = sdk_1.Client.forName(getNetwork(network));
        return _this;
    }
    /**
     *  AccountBalance query implementation, using the hashgraph sdk.
     *  It returns the HBar balance of the given address.
     *
     * @param addressOrName The address to check balance of
     * @param blockTag -  not used. Will throw if used.
     */
    DefaultHederaProvider.prototype.getBalance = function (addressOrName, blockTag) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, shard, realm, num, shardNum, realmNum, accountNum, balance;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = blockTag;
                        if (_a) return [3 /*break*/, 2];
                        return [4 /*yield*/, blockTag];
                    case 1:
                        _a = (_c.sent());
                        _c.label = 2;
                    case 2:
                        if (_a) {
                            logger.throwArgumentError("Cannot use blockTag for hedera services.", "", "");
                            return [2 /*return*/, bignumber_1.BigNumber.from(0)];
                        }
                        return [4 /*yield*/, addressOrName];
                    case 3:
                        addressOrName = _c.sent();
                        _b = (0, utils_1.getAccountFromAddress)(addressOrName), shard = _b.shard, realm = _b.realm, num = _b.num;
                        shardNum = bignumber_1.BigNumber.from(shard).toNumber();
                        realmNum = bignumber_1.BigNumber.from(realm).toNumber();
                        accountNum = bignumber_1.BigNumber.from(num).toNumber();
                        return [4 /*yield*/, new sdk_1.AccountBalanceQuery()
                                .setAccountId(new sdk_1.AccountId({ shard: shardNum, realm: realmNum, num: accountNum }))
                                .execute(this.hederaClient)];
                    case 4:
                        balance = _c.sent();
                        return [2 /*return*/, bignumber_1.BigNumber.from(balance.hbars.toTinybars().toNumber())];
                }
            });
        });
    };
    /**
     * Transaction record query implementation using the mirror node REST API.
     *
     * @param txId - id of the transaction to search for
     */
    DefaultHederaProvider.prototype.getTransaction = function (txId) {
        return __awaiter(this, void 0, void 0, function () {
            var ep, url, maxRetries, counter, data, filtered;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, txId];
                    case 1:
                        txId = _a.sent();
                        ep = '/api/v1/transactions';
                        url = resolveMirrorNetGetTransactionUrl(this.hederaNetwork);
                        maxRetries = 10;
                        counter = 0;
                        _a.label = 2;
                    case 2:
                        if (!true) return [3 /*break*/, 5];
                        if (counter >= maxRetries) {
                            logger.info('Giving up after 10 retries.');
                            return [2 /*return*/, []];
                        }
                        return [4 /*yield*/, axios_1.default.get(url + ep)];
                    case 3:
                        data = (_a.sent()).data;
                        filtered = data.transactions
                            .filter(function (e) { return e.transaction_id === txId; });
                        if (filtered.length > 0) {
                            return [2 /*return*/, filtered[0]];
                        }
                        return [4 /*yield*/, sleep(1000)];
                    case 4:
                        _a.sent();
                        counter++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    DefaultHederaProvider.prototype.getClient = function () {
        return this.hederaClient;
    };
    return DefaultHederaProvider;
}(base_provider_1.BaseProvider));
exports.DefaultHederaProvider = DefaultHederaProvider;
//# sourceMappingURL=hedera-provider.js.map