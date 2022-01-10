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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoidSigner = exports.Signer = void 0;
var bignumber_1 = require("@ethersproject/bignumber");
var bytes_1 = require("@ethersproject/bytes");
var properties_1 = require("@ethersproject/properties");
var logger_1 = require("@ethersproject/logger");
var _version_1 = require("./_version");
var address_1 = require("@ethersproject/address");
var sdk_1 = require("@hashgraph/sdk");
var logger = new logger_1.Logger(_version_1.version);
var allowedTransactionKeys = [
    "accessList", "chainId", "customData", "data", "from", "gasLimit", "maxFeePerGas", "maxPriorityFeePerGas", "to", "type", "value"
];
var forwardErrors = [
    logger_1.Logger.errors.INSUFFICIENT_FUNDS,
    logger_1.Logger.errors.NONCE_EXPIRED,
    logger_1.Logger.errors.REPLACEMENT_UNDERPRICED,
];
;
;
var Signer = /** @class */ (function () {
    ///////////////////
    // Sub-classes MUST call super
    function Signer() {
        var _newTarget = this.constructor;
        logger.checkAbstract(_newTarget, Signer);
        (0, properties_1.defineReadOnly)(this, "_isSigner", true);
    }
    /**
     * Signs a transaction with the key given upon creation.
     * The transaction can be:
     * - FileCreate - when there is only `fileChunk` field in the `transaction.customData` object
     * - FileAppend - when there is both `fileChunk` and a `fileId` fields
     * - ContractCreate - when there is a `bytecodeFileId` field
     * - ContractCall - when there is a `to` field present. Ignores the other fields
     *
     * @param transaction - the transaction to be signed.
     */
    Signer.prototype.signTransaction = function (transaction) {
        var _this = this;
        var _a, _b;
        var tx;
        var arrayifiedData = transaction.data ? (0, bytes_1.arrayify)(transaction.data) : new Uint8Array();
        var gas = numberify(transaction.gasLimit ? transaction.gasLimit : 0);
        if (transaction.to) {
            tx = new sdk_1.ContractExecuteTransaction()
                .setContractId(sdk_1.ContractId.fromSolidityAddress(transaction.to.toString()))
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
        return this.getAddress().then(function (address) {
            var accountID = (0, address_1.getAccountFromAddress)(address);
            tx.setTransactionId(sdk_1.TransactionId.generate(new sdk_1.AccountId({
                shard: numberify(accountID.shard),
                realm: numberify(accountID.realm),
                num: numberify(accountID.num)
            })))
                // FIXME - should be taken from the network/ wallet's provider
                .setNodeAccountIds([new sdk_1.AccountId(0, 0, 3)])
                .freeze();
            var pkey = sdk_1.PrivateKey.fromStringECDSA(_this._signingKey().privateKey);
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
        });
    };
    Signer.prototype.getGasPrice = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this._checkProvider("getGasPrice");
                        return [4 /*yield*/, this.provider.getGasPrice()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    ///////////////////
    // Sub-classes MAY override these
    Signer.prototype.getBalance = function (blockTag) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this._checkProvider("getBalance");
                        return [4 /*yield*/, this.provider.getBalance(this.getAddress(), blockTag)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Populates "from" if unspecified, and estimates the gas for the transaction
    Signer.prototype.estimateGas = function (transaction) {
        return __awaiter(this, void 0, void 0, function () {
            var tx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this._checkProvider("estimateGas");
                        return [4 /*yield*/, (0, properties_1.resolveProperties)(this.checkTransaction(transaction))];
                    case 1:
                        tx = _a.sent();
                        return [4 /*yield*/, this.provider.estimateGas(tx)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Populates "from" if unspecified, and calls with the transaction
    Signer.prototype.call = function (transaction, blockTag) {
        return __awaiter(this, void 0, void 0, function () {
            var tx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this._checkProvider("call");
                        return [4 /*yield*/, (0, properties_1.resolveProperties)(this.checkTransaction(transaction))];
                    case 1:
                        tx = _a.sent();
                        return [4 /*yield*/, this.provider.call(tx, blockTag)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Populates all fields in a transaction, signs it and sends it to the network
    Signer.prototype.sendTransaction = function (transaction) {
        return __awaiter(this, void 0, void 0, function () {
            var tx, signed, contractByteCode, chunks, fileCreate, signedFileCreate, resp, _i, _a, chunk, fileAppend, signedFileAppend, contractCreate, signedContractCreate;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, properties_1.resolveProperties)(transaction)];
                    case 1:
                        tx = _b.sent();
                        if (!tx.to) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.signTransaction(tx)];
                    case 2:
                        signed = _b.sent();
                        return [4 /*yield*/, this.provider.sendTransaction(signed)];
                    case 3: return [2 /*return*/, _b.sent()];
                    case 4:
                        contractByteCode = tx.data;
                        chunks = splitInChunks(Buffer.from(contractByteCode).toString(), 4096);
                        fileCreate = {
                            customData: {
                                fileChunk: chunks[0],
                                fileKey: sdk_1.PublicKey.fromString(this._signingKey().compressedPublicKey)
                            }
                        };
                        return [4 /*yield*/, this.signTransaction(fileCreate)];
                    case 5:
                        signedFileCreate = _b.sent();
                        return [4 /*yield*/, this.provider.sendTransaction(signedFileCreate)];
                    case 6:
                        resp = _b.sent();
                        _i = 0, _a = chunks.slice(1);
                        _b.label = 7;
                    case 7:
                        if (!(_i < _a.length)) return [3 /*break*/, 11];
                        chunk = _a[_i];
                        fileAppend = {
                            customData: {
                                fileId: resp.customData.fileId.toString(),
                                fileChunk: chunk
                            }
                        };
                        return [4 /*yield*/, this.signTransaction(fileAppend)];
                    case 8:
                        signedFileAppend = _b.sent();
                        return [4 /*yield*/, this.provider.sendTransaction(signedFileAppend)];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10:
                        _i++;
                        return [3 /*break*/, 7];
                    case 11:
                        contractCreate = {
                            gasLimit: tx.gasLimit,
                            customData: {
                                bytecodeFileId: resp.customData.fileId.toString()
                            }
                        };
                        return [4 /*yield*/, this.signTransaction(contractCreate)];
                    case 12:
                        signedContractCreate = _b.sent();
                        return [4 /*yield*/, this.provider.sendTransaction(signedContractCreate)];
                    case 13: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    Signer.prototype.getChainId = function () {
        return __awaiter(this, void 0, void 0, function () {
            var network;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this._checkProvider("getChainId");
                        return [4 /*yield*/, this.provider.getNetwork()];
                    case 1:
                        network = _a.sent();
                        return [2 /*return*/, network.chainId];
                }
            });
        });
    };
    Signer.prototype.resolveName = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this._checkProvider("resolveName");
                        return [4 /*yield*/, this.provider.resolveName(name)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Checks a transaction does not contain invalid keys and if
    // no "from" is provided, populates it.
    // - does NOT require a provider
    // - adds "from" is not present
    // - returns a COPY (safe to mutate the result)
    // By default called from: (overriding these prevents it)
    //   - call
    //   - estimateGas
    //   - populateTransaction (and therefor sendTransaction)
    Signer.prototype.checkTransaction = function (transaction) {
        for (var key in transaction) {
            if (allowedTransactionKeys.indexOf(key) === -1) {
                logger.throwArgumentError("invalid transaction key: " + key, "transaction", transaction);
            }
        }
        var tx = (0, properties_1.shallowCopy)(transaction);
        if (tx.from == null) {
            tx.from = this.getAddress();
        }
        else {
            // Make sure any provided address matches this signer
            tx.from = Promise.all([
                Promise.resolve(tx.from),
                this.getAddress()
            ]).then(function (result) {
                if (result[0].toString().toLowerCase() !== result[1].toLowerCase()) {
                    logger.throwArgumentError("from address mismatch", "transaction", transaction);
                }
                return result[0];
            });
        }
        return tx;
    };
    // Populates ALL keys for a transaction and checks that "from" matches
    // this Signer. Should be used by sendTransaction but NOT by signTransaction.
    // By default called from: (overriding these prevents it)
    //   - sendTransaction
    //
    // Notes:
    //  - We allow gasPrice for EIP-1559 as long as it matches maxFeePerGas
    Signer.prototype.populateTransaction = function (transaction) {
        return __awaiter(this, void 0, void 0, function () {
            var tx;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, properties_1.resolveProperties)(this.checkTransaction(transaction))];
                    case 1:
                        tx = _a.sent();
                        if (tx.to != null) {
                            tx.to = Promise.resolve(tx.to).then(function (to) { return __awaiter(_this, void 0, void 0, function () {
                                var address;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (to == null) {
                                                return [2 /*return*/, null];
                                            }
                                            return [4 /*yield*/, this.resolveName(to.toString())];
                                        case 1:
                                            address = _a.sent();
                                            if (address == null) {
                                                logger.throwArgumentError("provided ENS name resolves to null", "tx.to", to);
                                            }
                                            return [2 /*return*/, address];
                                    }
                                });
                            }); });
                            // Prevent this error from causing an UnhandledPromiseException
                            tx.to.catch(function (error) { });
                        }
                        // Do not allow mixing pre-eip-1559 and eip-1559 properties
                        // const hasEip1559 = (tx.maxFeePerGas != null || tx.maxPriorityFeePerGas != null);
                        // if (tx.gasPrice != null && (tx.type === 2 || hasEip1559)) {
                        //     logger.throwArgumentError("eip-1559 transaction do not support gasPrice", "transaction", transaction);
                        // } else if ((tx.type === 0 || tx.type === 1) && hasEip1559) {
                        //     logger.throwArgumentError("pre-eip-1559 transaction do not support maxFeePerGas/maxPriorityFeePerGas", "transaction", transaction);
                        // }
                        if ((tx.type === 2 || tx.type == null) && (tx.maxFeePerGas != null && tx.maxPriorityFeePerGas != null)) {
                            // Fully-formed EIP-1559 transaction (skip getFeeData)
                            tx.type = 2;
                        }
                        else if (tx.type === 0 || tx.type === 1) {
                            // Explicit Legacy or EIP-2930 transaction
                            // Populate missing gasPrice
                            // TODO: gas price
                            // if (tx.gasPrice == null) { tx.gasPrice = this.getGasPrice(); }
                        }
                        else {
                            /*
                            // We need to get fee data to determine things
                            // TODO: get the fee data somehow ( probably fee schedule in the hedera context )
                            // const feeData = await this.getFeeData();
                
                            if (tx.type == null) {
                                // We need to auto-detect the intended type of this transaction...
                
                                if (feeData.maxFeePerGas != null && feeData.maxPriorityFeePerGas != null) {
                                    // The network supports EIP-1559!
                
                                    // Upgrade transaction from null to eip-1559
                                    tx.type = 2;
                
                                    // if (tx.gasPrice != null) {
                                        // Using legacy gasPrice property on an eip-1559 network,
                                        // so use gasPrice as both fee properties
                                        // const gasPrice = tx.gasPrice;
                                        // delete tx.gasPrice;
                                        // tx.maxFeePerGas = gasPrice;
                                        // tx.maxPriorityFeePerGas = gasPrice;
                
                                    // } else {
                                    //     Populate missing fee data
                                        // if (tx.maxFeePerGas == null) { tx.maxFeePerGas = feeData.maxFeePerGas; }
                                        // if (tx.maxPriorityFeePerGas == null) { tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas; }
                                    // }
                
                                } else if (feeData.gasPrice != null) {
                                    // Network doesn't support EIP-1559...
                
                                    // ...but they are trying to use EIP-1559 properties
                                    if (hasEip1559) {
                                        logger.throwError("network does not support EIP-1559", Logger.errors.UNSUPPORTED_OPERATION, {
                                            operation: "populateTransaction"
                                        });
                                    }
                
                                    // Populate missing fee data
                                    // if (tx.gasPrice == null) { tx.gasPrice = feeData.gasPrice; }
                
                                    // Explicitly set untyped transaction to legacy
                                    tx.type = 0;
                
                                } else {
                                    // getFeeData has failed us.
                                    logger.throwError("failed to get consistent fee data", Logger.errors.UNSUPPORTED_OPERATION, {
                                        operation: "signer.getFeeData"
                                    });
                                }
                
                            } else if (tx.type === 2) {
                                // Explicitly using EIP-1559
                
                                // Populate missing fee data
                                if (tx.maxFeePerGas == null) { tx.maxFeePerGas = feeData.maxFeePerGas; }
                                if (tx.maxPriorityFeePerGas == null) { tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas; }
                            }
                            */
                        }
                        // if (tx.nonce == null) { tx.nonce = this.getTransactionCount("pending"); }
                        if (tx.gasLimit == null) {
                            tx.gasLimit = this.estimateGas(tx).catch(function (error) {
                                if (forwardErrors.indexOf(error.code) >= 0) {
                                    throw error;
                                }
                                return logger.throwError("cannot estimate gas; transaction may fail or may require manual gas limit", logger_1.Logger.errors.UNPREDICTABLE_GAS_LIMIT, {
                                    error: error,
                                    tx: tx
                                });
                            });
                        }
                        if (tx.chainId == null) {
                            tx.chainId = this.getChainId();
                        }
                        else {
                            tx.chainId = Promise.all([
                                Promise.resolve(tx.chainId),
                                this.getChainId()
                            ]).then(function (results) {
                                if (results[1] !== 0 && results[0] !== results[1]) {
                                    logger.throwArgumentError("chainId address mismatch", "transaction", transaction);
                                }
                                return results[0];
                            });
                        }
                        return [4 /*yield*/, (0, properties_1.resolveProperties)(tx)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    ///////////////////
    // Sub-classes SHOULD leave these alone
    Signer.prototype._checkProvider = function (operation) {
        if (!this.provider) {
            logger.throwError("missing provider", logger_1.Logger.errors.UNSUPPORTED_OPERATION, {
                operation: (operation || "_checkProvider")
            });
        }
    };
    Signer.isSigner = function (value) {
        return !!(value && value._isSigner);
    };
    return Signer;
}());
exports.Signer = Signer;
var VoidSigner = /** @class */ (function (_super) {
    __extends(VoidSigner, _super);
    function VoidSigner(address, provider) {
        var _newTarget = this.constructor;
        var _this = this;
        logger.checkNew(_newTarget, VoidSigner);
        _this = _super.call(this) || this;
        (0, properties_1.defineReadOnly)(_this, "address", address);
        (0, properties_1.defineReadOnly)(_this, "provider", provider || null);
        return _this;
    }
    VoidSigner.prototype.getAddress = function () {
        return Promise.resolve(this.address);
    };
    VoidSigner.prototype._fail = function (message, operation) {
        return Promise.resolve().then(function () {
            logger.throwError(message, logger_1.Logger.errors.UNSUPPORTED_OPERATION, { operation: operation });
        });
    };
    VoidSigner.prototype.signMessage = function (message) {
        return this._fail("VoidSigner cannot sign messages", "signMessage");
    };
    VoidSigner.prototype.signTransaction = function (transaction) {
        return this._fail("VoidSigner cannot sign transactions", "signTransaction");
    };
    VoidSigner.prototype._signTypedData = function (domain, types, value) {
        return this._fail("VoidSigner cannot sign typed data", "signTypedData");
    };
    VoidSigner.prototype.connect = function (provider) {
        return new VoidSigner(this.address, provider);
    };
    return VoidSigner;
}(Signer));
exports.VoidSigner = VoidSigner;
function splitInChunks(data, chunkSize) {
    var chunks = [];
    var num = 0;
    while (num <= data.length) {
        var slice = data.slice(num, chunkSize + num);
        num += chunkSize;
        chunks.push(slice);
    }
    return chunks;
}
function numberify(num) {
    return bignumber_1.BigNumber.from(num).toNumber();
}
//# sourceMappingURL=index.js.map