"use strict";

import { getAddress } from "@ethersproject/address";
import { Provider, TransactionRequest } from "@ethersproject/abstract-provider";
import { ExternallyOwnedAccount, Signer, TypedDataDomain, TypedDataField, TypedDataSigner } from "@ethersproject/abstract-signer";
import { arrayify, Bytes, BytesLike, concat, hexDataSlice, isHexString, joinSignature, SignatureLike } from "@ethersproject/bytes";
import { hashMessage, _TypedDataEncoder } from "@ethersproject/hash";
import { defaultPath, HDNode, entropyToMnemonic, Mnemonic } from "@ethersproject/hdnode";
import { keccak256 } from "@ethersproject/keccak256";
import { defineReadOnly, resolveProperties } from "@ethersproject/properties";
import { randomBytes } from "@ethersproject/random";
import { SigningKey } from "@ethersproject/signing-key";
import { decryptJsonWallet, decryptJsonWalletSync, encryptKeystore, ProgressCallback } from "@ethersproject/json-wallets";
import { computeAddress, recoverAddress, serialize, UnsignedTransaction } from "@ethersproject/transactions";
import { Wordlist } from "@ethersproject/wordlists";

import { Logger } from "@ethersproject/logger";
import { version } from "./_version";
const logger = new Logger(version);

function isAccount(value: any): value is ExternallyOwnedAccount {
    //TODO check ed2559 key length
    return (value != null && isHexString(value.privateKey, 32) && value.address != null);
}

// function hasMnemonic(value: any): value is { mnemonic: Mnemonic } {
//     const mnemonic = value.mnemonic;
//     return (mnemonic && mnemonic.phrase);
// }

export class Wallet extends Signer implements ExternallyOwnedAccount, TypedDataSigner {

    readonly address: string; //implement util converter to eth address format in case of hedera account
    readonly provider: Provider;

    // Wrapping the _signingKey and _mnemonic in a getter function prevents
    // leaking the private key in console.log; still, be careful! :)
    readonly _signingKey: () => SigningKey;
    readonly _mnemonic: () => Mnemonic;

    //TODO For now work only with single key!
    constructor(eoa: ExternallyOwnedAccount, provider?: Provider) {
        logger.checkNew(new.target, Wallet);

        super();

        if (isAccount(eoa)) {
            const signingKey = new SigningKey(eoa.privateKey);
            defineReadOnly(this, "_signingKey", () => signingKey);
            //check is hedera account & invoke util to split
            defineReadOnly(this, "address", computeAddress(this.publicKey));

            if (this.address !== getAddress(eoa.address)) {
                logger.throwArgumentError("privateKey/address mismatch", "privateKey", "[REDACTED]");
            }

            // if (hasMnemonic(eoa)) {
            //     const srcMnemonic = eoa.mnemonic;
            //     defineReadOnly(this, "_mnemonic", () => (
            //         {
            //             phrase: srcMnemonic.phrase,
            //             path: srcMnemonic.path || defaultPath,
            //             locale: srcMnemonic.locale || "en"
            //         }
            //     ));
            //     const mnemonic = this.mnemonic;
            //     const node = HDNode.fromMnemonic(mnemonic.phrase, null, mnemonic.locale).derivePath(mnemonic.path);
            //     if (computeAddress(node.privateKey) !== this.address) {
            //         logger.throwArgumentError("mnemonic/address mismatch", "privateKey", "[REDACTED]");
            //     }
            // } else {
            //     defineReadOnly(this, "_mnemonic", (): Mnemonic => null);
            // }

            //TODO implement Mnemonic handling, check getMnemonic logic in hedera-sdk

        } else {
            // if (SigningKey.isSigningKey(eoa)) {
            //     /* istanbul ignore if */
            //     if (eoa.curve !== "secp256k1") {
            //         logger.throwArgumentError("unsupported curve; must be secp256k1", "privateKey", "[REDACTED]");
            //     }
            //     defineReadOnly(this, "_signingKey", () => (<SigningKey>eoa));

            // } else {
            //     // A lot of common tools do not prefix private keys with a 0x (see: #1166)
            //     if (typeof(eoa) === "string") {
            //         if (eoa.match(/^[0-9a-f]*$/i) && eoa.length === 64) {
            //             eoa = "0x" + eoa;
            //         }
            //     }

            //     const signingKey = new SigningKey(eoa);
            //     defineReadOnly(this, "_signingKey", () => signingKey);
            // }

            // defineReadOnly(this, "_mnemonic", (): Mnemonic => null);
            // defineReadOnly(this, "address", computeAddress(this.publicKey));

            logger.throwArgumentError("invalid eoa", "eoa", eoa);
        }

        /* istanbul ignore if */
        if (provider && !Provider.isProvider(provider)) {
            logger.throwArgumentError("invalid provider", "provider", provider);
        }

        defineReadOnly(this, "provider", provider || null);
    }

    get mnemonic(): Mnemonic { return this._mnemonic(); }
    get privateKey(): string { return this._signingKey().privateKey; }
    get publicKey(): string { return this._signingKey().publicKey; }

    getAddress(): Promise<string> {
        return Promise.resolve(this.address); // use converterted eth address
    }

    connect(provider: Provider): Wallet {
        return new Wallet(this, provider);
    }

    //leave it untouched for now
    signTransaction(transaction: TransactionRequest): Promise<string> {
        return resolveProperties(transaction).then((tx) => {
            if (tx.from != null) {
                //either implement custom util for hedera accounts
                // this.accountIdToEthAddress(this.account) -> 
                if (getAddress(tx.from) !== this.accountIdToEthAddress(this.address)) {
                    logger.throwArgumentError("transaction from address mismatch", "transaction.from", transaction.from);
                }
                delete tx.from;
            }

            const signature = this._signingKey().signDigest(keccak256(serialize(<UnsignedTransaction>tx)));
            return serialize(<UnsignedTransaction>tx, signature);
        });
    }

    //TODO implement util
    accountIdToEthAddress(accountId: string): string {  
        //parse <0.0.1> to <0x3123...>
        return "";
    }

    //to be discussed!! 
    async signMessage(message: Bytes | string): Promise<string> {
        return joinSignature(this._signingKey().signDigest(hashMessage(message)));
    }

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
        if (typeof(options) === "function" && !progressCallback) {
            progressCallback = options;
            options = {};
        }

        if (progressCallback && typeof(progressCallback) !== "function") {
            throw new Error("invalid callback");
        }

        if (!options) { options = {}; }

        return encryptKeystore(this, password, options, progressCallback);
    }


    /**
     *  Static methods to create Wallet instances.
     */
    static createRandom(options?: any): Wallet {
        let entropy: Uint8Array = randomBytes(16);

        if (!options) { options = { }; }

        if (options.extraEntropy) {
            entropy = arrayify(hexDataSlice(keccak256(concat([ entropy, options.extraEntropy ])), 0, 16));
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

    static fromMnemonic(mnemonic: string, path?: string, wordlist?: Wordlist): Wallet {
        if (!path) { path = defaultPath; }
        return new Wallet(HDNode.fromMnemonic(mnemonic, null, wordlist).derivePath(path));
    }
} 

export function verifyMessage(message: Bytes | string, signature: SignatureLike): string {
    return recoverAddress(hashMessage(message), signature);
}

export function verifyTypedData(domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, value: Record<string, any>, signature: SignatureLike): string {
    return recoverAddress(_TypedDataEncoder.hash(domain, types, value), signature);
}
