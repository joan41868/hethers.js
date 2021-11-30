"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getAccountFromAddress, getAddress, getAddressFromAccount, parseAccount } from "@ethersproject/address";
import { Provider } from "@ethersproject/abstract-provider";
import { Signer } from "@ethersproject/abstract-signer";
import { arrayify, concat, hexDataSlice, isHexString, joinSignature } from "@ethersproject/bytes";
import { _TypedDataEncoder, hashMessage } from "@ethersproject/hash";
import { defaultPath, entropyToMnemonic, HDNode } from "@ethersproject/hdnode";
import { keccak256 } from "@ethersproject/keccak256";
import { defineReadOnly, resolveProperties } from "@ethersproject/properties";
import { randomBytes } from "@ethersproject/random";
import { SigningKey } from "@ethersproject/signing-key";
import { decryptJsonWallet, decryptJsonWalletSync, encryptKeystore } from "@ethersproject/json-wallets";
import { recoverAddress, serialize } from "@ethersproject/transactions";
import { Logger } from "@ethersproject/logger";
import { version } from "./_version";
const logger = new Logger(version);
function isEOA(value) {
    return (value != null && isHexString(value.privateKey, 32) && value.address != null);
}
function isHederaAccount(value) {
    return (value != null && isHexString(value.privateKey, 32) && value.account != null);
}
function hasMnemonic(value) {
    const mnemonic = value.mnemonic;
    return (mnemonic && mnemonic.phrase);
}
export class Wallet extends Signer {
    constructor(acc, provider) {
        logger.checkNew(new.target, Wallet);
        super();
        if (isEOA(acc) || isHederaAccount(acc)) {
            const signingKey = new SigningKey(acc.privateKey);
            defineReadOnly(this, "_signingKey", () => signingKey);
            defineReadOnly(this, "address", isEOA(acc) ? getAddress(acc.address) : getAddressFromAccount(acc.account));
            defineReadOnly(this, "account", isEOA(acc) ? getAccountFromAddress(acc.address) : parseAccount(acc.account));
            if (hasMnemonic(acc)) {
                const srcMnemonic = acc.mnemonic;
                defineReadOnly(this, "_mnemonic", () => ({
                    phrase: srcMnemonic.phrase,
                    path: srcMnemonic.path || defaultPath,
                    locale: srcMnemonic.locale || "en"
                }));
                const mnemonic = this.mnemonic;
                const node = HDNode.fromMnemonic(mnemonic.phrase, null, mnemonic.locale).derivePath(mnemonic.path);
                if (node.privateKey !== this._signingKey().privateKey) {
                    logger.throwArgumentError("mnemonic/privateKey mismatch", "privateKey", "[REDACTED]");
                }
            }
            else {
                defineReadOnly(this, "_mnemonic", () => null);
            }
        }
        else {
            logger.throwArgumentError("invalid account", "account", acc);
        }
        /* istanbul ignore if */
        if (provider && !Provider.isProvider(provider)) {
            logger.throwArgumentError("invalid provider", "provider", provider);
        }
        defineReadOnly(this, "provider", provider || null);
    }
    get mnemonic() {
        return this._mnemonic();
    }
    get privateKey() {
        return this._signingKey().privateKey;
    }
    get publicKey() {
        return this._signingKey().publicKey;
    }
    getAddress() {
        return Promise.resolve(this.address);
    }
    getAccount() {
        return Promise.resolve(this.account);
    }
    connect(provider) {
        return new Wallet(this, provider);
    }
    // TODO to be revised
    signTransaction(transaction) {
        return resolveProperties(transaction).then((tx) => {
            if (tx.from != null) {
                if (getAddress(tx.from) !== this.address) {
                    logger.throwArgumentError("transaction from address mismatch", "transaction.from", transaction.from);
                }
                delete tx.from;
            }
            const signature = this._signingKey().signDigest(keccak256(serialize(tx)));
            return serialize(tx, signature);
        });
    }
    signMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            return joinSignature(this._signingKey().signDigest(hashMessage(message)));
        });
    }
    // TODO to be revised
    _signTypedData(domain, types, value) {
        return __awaiter(this, void 0, void 0, function* () {
            // Populate any ENS names
            const populated = yield _TypedDataEncoder.resolveNames(domain, types, value, (name) => {
                if (this.provider == null) {
                    logger.throwError("cannot resolve ENS names without a provider", Logger.errors.UNSUPPORTED_OPERATION, {
                        operation: "resolveName",
                        value: name
                    });
                }
                return this.provider.resolveName(name);
            });
            return joinSignature(this._signingKey().signDigest(_TypedDataEncoder.hash(populated.domain, types, populated.value)));
        });
    }
    // TODO to be revised
    encrypt(password, options, progressCallback) {
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
        return encryptKeystore(this, password, options, progressCallback);
    }
    // TODO to be revised
    /**
     *  Static methods to create Wallet instances.
     */
    static createRandom(options) {
        let entropy = randomBytes(16);
        if (!options) {
            options = {};
        }
        if (options.extraEntropy) {
            entropy = arrayify(hexDataSlice(keccak256(concat([entropy, options.extraEntropy])), 0, 16));
        }
        const mnemonic = entropyToMnemonic(entropy, options.locale);
        return Wallet.fromMnemonic(mnemonic, options.path, options.locale);
    }
    // TODO to be revised
    static fromEncryptedJson(json, password, progressCallback) {
        return decryptJsonWallet(json, password, progressCallback).then((account) => {
            return new Wallet(account);
        });
    }
    // TODO to be revised
    static fromEncryptedJsonSync(json, password) {
        return new Wallet(decryptJsonWalletSync(json, password));
    }
    // TODO to be revised
    static fromMnemonic(mnemonic, path, wordlist) {
        if (!path) {
            path = defaultPath;
        }
        return new Wallet(HDNode.fromMnemonic(mnemonic, null, wordlist).derivePath(path));
    }
}
// TODO to be revised
export function verifyMessage(message, signature) {
    return recoverAddress(hashMessage(message), signature);
}
// TODO to be revised
export function verifyTypedData(domain, types, value, signature) {
    return recoverAddress(_TypedDataEncoder.hash(domain, types, value), signature);
}
//# sourceMappingURL=index.js.map