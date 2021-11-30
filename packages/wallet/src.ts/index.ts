"use strict";

import {Account, getAccountFromAddress, getAddress, getAddressFromAccount, parseAccount} from "@ethersproject/address";
import {Provider, TransactionRequest} from "@ethersproject/abstract-provider";
import {
    ExternallyOwnedAccount,
    Signer,
    TypedDataDomain,
    TypedDataField,
    TypedDataSigner,
    HederaAccount
} from "@ethersproject/abstract-signer";
import {arrayify, Bytes, concat, hexDataSlice, isHexString, joinSignature, SignatureLike} from "@ethersproject/bytes";
import {_TypedDataEncoder, hashMessage} from "@ethersproject/hash";
import {defaultPath, entropyToMnemonic, HDNode, Mnemonic} from "@ethersproject/hdnode";
import {keccak256} from "@ethersproject/keccak256";
import {defineReadOnly, resolveProperties} from "@ethersproject/properties";
import {randomBytes} from "@ethersproject/random";
import {SigningKey} from "@ethersproject/signing-key";
import {decryptJsonWallet, decryptJsonWalletSync, encryptKeystore, ProgressCallback} from "@ethersproject/json-wallets";
import {recoverAddress, serialize, UnsignedTransaction} from "@ethersproject/transactions";
import {Wordlist} from "@ethersproject/wordlists";

import {Logger} from "@ethersproject/logger";
import {version} from "./_version";

const logger = new Logger(version);

function isEOA(value: any): value is ExternallyOwnedAccount {
    return (value != null && isHexString(value.privateKey, 32) && value.address != null);
}

function isHederaAccount(value: any): value is HederaAccount {
    return (value != null && isHexString(value.privateKey, 32) && value.account != null);
}

function hasMnemonic(value: any): value is { mnemonic: Mnemonic } {
    const mnemonic = value.mnemonic;
    return (mnemonic && mnemonic.phrase);
}

export class Wallet extends Signer implements ExternallyOwnedAccount, TypedDataSigner {

    // EVM Address format
    readonly address: string;
    // Hedera Account format
    readonly account: Account;
    readonly provider: Provider;

    // Wrapping the _signingKey and _mnemonic in a getter function prevents
    // leaking the private key in console.log; still, be careful! :)
    readonly _signingKey: () => SigningKey;
    readonly _mnemonic: () => Mnemonic;

    constructor(acc: ExternallyOwnedAccount | HederaAccount, provider?: Provider) {
        logger.checkNew(new.target, Wallet);
        super();

        if (isEOA(acc) || isHederaAccount(acc)) {
            const signingKey = new SigningKey(acc.privateKey);
            defineReadOnly(this, "_signingKey", () => signingKey);

            defineReadOnly(this, "address", isEOA(acc) ? getAddress(acc.address) : getAddressFromAccount(acc.account));
            defineReadOnly(this, "account", isEOA(acc) ? getAccountFromAddress(acc.address) : parseAccount(acc.account));

            if (hasMnemonic(acc)) {
                const srcMnemonic = acc.mnemonic;
                defineReadOnly(this, "_mnemonic", () => (
                    {
                        phrase: srcMnemonic.phrase,
                        path: srcMnemonic.path || defaultPath,
                        locale: srcMnemonic.locale || "en"
                    }
                ));
                const mnemonic = this.mnemonic;
                const node = HDNode.fromMnemonic(mnemonic.phrase, null, mnemonic.locale).derivePath(mnemonic.path);
                if (node.privateKey !== this._signingKey().privateKey) {
                    logger.throwArgumentError("mnemonic/privateKey mismatch", "privateKey", "[REDACTED]");
                }
            } else {
                defineReadOnly(this, "_mnemonic", (): Mnemonic => null);
            }
        } else {
            logger.throwArgumentError("invalid account", "account", acc);
        }

        /* istanbul ignore if */
        if (provider && !Provider.isProvider(provider)) {
            logger.throwArgumentError("invalid provider", "provider", provider);
        }

        defineReadOnly(this, "provider", provider || null);
    }

    get mnemonic(): Mnemonic {
        return this._mnemonic();
    }

    get privateKey(): string {
        return this._signingKey().privateKey;
    }

    get publicKey(): string {
        return this._signingKey().publicKey;
    }

    getAddress(): Promise<string> {
        return Promise.resolve(this.address);
    }

    getAccount(): Promise<Account> {
        return Promise.resolve(this.account);
    }

    connect(provider: Provider): Wallet {
        return new Wallet(this, provider);
    }

    // TODO to be revised
    signTransaction(transaction: TransactionRequest): Promise<string> {
        return resolveProperties(transaction).then((tx) => {
            if (tx.from != null) {
                if (getAddress(tx.from) !== this.address) {
                    logger.throwArgumentError("transaction from address mismatch", "transaction.from", transaction.from);
                }
                delete tx.from;
            }

            const signature = this._signingKey().signDigest(keccak256(serialize(<UnsignedTransaction>tx)));
            return serialize(<UnsignedTransaction>tx, signature);
        });
    }

    async signMessage(message: Bytes | string): Promise<string> {
        return joinSignature(this._signingKey().signDigest(hashMessage(message)));
    }

    // TODO to be revised
    async _signTypedData(domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, value: Record<string, any>): Promise<string> {
        // Populate any ENS names
        const populated = await _TypedDataEncoder.resolveNames(domain, types, value, (name: string) => {
            if (this.provider == null) {
                logger.throwError("cannot resolve ENS names without a provider", Logger.errors.UNSUPPORTED_OPERATION, {
                    operation: "resolveName",
                    value: name
                });
            }
            return this.provider.resolveName(name);
        });

        return joinSignature(this._signingKey().signDigest(_TypedDataEncoder.hash(populated.domain, types, populated.value)));
    }

    encrypt(password: Bytes | string, options?: any, progressCallback?: ProgressCallback): Promise<string> {
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
    static createRandom(options?: any): Wallet {
        let entropy: Uint8Array = randomBytes(16);

        if (!options) {
            options = {};
        }

        if (options.extraEntropy) {
            entropy = arrayify(hexDataSlice(keccak256(concat([entropy, options.extraEntropy])), 0, 16));
        }

        const mnemonic = entropyToMnemonic(entropy, options.locale);
        return Wallet.fromMnemonic(mnemonic, options.path, options.locale);
    }

    static fromEncryptedJson(json: string, password: Bytes | string, progressCallback?: ProgressCallback): Promise<Wallet> {
        return decryptJsonWallet(json, password, progressCallback).then((account) => {
            return new Wallet(account);
        });
    }

    static fromEncryptedJsonSync(json: string, password: Bytes | string): Wallet {
        return new Wallet(decryptJsonWalletSync(json, password));
    }

    // TODO to be revised
    static fromMnemonic(mnemonic: string, path?: string, wordlist?: Wordlist): Wallet {
        if (!path) {
            path = defaultPath;
        }
        return new Wallet(HDNode.fromMnemonic(mnemonic, null, wordlist).derivePath(path));
    }
}

// TODO to be revised
export function verifyMessage(message: Bytes | string, signature: SignatureLike): string {
    return recoverAddress(hashMessage(message), signature);
}

// TODO to be revised
export function verifyTypedData(domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, value: Record<string, any>, signature: SignatureLike): string {
    return recoverAddress(_TypedDataEncoder.hash(domain, types, value), signature);
}
