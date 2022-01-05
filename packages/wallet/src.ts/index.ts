"use strict";

import { Account, AccountLike, getAccountFromAddress, getAddress, getAddressFromAccount } from "@ethersproject/address";
import { Provider, TransactionRequest, TransactionResponse } from "@ethersproject/abstract-provider";
import {
    ExternallyOwnedAccount,
    Signer,
    TypedDataDomain,
    TypedDataField,
    TypedDataSigner
} from "@ethersproject/abstract-signer";
import {
    arrayify,
    Bytes,
    BytesLike,
    concat,
    hexDataSlice,
    hexlify,
    isHexString,
    joinSignature,
    SignatureLike
} from "@ethersproject/bytes";
import { _TypedDataEncoder, hashMessage } from "@ethersproject/hash";
import { defaultPath, entropyToMnemonic, HDNode, Mnemonic } from "@ethersproject/hdnode";
import { keccak256 } from "@ethersproject/keccak256";
import { Deferrable, defineReadOnly, resolveProperties } from "@ethersproject/properties";
import { randomBytes } from "@ethersproject/random";
import { SigningKey } from "@ethersproject/signing-key";
import {
    decryptJsonWallet,
    decryptJsonWalletSync,
    encryptKeystore,
    ProgressCallback
} from "@ethersproject/json-wallets";
import { computeAlias, recoverAddress, } from "@ethersproject/transactions";
import { Wordlist } from "@ethersproject/wordlists";

import { Logger } from "@ethersproject/logger";
import { version } from "./_version";
import {
    AccountId,
    ContractCreateTransaction,
    ContractExecuteTransaction,
    ContractId,
    FileAppendTransaction,
    FileCreateTransaction, Key as HederaKey, PrivateKey, PublicKey,
    Transaction,
    TransactionId,
} from "@hashgraph/sdk";
// import {EcdsaPrivateKey, EcdsaPublicKey} from '@hashgraph/cryptography';
import { BigNumber, BigNumberish } from "ethers";
import { Key } from "@hashgraph/proto";

const logger = new Logger(version);

function isAccount(value: any): value is ExternallyOwnedAccount {
    return value != null && isHexString(value.privateKey, 32);
}

function hasMnemonic(value: any): value is { mnemonic: Mnemonic } {
    const mnemonic = value.mnemonic;
    return (mnemonic && mnemonic.phrase);
}

function hasAlias(value: any): value is ExternallyOwnedAccount {
    return isAccount(value) && value.alias != null;
}

export class Wallet extends Signer implements ExternallyOwnedAccount, TypedDataSigner {

    // EVM Address format
    readonly address?: string;
    // Hedera Account format
    readonly account?: Account;
    // Hedera alias
    readonly alias?: string;
    readonly provider: Provider;

    // Wrapping the _signingKey and _mnemonic in a getter function prevents
    // leaking the private key in console.log; still, be careful! :)
    readonly _signingKey: () => SigningKey;
    readonly _mnemonic: () => Mnemonic;

    constructor(identity: BytesLike | ExternallyOwnedAccount | SigningKey, provider?: Provider) {
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
            if (SigningKey.isSigningKey(identity)) {
                /* istanbul ignore if */
                if (identity.curve !== "secp256k1") {
                    logger.throwArgumentError("unsupported curve; must be secp256k1", "privateKey", "[REDACTED]");
                }
                defineReadOnly(this, "_signingKey", () => (<SigningKey>identity));
            } else {
                // A lot of common tools do not prefix private keys with a 0x (see: #1166)
                if (typeof (identity) === "string") {
                    if (identity.match(/^[0-9a-f]*$/i) && identity.length === 64) {
                        identity = "0x" + identity;
                    }
                }

                const signingKey = new SigningKey(identity);
                defineReadOnly(this, "_signingKey", () => signingKey);
            }

            defineReadOnly(this, "_mnemonic", (): Mnemonic => null);
            defineReadOnly(this, "alias", computeAlias(this._signingKey().privateKey));
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

    getAlias(): Promise<string> {
        return Promise.resolve(this.alias);
    }

    connect(provider: Provider): Wallet {
        return new Wallet(this, provider);
    }

    connectAccount(accountLike: AccountLike): Wallet {
        const eoa = {
            privateKey: this._signingKey().privateKey,
            address: getAddressFromAccount(accountLike),
            alias: this.alias,
            mnemonic: this._mnemonic()
        };
        return new Wallet(eoa, this.provider);
    }

    //
    // async sendTransaction(transaction: Deferrable<TransactionRequest>): Promise<TransactionResponse> {
    //
    //     return null;
    // }

    async sendTransaction(transaction: Deferrable<TransactionRequest>): Promise<TransactionResponse> {
        const tx = await resolveProperties(transaction);
        // to - sign & send
        // no `to` - file create and appends and contract create;
        // create TransactionRequest objects and pass them down to the sign fn
        // sign & send on each tx
        // contract create would be the expected result of create + append + contract create

        if (tx.to) {
            const signed = await this.signTransaction(tx);
            return await this.provider.sendTransaction(signed);
        } else {
            const contractByteCode = tx.data;
            let chunks = splitInChunks(Buffer.from(contractByteCode).toString(), 4096);
            const fileCreate = {
                customData: {
                    fileChunk: chunks[0],
                    fileKey: ecdsaPublicKeyToProtobufKey(PublicKey.fromString(this._signingKey().compressedPublicKey))
                }
            };
            const signedFileCreate = await this.signTransaction(fileCreate);
            const resp =  await this.provider.sendTransaction(signedFileCreate);
            for (let chunk of chunks.slice(1)) {
                const fileAppend = {
                    customData: {
                        fileId: resp.customData.fileId.toString(),
                        fileChunk: chunk
                    }
                };
                const signedFileAppend = await this.signTransaction(fileAppend);
                await this.provider.sendTransaction(signedFileAppend);
            }

            const contractCreate = {
                gasLimit: tx.gasLimit,
                customData: {
                    bytecodeFileId: resp.customData.fileId.toString()
                }
            }
            const signedContractCreate = await this.signTransaction(contractCreate);
            return await this.provider.sendTransaction(signedContractCreate);
        }
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
    signTransaction(transaction: TransactionRequest): Promise<string> {
        let tx: Transaction;
        const arrayifiedData = transaction.data ? arrayify(transaction.data) : new Uint8Array();
        const gas = numberify(transaction.gasLimit ? transaction.gasLimit : 0);
        if (transaction.to) {
            tx = new ContractExecuteTransaction()
                .setContractId(ContractId.fromSolidityAddress(transaction.to.toString()))
                .setFunctionParameters(arrayifiedData)
                .setGas(gas)
            if (transaction.value) {
                (tx as ContractExecuteTransaction).setPayableAmount(transaction.value?.toString())
            }
        } else {
            if (transaction.customData.bytecodeFileId) {
                tx = new ContractCreateTransaction()
                    .setBytecodeFileId(transaction.customData.bytecodeFileId)
                    .setConstructorParameters(arrayifiedData)
                    .setInitialBalance(transaction.value?.toString())
                    .setGas(gas);
            } else {
                if (transaction.customData.fileChunk && transaction.customData.fileId) {
                    tx = new FileAppendTransaction()
                        .setContents(transaction.customData.fileChunk)
                        .setFileId(transaction.customData.fileId)
                } else if (!transaction.customData.fileId && transaction.customData.fileChunk) {
                    // only a chunk, thus the first one
                    tx = new FileCreateTransaction()
                        .setContents(transaction.customData.fileChunk)
                        .setKeys([ transaction.customData.fileKey ?
                            ecdsaPublicKeyToProtobufKey(transaction.customData.fileKey) :
                            ecdsaPublicKeyToProtobufKey(PublicKey.fromString(this._signingKey().compressedPublicKey)) ])
                } else {
                    logger.throwArgumentError(
                        "Cannot determine transaction type from given custom data. Need either `to`, `fileChunk`, `fileId` or `bytecodeFileId`",
                        Logger.errors.INVALID_ARGUMENT,
                        transaction);
                }
            }
        }
        const accountID = getAccountFromAddress(this.address);
        tx
            .setTransactionId(TransactionId.generate(new AccountId({
                shard: numberify(accountID.shard),
                realm: numberify(accountID.realm),
                num: numberify(accountID.num)
            })))
            // FIXME - should be taken from the network/ wallet's provider
            .setNodeAccountIds([ new AccountId(0, 0, 3) ])
            .freeze();
        const privKey = PrivateKey.fromString(this._signingKey().privateKey);
        return new Promise<string>(async (resolve) => {
            const signed = await tx.sign(PrivateKey.fromBytes(privKey.toBytesRaw()));
            resolve(hexlify(signed.toBytes()));
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

    /**
     *  Static methods to create Wallet instances.
     */
    static createRandom(options?: any): Wallet {
        let entropy: Uint8Array = randomBytes(16);

        if (!options) {
            options = {};
        }

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

// TODO: think about moving those utils

function numberify(num: BigNumberish) {
    return BigNumber.from(num).toNumber();
}

// @ts-ignore
function splitInChunks(data: string, chunkSize: number): string[] {
    const chunks = [];
    let num = 0;
    while (num <= data.length) {
        const slice = data.slice(num, chunkSize + num);
        num += chunkSize;
        chunks.push(slice);
    }
    return chunks;
}

function ecdsaPublicKeyToProtobufKey(k1:PublicKey): HederaKey {
    const protoKey = Key.create({
        ECDSASecp256k1: k1.toBytesRaw()
    });
    return HederaKey._fromProtobufKey(protoKey);
}
