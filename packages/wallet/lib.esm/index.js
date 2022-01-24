var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { asAccountString, getAccountFromAddress, getAddress, getAddressFromAccount } from "@ethersproject/address";
import { Provider } from "@ethersproject/abstract-provider";
import { Signer } from "@ethersproject/abstract-signer";
import { arrayify, concat, hexDataSlice, hexlify, hexStripZeros, isHexString, joinSignature } from "@ethersproject/bytes";
import { _TypedDataEncoder, hashMessage } from "@ethersproject/hash";
import { defaultPath, entropyToMnemonic, HDNode } from "@ethersproject/hdnode";
import { keccak256 } from "@ethersproject/keccak256";
import { defineReadOnly, resolveProperties } from "@ethersproject/properties";
import { randomBytes } from "@ethersproject/random";
import { SigningKey } from "@ethersproject/signing-key";
import { decryptJsonWallet, decryptJsonWalletSync, encryptKeystore } from "@ethersproject/json-wallets";
import { computeAlias, recoverAddress } from "@ethersproject/transactions";
import { Logger } from "@ethersproject/logger";
import { version } from "./_version";
import { ContractCreateTransaction, ContractExecuteTransaction, ContractId, FileAppendTransaction, FileCreateTransaction, PrivateKey as HederaPrivKey, PublicKey as HederaPubKey, ContractCallQuery, TransactionId, Hbar, AccountId, PrivateKey } from "@hashgraph/sdk";
import { TransactionBody, SignedTransaction } from '@hashgraph/proto';
import { numberify } from "@ethersproject/bignumber";
import * as Long from 'long';
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
function checkError(call1, error, txRequest) {
    switch (error.status._code) {
        // insufficient gas
        case 30:
            return logger.throwError("insufficient funds for gas cost", Logger.errors.INSUFFICIENT_FUNDS);
        // insufficient payer balance
        case 10:
            return logger.throwError("insufficient funds in payer account", Logger.errors.INSUFFICIENT_FUNDS);
        // insufficient tx fee
        case 9:
            return logger.throwError("transaction fee too low", Logger.errors.INSUFFICIENT_FUNDS);
        // invalid signature
        case 7:
            return logger.throwError("invalid transaction signature", Logger.errors.UNKNOWN_ERROR);
        // invalid contract id
        case 16:
            return logger.throwError("invalid contract address", Logger.errors.INVALID_ARGUMENT);
        // contract revert
        case 33:
            // is this the right thing to return for hedera? CALL_EXCEPTION ?
            return logger.throwError("contract execution reverted", Logger.errors.UNPREDICTABLE_GAS_LIMIT);
    }
    throw error;
}
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
    signTransaction(transaction) {
        var _a, _b;
        this._checkAddress('signTransaction');
        if (transaction.from) {
            if (getAddressFromAccount(transaction.from) !== this.address) {
                logger.throwArgumentError("transaction from address mismatch", "transaction.from", transaction.from);
            }
        }
        let tx;
        const arrayifiedData = transaction.data ? arrayify(transaction.data) : new Uint8Array();
        const gas = numberify(transaction.gasLimit ? transaction.gasLimit : 0);
        if (transaction.to) {
            tx = new ContractExecuteTransaction()
                .setContractId(ContractId.fromSolidityAddress(getAddressFromAccount(transaction.to)))
                .setFunctionParameters(arrayifiedData)
                .setGas(gas);
            if (transaction.value) {
                tx.setPayableAmount((_a = transaction.value) === null || _a === void 0 ? void 0 : _a.toString());
            }
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
                        .setContents(transaction.customData.fileChunk)
                        .setKeys([transaction.customData.fileKey ?
                            transaction.customData.fileKey :
                            HederaPubKey.fromString(this._signingKey().compressedPublicKey)]);
                }
                else {
                    logger.throwArgumentError("Cannot determine transaction type from given custom data. Need either `to`, `fileChunk`, `fileId` or `bytecodeFileId`", Logger.errors.INVALID_ARGUMENT, transaction);
                }
            }
        }
        const account = getAccountFromAddress(this.address);
        tx.setTransactionId(TransactionId.generate(new AccountId({
            shard: numberify(account.shard),
            realm: numberify(account.realm),
            num: numberify(account.num)
        })))
            // FIXME - should be taken from the network/ wallet's provider
            .setNodeAccountIds([new AccountId(0, 0, 3)])
            .freeze();
        const pkey = HederaPrivKey.fromStringECDSA(this._signingKey().privateKey);
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            const signed = yield tx.sign(pkey);
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
                return Promise.resolve(name);
                // return this.provider.resolveName(name);
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
    call(txRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            this._checkProvider("call");
            const tx = yield resolveProperties(this.checkTransaction(txRequest));
            const contractAccountLikeID = getAccountFromAddress(tx.to.toString());
            const contractId = asAccountString(contractAccountLikeID);
            const thisAcc = getAccountFromAddress(yield this.getAddress());
            const thisAccId = asAccountString(thisAcc);
            const nodeID = AccountId.fromString(asAccountString(tx.nodeId));
            const paymentTxId = TransactionId.generate(thisAccId);
            const hederaTx = new ContractCallQuery()
                .setContractId(contractId)
                .setFunctionParameters(arrayify(tx.data))
                .setNodeAccountIds([nodeID])
                .setGas(numberify(tx.gasLimit))
                .setPaymentTransactionId(paymentTxId);
            // TODO: the exact amount here will be computed using getCost when it's implemented
            const cost = 3;
            const paymentBody = {
                transactionID: paymentTxId._toProtobuf(),
                nodeAccountID: nodeID._toProtobuf(),
                // TODO: check if 1 Hbar is optimal for tx fee
                transactionFee: new Hbar(1).toTinybars(),
                transactionValidDuration: {
                    seconds: Long.fromInt(120),
                },
                cryptoTransfer: {
                    transfers: {
                        accountAmounts: [
                            {
                                accountID: AccountId.fromString(thisAccId)._toProtobuf(),
                                amount: new Hbar(cost).negated().toTinybars()
                            },
                            {
                                accountID: nodeID._toProtobuf(),
                                amount: new Hbar(cost).toTinybars()
                            }
                        ],
                    },
                },
            };
            const signed = {
                bodyBytes: TransactionBody.encode(paymentBody).finish(),
                sigMap: {}
            };
            const walletKey = PrivateKey.fromStringECDSA(this._signingKey().privateKey);
            const signature = walletKey.sign(signed.bodyBytes);
            signed.sigMap = {
                sigPair: [walletKey.publicKey._toProtobufSignature(signature)]
            };
            const transferSignedTransactionBytes = SignedTransaction.encode(signed).finish();
            hederaTx._paymentTransactions.push({
                signedTransactionBytes: transferSignedTransactionBytes
            });
            try {
                const response = yield hederaTx.execute(this.provider.getHederaClient());
                return hexStripZeros(response.bytes);
            }
            catch (error) {
                return checkError('call', error, txRequest);
            }
        });
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
    _checkAddress(operation) {
        if (!this.address) {
            logger.throwError("missing address", Logger.errors.UNSUPPORTED_OPERATION, {
                operation: (operation || "_checkAddress")
            });
        }
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