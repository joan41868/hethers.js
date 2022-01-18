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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTypedData = exports.verifyMessage = exports.Wallet = void 0;
var address_1 = require("@ethersproject/address");
var abstract_provider_1 = require("@ethersproject/abstract-provider");
var abstract_signer_1 = require("@ethersproject/abstract-signer");
var bytes_1 = require("@ethersproject/bytes");
var hash_1 = require("@ethersproject/hash");
var hdnode_1 = require("@ethersproject/hdnode");
var keccak256_1 = require("@ethersproject/keccak256");
var properties_1 = require("@ethersproject/properties");
var random_1 = require("@ethersproject/random");
var signing_key_1 = require("@ethersproject/signing-key");
var json_wallets_1 = require("@ethersproject/json-wallets");
var transactions_1 = require("@ethersproject/transactions");
var logger_1 = require("@ethersproject/logger");
var _version_1 = require("./_version");
var sdk_1 = require("@hashgraph/sdk");
var proto_1 = require("@hashgraph/proto");
var bignumber_1 = require("@ethersproject/bignumber");
var Long = __importStar(require("long"));
var logger = new logger_1.Logger(_version_1.version);
function isAccount(value) {
    return value != null && (0, bytes_1.isHexString)(value.privateKey, 32);
}
function hasMnemonic(value) {
    var mnemonic = value.mnemonic;
    return (mnemonic && mnemonic.phrase);
}
function hasAlias(value) {
    return isAccount(value) && value.alias != null;
}
var Wallet = /** @class */ (function (_super) {
    __extends(Wallet, _super);
    function Wallet(identity, provider) {
        var _newTarget = this.constructor;
        var _this = this;
        logger.checkNew(_newTarget, Wallet);
        _this = _super.call(this) || this;
        if (isAccount(identity) && !signing_key_1.SigningKey.isSigningKey(identity)) {
            var signingKey_1 = new signing_key_1.SigningKey(identity.privateKey);
            (0, properties_1.defineReadOnly)(_this, "_signingKey", function () { return signingKey_1; });
            if (identity.address || identity.account) {
                (0, properties_1.defineReadOnly)(_this, "address", identity.address ? (0, address_1.getAddress)(identity.address) : (0, address_1.getAddressFromAccount)(identity.account));
                (0, properties_1.defineReadOnly)(_this, "account", identity.account ? identity.account : (0, address_1.getAccountFromAddress)(identity.address));
            }
            if (hasAlias(identity)) {
                (0, properties_1.defineReadOnly)(_this, "alias", identity.alias);
                if (_this.alias !== (0, transactions_1.computeAlias)(signingKey_1.privateKey)) {
                    logger.throwArgumentError("privateKey/alias mismatch", "privateKey", "[REDACTED]");
                }
            }
            if (hasMnemonic(identity)) {
                var srcMnemonic_1 = identity.mnemonic;
                (0, properties_1.defineReadOnly)(_this, "_mnemonic", function () { return ({
                    phrase: srcMnemonic_1.phrase,
                    path: srcMnemonic_1.path || hdnode_1.defaultPath,
                    locale: srcMnemonic_1.locale || "en"
                }); });
                var mnemonic = _this.mnemonic;
                var node = hdnode_1.HDNode.fromMnemonic(mnemonic.phrase, null, mnemonic.locale).derivePath(mnemonic.path);
                if (node.privateKey !== _this._signingKey().privateKey) {
                    logger.throwArgumentError("mnemonic/privateKey mismatch", "privateKey", "[REDACTED]");
                }
            }
            else {
                (0, properties_1.defineReadOnly)(_this, "_mnemonic", function () { return null; });
            }
        }
        else {
            if (signing_key_1.SigningKey.isSigningKey(identity)) {
                /* istanbul ignore if */
                if (identity.curve !== "secp256k1") {
                    logger.throwArgumentError("unsupported curve; must be secp256k1", "privateKey", "[REDACTED]");
                }
                (0, properties_1.defineReadOnly)(_this, "_signingKey", function () { return identity; });
            }
            else {
                // A lot of common tools do not prefix private keys with a 0x (see: #1166)
                if (typeof (identity) === "string") {
                    if (identity.match(/^[0-9a-f]*$/i) && identity.length === 64) {
                        identity = "0x" + identity;
                    }
                }
                var signingKey_2 = new signing_key_1.SigningKey(identity);
                (0, properties_1.defineReadOnly)(_this, "_signingKey", function () { return signingKey_2; });
            }
            (0, properties_1.defineReadOnly)(_this, "_mnemonic", function () { return null; });
            (0, properties_1.defineReadOnly)(_this, "alias", (0, transactions_1.computeAlias)(_this._signingKey().privateKey));
        }
        /* istanbul ignore if */
        if (provider && !abstract_provider_1.Provider.isProvider(provider)) {
            logger.throwArgumentError("invalid provider", "provider", provider);
        }
        (0, properties_1.defineReadOnly)(_this, "provider", provider || null);
        return _this;
    }
    Object.defineProperty(Wallet.prototype, "mnemonic", {
        get: function () {
            return this._mnemonic();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Wallet.prototype, "privateKey", {
        get: function () {
            return this._signingKey().privateKey;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Wallet.prototype, "publicKey", {
        get: function () {
            return this._signingKey().publicKey;
        },
        enumerable: false,
        configurable: true
    });
    Wallet.prototype.getAddress = function () {
        return Promise.resolve(this.address);
    };
    Wallet.prototype.getAccount = function () {
        return Promise.resolve(this.account);
    };
    Wallet.prototype.getAlias = function () {
        return Promise.resolve(this.alias);
    };
    Wallet.prototype.connect = function (provider) {
        return new Wallet(this, provider);
    };
    Wallet.prototype.connectAccount = function (accountLike) {
        var eoa = {
            privateKey: this._signingKey().privateKey,
            address: (0, address_1.getAddressFromAccount)(accountLike),
            alias: this.alias,
            mnemonic: this._mnemonic()
        };
        return new Wallet(eoa, this.provider);
    };
    Wallet.prototype.signTransaction = function (transaction) {
        var _this = this;
        var _a, _b;
        this._checkAddress('signTransaction');
        if (transaction.from) {
            if ((0, address_1.getAddressFromAccount)(transaction.from) !== this.address) {
                logger.throwArgumentError("transaction from address mismatch", "transaction.from", transaction.from);
            }
        }
        var tx;
        var arrayifiedData = transaction.data ? (0, bytes_1.arrayify)(transaction.data) : new Uint8Array();
        var gas = (0, bignumber_1.numberify)(transaction.gasLimit ? transaction.gasLimit : 0);
        if (transaction.to) {
            tx = new sdk_1.ContractExecuteTransaction()
                .setContractId(sdk_1.ContractId.fromSolidityAddress((0, address_1.getAddressFromAccount)(transaction.to)))
                .setFunctionParameters(arrayifiedData)
                .setGas(gas);
            if (transaction.value) {
                tx.setPayableAmount((_a = transaction.value) === null || _a === void 0 ? void 0 : _a.toString());
            }
        }
        else {
            if (transaction.customData.bytecodeFileId) {
                tx = new sdk_1.ContractCreateTransaction()
                    .setBytecodeFileId(transaction.customData.bytecodeFileId)
                    .setConstructorParameters(arrayifiedData)
                    .setInitialBalance((_b = transaction.value) === null || _b === void 0 ? void 0 : _b.toString())
                    .setGas(gas);
            }
            else {
                if (transaction.customData.fileChunk && transaction.customData.fileId) {
                    tx = new sdk_1.FileAppendTransaction()
                        .setContents(transaction.customData.fileChunk)
                        .setFileId(transaction.customData.fileId);
                }
                else if (!transaction.customData.fileId && transaction.customData.fileChunk) {
                    // only a chunk, thus the first one
                    tx = new sdk_1.FileCreateTransaction()
                        .setContents(transaction.customData.fileChunk)
                        .setKeys([transaction.customData.fileKey ?
                            transaction.customData.fileKey :
                            sdk_1.PublicKey.fromString(this._signingKey().compressedPublicKey)]);
                }
                else {
                    logger.throwArgumentError("Cannot determine transaction type from given custom data. Need either `to`, `fileChunk`, `fileId` or `bytecodeFileId`", logger_1.Logger.errors.INVALID_ARGUMENT, transaction);
                }
            }
        }
        var account = (0, address_1.getAccountFromAddress)(this.address);
        tx.setTransactionId(sdk_1.TransactionId.generate(new sdk_1.AccountId({
            shard: (0, bignumber_1.numberify)(account.shard),
            realm: (0, bignumber_1.numberify)(account.realm),
            num: (0, bignumber_1.numberify)(account.num)
        })))
            // FIXME - should be taken from the network/ wallet's provider
            .setNodeAccountIds([new sdk_1.AccountId(0, 0, 3)])
            .freeze();
        var pkey = sdk_1.PrivateKey.fromStringECDSA(this._signingKey().privateKey);
        return new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
            var signed;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, tx.sign(pkey)];
                    case 1:
                        signed = _a.sent();
                        resolve((0, bytes_1.hexlify)(signed.toBytes()));
                        return [2 /*return*/];
                }
            });
        }); });
    };
    Wallet.prototype.signMessage = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, bytes_1.joinSignature)(this._signingKey().signDigest((0, hash_1.hashMessage)(message)))];
            });
        });
    };
    // TODO to be revised
    Wallet.prototype._signTypedData = function (domain, types, value) {
        return __awaiter(this, void 0, void 0, function () {
            var populated;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, hash_1._TypedDataEncoder.resolveNames(domain, types, value, function (name) {
                            if (_this.provider == null) {
                                logger.throwError("cannot resolve ENS names without a provider", logger_1.Logger.errors.UNSUPPORTED_OPERATION, {
                                    operation: "resolveName",
                                    value: name
                                });
                            }
                            return _this.provider.resolveName(name);
                        })];
                    case 1:
                        populated = _a.sent();
                        return [2 /*return*/, (0, bytes_1.joinSignature)(this._signingKey().signDigest(hash_1._TypedDataEncoder.hash(populated.domain, types, populated.value)))];
                }
            });
        });
    };
    Wallet.prototype.encrypt = function (password, options, progressCallback) {
        if (typeof (options) === "function" && !progressCallback) {
            progressCallback = options;
            options = {};
        }
        if (progressCallback && typeof (progressCallback) !== "function") {
            throw new Error("invalid callback");
        }
        if (!options) {
            options = {};
        }
        return (0, json_wallets_1.encryptKeystore)(this, password, options, progressCallback);
    };
    Wallet.prototype.call = function (txRequest, blockTag) {
        return __awaiter(this, void 0, void 0, function () {
            var tx, contractAccountLikeID, contractId, thisAcc, _a, thisAccId, nodeID, paymentTxId, hederaTx, paymentBody, signed, walletKey, signature, transferSignedTransactionBytes, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this._checkProvider("call");
                        return [4 /*yield*/, (0, properties_1.resolveProperties)(this.checkTransaction(txRequest))];
                    case 1:
                        tx = _b.sent();
                        contractAccountLikeID = (0, address_1.getAccountFromAddress)(tx.to.toString());
                        contractId = contractAccountLikeID.shard + "." + contractAccountLikeID.realm + "." + contractAccountLikeID.num;
                        _a = address_1.getAccountFromAddress;
                        return [4 /*yield*/, this.getAddress()];
                    case 2:
                        thisAcc = _a.apply(void 0, [_b.sent()]);
                        thisAccId = thisAcc.shard + "." + thisAcc.realm + "." + thisAcc.num;
                        nodeID = sdk_1.AccountId.fromString(tx.nodeId.toString());
                        paymentTxId = sdk_1.TransactionId.generate(thisAccId);
                        hederaTx = new sdk_1.ContractCallQuery()
                            .setContractId(contractId)
                            .setFunctionParameters((0, bytes_1.arrayify)(tx.data))
                            .setNodeAccountIds([nodeID])
                            .setGas(Long.fromString(tx.gasLimit.toString()))
                            .setPaymentTransactionId(paymentTxId);
                        paymentBody = {
                            transactionID: paymentTxId._toProtobuf(),
                            nodeAccountID: nodeID._toProtobuf(),
                            transactionFee: new sdk_1.Hbar(1).toTinybars(),
                            transactionValidDuration: {
                                seconds: Long.fromInt(120),
                            },
                            cryptoTransfer: {
                                transfers: {
                                    accountAmounts: [
                                        {
                                            accountID: sdk_1.AccountId.fromString(thisAccId)._toProtobuf(),
                                            amount: new sdk_1.Hbar(3).negated().toTinybars()
                                        },
                                        {
                                            accountID: nodeID._toProtobuf(),
                                            amount: new sdk_1.Hbar(3).toTinybars()
                                        }
                                    ],
                                },
                            },
                        };
                        signed = {
                            bodyBytes: proto_1.TransactionBody.encode(paymentBody).finish(),
                            sigMap: {}
                        };
                        walletKey = sdk_1.PrivateKey.fromStringECDSA(this._signingKey().privateKey);
                        signature = walletKey.sign(signed.bodyBytes);
                        signed.sigMap = {
                            sigPair: [walletKey.publicKey._toProtobufSignature(signature)]
                        };
                        transferSignedTransactionBytes = proto_1.SignedTransaction.encode(signed).finish();
                        hederaTx._paymentTransactions.push({
                            signedTransactionBytes: transferSignedTransactionBytes
                        });
                        return [4 /*yield*/, hederaTx.execute(this.provider.getHederaClient())];
                    case 3:
                        response = _b.sent();
                        // TODO: this may not be the best thing to return but it should work for testing
                        return [2 /*return*/, (0, bytes_1.hexlify)(response.asBytes())];
                }
            });
        });
    };
    /**
     *  Static methods to create Wallet instances.
     */
    Wallet.createRandom = function (options) {
        var entropy = (0, random_1.randomBytes)(16);
        if (!options) {
            options = {};
        }
        if (options.extraEntropy) {
            entropy = (0, bytes_1.arrayify)((0, bytes_1.hexDataSlice)((0, keccak256_1.keccak256)((0, bytes_1.concat)([entropy, options.extraEntropy])), 0, 16));
        }
        var mnemonic = (0, hdnode_1.entropyToMnemonic)(entropy, options.locale);
        return Wallet.fromMnemonic(mnemonic, options.path, options.locale);
    };
    Wallet.fromEncryptedJson = function (json, password, progressCallback) {
        return (0, json_wallets_1.decryptJsonWallet)(json, password, progressCallback).then(function (account) {
            return new Wallet(account);
        });
    };
    Wallet.fromEncryptedJsonSync = function (json, password) {
        return new Wallet((0, json_wallets_1.decryptJsonWalletSync)(json, password));
    };
    Wallet.fromMnemonic = function (mnemonic, path, wordlist) {
        if (!path) {
            path = hdnode_1.defaultPath;
        }
        return new Wallet(hdnode_1.HDNode.fromMnemonic(mnemonic, null, wordlist).derivePath(path));
    };
    Wallet.prototype._checkAddress = function (operation) {
        if (!this.address) {
            logger.throwError("missing address", logger_1.Logger.errors.UNSUPPORTED_OPERATION, {
                operation: (operation || "_checkAddress")
            });
        }
    };
    return Wallet;
}(abstract_signer_1.Signer));
exports.Wallet = Wallet;
// TODO to be revised
function verifyMessage(message, signature) {
    return (0, transactions_1.recoverAddress)((0, hash_1.hashMessage)(message), signature);
}
exports.verifyMessage = verifyMessage;
// TODO to be revised
function verifyTypedData(domain, types, value, signature) {
    return (0, transactions_1.recoverAddress)(hash_1._TypedDataEncoder.hash(domain, types, value), signature);
}
exports.verifyTypedData = verifyTypedData;
//# sourceMappingURL=index.js.map