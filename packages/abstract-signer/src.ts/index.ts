"use strict";

import { BlockTag, Provider, TransactionRequest, TransactionResponse } from "@ethersproject/abstract-provider";
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { Bytes, BytesLike } from "@ethersproject/bytes";
import { Deferrable, defineReadOnly, resolveProperties, shallowCopy } from "@ethersproject/properties";
import { Logger } from "@ethersproject/logger";
import { version } from "./_version";
import {Account, getAddressFromAccount, getChecksumAddress} from "@ethersproject/address";
import { SigningKey } from "@ethersproject/signing-key";
import { PublicKey as HederaPubKey } from "@hashgraph/sdk";

const logger = new Logger(version);

const allowedTransactionKeys: Array<string> = [
    "accessList", "chainId", "customData", "data", "from", "gasLimit", "maxFeePerGas", "maxPriorityFeePerGas", "to", "type", "value"
];

const forwardErrors = [
    Logger.errors.INSUFFICIENT_FUNDS,
    Logger.errors.NONCE_EXPIRED,
    Logger.errors.REPLACEMENT_UNDERPRICED,
];

// EIP-712 Typed Data
// See: https://eips.ethereum.org/EIPS/eip-712

export interface TypedDataDomain {
    name?: string;
    version?: string;
    chainId?: BigNumberish;
    verifyingContract?: string;
    salt?: BytesLike;
};

export interface TypedDataField {
    name: string;
    type: string;
};

// Sub-classes of Signer may optionally extend this interface to indicate
// they have a private key available synchronously
export interface ExternallyOwnedAccount {
    readonly address?: string;
    readonly account?: Account;
    readonly alias?: string;
    readonly privateKey: string;
}

// Sub-Class Notes:
//  - A Signer MUST always make sure, that if present, the "from" field
//    matches the Signer, before sending or signing a transaction
//  - A Signer SHOULD always wrap private information (such as a private
//    key or mnemonic) in a function, so that console.log does not leak
//    the data

// @TODO: This is a temporary measure to preserve backwards compatibility
//        In v6, the method on TypedDataSigner will be added to Signer
export interface TypedDataSigner {
    _signTypedData(domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, value: Record<string, any>): Promise<string>;
}

export abstract class Signer {
    readonly provider?: Provider;
    readonly _signingKey: () => SigningKey;
    ///////////////////
    // Sub-classes MUST implement these

    // Returns the checksum address
    abstract getAddress(): Promise<string>

    // Returns the signed prefixed-message. This MUST treat:
    // - Bytes as a binary message
    // - string as a UTF8-message
    // i.e. "0x1234" is a SIX (6) byte string, NOT 2 bytes of data
    abstract signMessage(message: Bytes | string): Promise<string>;

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
    abstract signTransaction(transaction: TransactionRequest): Promise<string>;

    // Returns a new instance of the Signer, connected to provider.
    // This MAY throw if changing providers is not supported.
    abstract connect(provider: Provider): Signer;

    readonly _isSigner: boolean;


    ///////////////////
    // Sub-classes MUST call super
    constructor() {
        logger.checkAbstract(new.target, Signer);
        defineReadOnly(this, "_isSigner", true);
    }

    async getGasPrice(): Promise<BigNumber> {
        this._checkProvider("getGasPrice");
        return await this.provider.getGasPrice();
    }
    ///////////////////
    // Sub-classes MAY override these

    async getBalance(blockTag?: BlockTag): Promise<BigNumber> {
        this._checkProvider("getBalance");
        return await this.provider.getBalance(this.getAddress(), blockTag);
    }

    // Populates "from" if unspecified, and estimates the gas for the transaction
    async estimateGas(transaction: Deferrable<TransactionRequest>): Promise<BigNumber> {
        this._checkProvider("estimateGas");
        const tx = await resolveProperties(this.checkTransaction(transaction));
        return await this.provider.estimateGas(tx);
    }

    // TODO: this should perform a LocalCall, sign and submit with provider.sendTransaction
    async call(transaction: Deferrable<TransactionRequest>, blockTag?: BlockTag): Promise<string> {
        return Promise.resolve("");
    }

    // Populates all fields in a transaction, signs it and sends it to the network
    async sendTransaction(transaction: Deferrable<TransactionRequest>): Promise<TransactionResponse> {
        const tx = await resolveProperties(this.checkTransaction(transaction));

        if (tx.to) {
            const signed = await this.signTransaction(tx);
            return await this.provider.sendTransaction(signed);
        } else {
            const contractByteCode = tx.data;
            let chunks = splitInChunks(Buffer.from(contractByteCode).toString(), 4096);
            const fileCreate = {
                customData: {
                    fileChunk: chunks[0],
                    fileKey: HederaPubKey.fromString(this._signingKey().compressedPublicKey)
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

    async getChainId(): Promise<number> {
        this._checkProvider("getChainId");
        const network = await this.provider.getNetwork();
        return network.chainId;
    }

    // TODO FIXME
    async resolveName(name: string): Promise<string> {
        this._checkProvider("resolveName");
        return "";
    }

    // Checks a transaction does not contain invalid keys and if
    // no "from" is provided, populates it.
    // - does NOT require a provider
    // - adds "from" is not present
    // - returns a COPY (safe to mutate the result)
    // By default called from: (overriding these prevents it)
    //   - call
    //   - estimateGas
    //   - populateTransaction (and therefor sendTransaction)
    checkTransaction(transaction: Deferrable<TransactionRequest>): Deferrable<TransactionRequest> {
        for (const key in transaction) {
            if (allowedTransactionKeys.indexOf(key) === -1) {
                logger.throwArgumentError("invalid transaction key: " + key, "transaction", transaction);
            }
        }

        const tx = shallowCopy(transaction);

        if (tx.from == null) {
            tx.from = this.getAddress();

        } else {
            // Make sure any provided address matches this signer
            tx.from = Promise.all([
                Promise.resolve(tx.from),
                this.getAddress()
            ]).then((result) => {
                if (result[0].toString().toLowerCase() !== result[1].toLowerCase()) {
                    logger.throwArgumentError("from address mismatch", "transaction", transaction);
                }
                return result[0];
            });
        }

        return tx;
    }

    // Populates ALL keys for a transaction and checks that "from" matches
    // this Signer. Should be used by sendTransaction but NOT by signTransaction.
    // By default called from: (overriding these prevents it)
    //   - sendTransaction
    async populateTransaction(transaction: Deferrable<TransactionRequest>): Promise<TransactionRequest> {

        const tx: Deferrable<TransactionRequest> = await resolveProperties(this.checkTransaction(transaction))

        if (tx.to != null) {
            tx.to = Promise.resolve(tx.to).then(async (to) => {
                if (to == null) { return null; }
                return getChecksumAddress(getAddressFromAccount(to));
            });

            // Prevent this error from causing an UnhandledPromiseException
            tx.to.catch((error) => {  });
        }

        if (tx.gasLimit == null) {
            return logger.throwError("cannot estimate gas; transaction requires manual gas limit", Logger.errors.UNPREDICTABLE_GAS_LIMIT, { tx: tx });
        }

        if (tx.chainId == null) {
            tx.chainId = this.getChainId();
        } else {
            tx.chainId = Promise.all([
                Promise.resolve(tx.chainId),
                this.getChainId()
            ]).then((results) => {
                if (results[1] !== 0 && results[0] !== results[1]) {
                    logger.throwArgumentError("chainId address mismatch", "transaction", transaction);
                }
                return results[0];
            });
        }

        return await resolveProperties(tx);
    }


    ///////////////////
    // Sub-classes SHOULD leave these alone

    _checkProvider(operation?: string): void {
        if (!this.provider) { logger.throwError("missing provider", Logger.errors.UNSUPPORTED_OPERATION, {
            operation: (operation || "_checkProvider") });
        }
    }

    static isSigner(value: any): value is Signer {
        return !!(value && value._isSigner);
    }
}

export class VoidSigner extends Signer implements TypedDataSigner {
    readonly address: string;

    constructor(address: string, provider?: Provider) {
        logger.checkNew(new.target, VoidSigner);
        super();
        defineReadOnly(this, "address", address);
        defineReadOnly(this, "provider", provider || null);
    }

    getAddress(): Promise<string> {
        return Promise.resolve(this.address);
    }

    _fail(message: string, operation: string): Promise<any> {
        return Promise.resolve().then(() => {
            logger.throwError(message, Logger.errors.UNSUPPORTED_OPERATION, { operation: operation });
        });
    }

    signMessage(message: Bytes | string): Promise<string> {
        return this._fail("VoidSigner cannot sign messages", "signMessage");
    }

    signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string> {
        return this._fail("VoidSigner cannot sign transactions", "signTransaction");
    }

    _signTypedData(domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, value: Record<string, any>): Promise<string> {
        return this._fail("VoidSigner cannot sign typed data", "signTypedData");
    }

    connect(provider: Provider): VoidSigner {
        return new VoidSigner(this.address, provider);
    }
}


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