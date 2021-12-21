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
import { getAccountFromAddress, getAddress, getAddressFromAccount } from "@ethersproject/address";
import { Provider } from "@ethersproject/abstract-provider";
import { Signer } from "@ethersproject/abstract-signer";
import { arrayify, concat, hexDataSlice, hexlify, isHexString, joinSignature } from "@ethersproject/bytes";
import { _TypedDataEncoder, hashMessage } from "@ethersproject/hash";
import { defaultPath, entropyToMnemonic, HDNode } from "@ethersproject/hdnode";
import { keccak256 } from "@ethersproject/keccak256";
import { defineReadOnly } from "@ethersproject/properties";
import { randomBytes } from "@ethersproject/random";
import { SigningKey } from "@ethersproject/signing-key";
import { decryptJsonWallet, decryptJsonWalletSync, encryptKeystore } from "@ethersproject/json-wallets";
import { computeAlias, recoverAddress, } from "@ethersproject/transactions";
import { Logger } from "@ethersproject/logger";
import { version } from "./_version";
import { AccountId, ContractCreateTransaction, ContractExecuteTransaction, ContractId, FileAppendTransaction, FileCreateTransaction, PrivateKey, TransactionId } from "@hashgraph/sdk";
import { BigNumber } from "ethers";
const logger = new Logger(version);
function isAccount(value) {
    return value != null && isHexString(value.privateKey, 32);
}
function hasMnemonic(value) {
    const mnemonic = value.mnemonic;
    return (mnemonic && mnemonic.phrase);
}
function hasAlias(value) {
    return isAccount(value) && value.alias != null;
}
const account = {
    "operator": {
        "accountId": "0.0.1280",
        "publicKey": "302a300506032b65700321004aed2e9e0cb6cbcd12b58476a2c39875d27e2a856444173830cc1618d32ca2f0",
        "privateKey": "302e020100300506032b65700422042072874996deabc69bde7287a496295295b8129551903a79b895a9fd5ed025ece8"
    },
    "network": {
        "35.231.208.148:50211": "0.0.3",
        "35.199.15.177:50211": "0.0.4",
        "35.225.201.195:50211": "0.0.5",
        "35.247.109.135:50211": "0.0.6"
    }
};
export class Wallet extends Signer {
    constructor(identity, provider) {
        logger.checkNew(new.target, Wallet);
        super();
        if (isAccount(identity) && !SigningKey.isSigningKey(identity)) {
            const signingKey = new SigningKey(identity.privateKey);
            defineReadOnly(this, "_signingKey", () => signingKey);
            if (identity.address || identity.account) {
                defineReadOnly(this, "address", identity.address ? getAddress(identity.address) : getAddressFromAccount(identity.account));
                defineReadOnly(this, "account", identity.account ? identity.account : getAccountFromAddress(identity.address));
            }
            if (hasAlias(identity)) {
                defineReadOnly(this, "alias", identity.alias);
                if (this.alias !== computeAlias(signingKey.privateKey)) {
                    logger.throwArgumentError("privateKey/alias mismatch", "privateKey", "[REDACTED]");
                }
            }
            if (hasMnemonic(identity)) {
                const srcMnemonic = identity.mnemonic;
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
            if (SigningKey.isSigningKey(identity)) {
                /* istanbul ignore if */
                if (identity.curve !== "secp256k1") {
                    logger.throwArgumentError("unsupported curve; must be secp256k1", "privateKey", "[REDACTED]");
                }
                defineReadOnly(this, "_signingKey", () => identity);
            }
            else {
                // A lot of common tools do not prefix private keys with a 0x (see: #1166)
                if (typeof (identity) === "string") {
                    if (identity.match(/^[0-9a-f]*$/i) && identity.length === 64) {
                        identity = "0x" + identity;
                    }
                }
                const signingKey = new SigningKey(identity);
                defineReadOnly(this, "_signingKey", () => signingKey);
            }
            defineReadOnly(this, "_mnemonic", () => null);
            defineReadOnly(this, "alias", computeAlias(this._signingKey().privateKey));
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
    getAlias() {
        return Promise.resolve(this.alias);
    }
    connect(provider) {
        return new Wallet(this, provider);
    }
    connectAccount(accountLike) {
        const eoa = {
            privateKey: this._signingKey().privateKey,
            address: getAddressFromAccount(accountLike),
            alias: this.alias,
            mnemonic: this._mnemonic()
        };
        return new Wallet(eoa, this.provider);
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
    signTransaction(transaction) {
        var _a, _b;
        let tx;
        let arrayifiedData;
        if (transaction.data) {
            arrayifiedData = arrayify(transaction.data);
        }
        const gas = BigNumber.from(transaction.gasLimit).toNumber();
        if (transaction.to) {
            tx = new ContractExecuteTransaction()
                .setContractId(ContractId.fromSolidityAddress((transaction.to.toString())))
                .setFunctionParameters(arrayifiedData)
                .setPayableAmount((_a = transaction.value) === null || _a === void 0 ? void 0 : _a.toString())
                .setGas(gas);
        }
        else {
            if (transaction.customData.bytecodeFileId) {
                tx = new ContractCreateTransaction()
                    .setBytecodeFileId(transaction.customData.bytecodeFileId)
                    .setConstructorParameters(arrayifiedData)
                    .setInitialBalance((_b = transaction.value) === null || _b === void 0 ? void 0 : _b.toString())
                    .setGas(gas);
            }
            else {
                if (transaction.customData.fileChunk && transaction.customData.fileId) {
                    tx = new FileAppendTransaction()
                        .setContents(transaction.customData.fileChunk)
                        .setFileId(transaction.customData.fileId);
                }
                else if (!transaction.customData.fileId && transaction.customData.fileChunk) {
                    // only a chunk, thus the first one
                    tx = new FileCreateTransaction()
                        .setContents(transaction.customData.fileChunk);
                }
                else {
                    logger.throwArgumentError("Cannot determine transaction type from given custom data. Need either `to`, `fileChunk`, `fileId` or `bytecodeFileId`", Logger.errors.INVALID_ARGUMENT, transaction);
                }
            }
        }
        // const accountId = `${this.account.shard}.${this.account.realm}.${this.account.num}`;
        tx.setTransactionId(TransactionId.generate("0.0.98"))
            .setNodeAccountIds([new AccountId(0, 0, 3)]) // FIXME - should be taken from the network
            .freeze();
        const privKey = PrivateKey.fromString(account.operator.privateKey);
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            const signed = yield tx.sign(privKey);
            resolve(hexlify(signed.toBytes()));
        }));
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
    static fromEncryptedJson(json, password, progressCallback) {
        return decryptJsonWallet(json, password, progressCallback).then((account) => {
            return new Wallet(account);
        });
    }
    static fromEncryptedJsonSync(json, password) {
        return new Wallet(decryptJsonWalletSync(json, password));
    }
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