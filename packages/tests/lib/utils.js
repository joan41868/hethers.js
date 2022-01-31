/* istanbul ignore file */
'use strict';
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
exports.createWalletFromED25519 = exports.equals = exports.randomNumber = exports.randomHexString = exports.randomBytes = void 0;
var ethers_1 = require("ethers");
var sdk_1 = require("@hashgraph/sdk");
var proto_1 = require("@hashgraph/proto");
var exports_1 = require("@hashgraph/sdk/lib/exports");
var utils_1 = require("ethers/lib/utils");
function randomBytes(seed, lower, upper) {
    if (!upper) {
        upper = lower;
    }
    if (upper === 0 && upper === lower) {
        return new Uint8Array(0);
    }
    var result = ethers_1.ethers.utils.arrayify(ethers_1.ethers.utils.keccak256(ethers_1.ethers.utils.toUtf8Bytes(seed)));
    while (result.length < upper) {
        result = ethers_1.ethers.utils.concat([result, ethers_1.ethers.utils.keccak256(ethers_1.ethers.utils.concat([seed, result]))]);
    }
    var top = ethers_1.ethers.utils.arrayify(ethers_1.ethers.utils.keccak256(result));
    var percent = ((top[0] << 16) | (top[1] << 8) | top[2]) / 0x01000000;
    return result.slice(0, lower + Math.floor((upper - lower) * percent));
}
exports.randomBytes = randomBytes;
function randomHexString(seed, lower, upper) {
    return ethers_1.ethers.utils.hexlify(randomBytes(seed, lower, upper));
}
exports.randomHexString = randomHexString;
function randomNumber(seed, lower, upper) {
    var top = randomBytes(seed, 3);
    var percent = ((top[0] << 16) | (top[1] << 8) | top[2]) / 0x01000000;
    return lower + Math.floor((upper - lower) * percent);
}
exports.randomNumber = randomNumber;
function equals(a, b) {
    // Array (treat recursively)
    if (Array.isArray(a)) {
        if (!Array.isArray(b) || a.length !== b.length) {
            return false;
        }
        for (var i = 0; i < a.length; i++) {
            if (!equals(a[i], b[i])) {
                return false;
            }
        }
        return true;
    }
    // BigNumber
    if (a.eq) {
        if (!b.eq || !a.eq(b)) {
            return false;
        }
        return true;
    }
    // Uint8Array
    if (a.buffer) {
        if (!b.buffer || a.length !== b.length) {
            return false;
        }
        for (var i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }
    // Something else
    return a === b;
}
exports.equals = equals;
/**
 * Helper function that returns a Wallet instance from the provided ED25519 credentials,
 * provided from portal.hedera.com
 * @param account
 * @param provider
 */
var createWalletFromED25519 = function (account, provider, initialBalance) {
    if (initialBalance === void 0) { initialBalance = 0; }
    return __awaiter(void 0, void 0, void 0, function () {
        var edPrivateKey, client, randomWallet, protoKey, newAccountKey, accountCreate, receipt, newAccountId, hederaEoa;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    edPrivateKey = sdk_1.PrivateKey.fromString(account.operator.privateKey);
                    client = sdk_1.Client.forNetwork(account.network);
                    randomWallet = ethers_1.ethers.Wallet.createRandom();
                    protoKey = proto_1.Key.create({
                        ECDSASecp256k1: (0, utils_1.arrayify)(randomWallet._signingKey().compressedPublicKey)
                    });
                    newAccountKey = exports_1.Key._fromProtobufKey(protoKey);
                    return [4 /*yield*/, new sdk_1.AccountCreateTransaction()
                            .setKey(newAccountKey)
                            .setTransactionId(sdk_1.TransactionId.generate(account.operator.accountId))
                            .setInitialBalance(new sdk_1.Hbar(initialBalance))
                            .setNodeAccountIds([new sdk_1.AccountId(0, 0, 3)])
                            .freeze()
                            .sign(edPrivateKey)];
                case 1: return [4 /*yield*/, (_a.sent())
                        .execute(client)];
                case 2:
                    accountCreate = _a.sent();
                    return [4 /*yield*/, accountCreate.getReceipt(client)];
                case 3:
                    receipt = _a.sent();
                    newAccountId = receipt.accountId.toString();
                    hederaEoa = {
                        account: newAccountId,
                        privateKey: randomWallet.privateKey
                    };
                    // @ts-ignore
                    return [2 /*return*/, new ethers_1.ethers.Wallet(hederaEoa, provider)];
            }
        });
    });
};
exports.createWalletFromED25519 = createWalletFromED25519;
//# sourceMappingURL=utils.js.map