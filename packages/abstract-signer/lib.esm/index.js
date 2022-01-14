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
import { arrayify, hexlify } from "@ethersproject/bytes";
import { defineReadOnly, resolveProperties, shallowCopy } from "@ethersproject/properties";
import { Logger } from "@ethersproject/logger";
import { version } from "./_version";
import { getAccountFromAddress } from "@ethersproject/address";
import { PublicKey as HederaPubKey, ContractCallQuery } from "@hashgraph/sdk";
const logger = new Logger(version);
const allowedTransactionKeys = [
    "accessList", "chainId", "customData", "data", "from", "gasLimit", "maxFeePerGas", "maxPriorityFeePerGas", "to", "type", "value"
];
const forwardErrors = [
    Logger.errors.INSUFFICIENT_FUNDS,
    Logger.errors.NONCE_EXPIRED,
    Logger.errors.REPLACEMENT_UNDERPRICED,
];
;
;
export class Signer {
    ///////////////////
    // Sub-classes MUST call super
    constructor() {
        logger.checkAbstract(new.target, Signer);
        defineReadOnly(this, "_isSigner", true);
    }
    getGasPrice() {
        return __awaiter(this, void 0, void 0, function* () {
            this._checkProvider("getGasPrice");
            return yield this.provider.getGasPrice();
        });
    }
    ///////////////////
    // Sub-classes MAY override these
    getBalance(blockTag) {
        return __awaiter(this, void 0, void 0, function* () {
            this._checkProvider("getBalance");
            return yield this.provider.getBalance(this.getAddress(), blockTag);
        });
    }
    // Populates "from" if unspecified, and estimates the gas for the transaction
    estimateGas(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            this._checkProvider("estimateGas");
            const tx = yield resolveProperties(this.checkTransaction(transaction));
            return yield this.provider.estimateGas(tx);
        });
    }
    /**
     * TODO: attempt hacking the hedera sdk to get a costAnswer query.
     *  The dry run of the query should have returned the answer as well
     *  This may be bad for hedera but is good for ethers
     *  It may also be necessary to re-create the provider.call method in order to send those queries
     *
     *
     * @param transaction - the unsigned raw query to be sent against the smart contract
     * @param blockTag - currently unused
     */
    call(transaction, blockTag) {
        return __awaiter(this, void 0, void 0, function* () {
            this._checkProvider("call");
            const tx = yield resolveProperties(this.checkTransaction(transaction));
            const acc = getAccountFromAddress(tx.to.toString());
            const contractId = `${acc.shard}.${acc.realm}.${acc.num}`;
            const hederaTx = new ContractCallQuery()
                .setContractId(contractId)
                .setFunctionParameters(arrayify(tx.data));
            const signed = hederaTx.toBytes();
            const response = yield this.provider.sendTransaction(hexlify(signed));
            return response.data;
        });
    }
    // Populates all fields in a transaction, signs it and sends it to the network
    sendTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = yield resolveProperties(transaction);
            // to - sign & send
            // no `to` - file create and appends and contract create;
            // create TransactionRequest objects and pass them down to the sign fn
            // sign & send on each tx
            // contract create would be the expected result of create + append + contract create
            if (tx.to) {
                const signed = yield this.signTransaction(tx);
                return yield this.provider.sendTransaction(signed);
            }
            else {
                const contractByteCode = tx.data;
                let chunks = splitInChunks(Buffer.from(contractByteCode).toString(), 4096);
                const fileCreate = {
                    customData: {
                        fileChunk: chunks[0],
                        fileKey: HederaPubKey.fromString(this._signingKey().compressedPublicKey)
                    }
                };
                const signedFileCreate = yield this.signTransaction(fileCreate);
                const resp = yield this.provider.sendTransaction(signedFileCreate);
                for (let chunk of chunks.slice(1)) {
                    const fileAppend = {
                        customData: {
                            // @ts-ignore
                            fileId: resp.customData.fileId.toString(),
                            fileChunk: chunk
                        }
                    };
                    const signedFileAppend = yield this.signTransaction(fileAppend);
                    yield this.provider.sendTransaction(signedFileAppend);
                }
                // @ts-ignore
                const contractCreate = {
                    gasLimit: tx.gasLimit,
                    customData: {
                        // @ts-ignore
                        bytecodeFileId: resp.customData.fileId.toString()
                    }
                };
                const signedContractCreate = yield this.signTransaction(contractCreate);
                return yield this.provider.sendTransaction(signedContractCreate);
            }
        });
    }
    getChainId() {
        return __awaiter(this, void 0, void 0, function* () {
            this._checkProvider("getChainId");
            const network = yield this.provider.getNetwork();
            return network.chainId;
        });
    }
    resolveName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            this._checkProvider("resolveName");
            return yield this.provider.resolveName(name);
        });
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
    checkTransaction(transaction) {
        for (const key in transaction) {
            if (allowedTransactionKeys.indexOf(key) === -1) {
                logger.throwArgumentError("invalid transaction key: " + key, "transaction", transaction);
            }
        }
        const tx = shallowCopy(transaction);
        if (tx.from == null) {
            tx.from = this.getAddress();
        }
        else {
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
    //
    // Notes:
    //  - We allow gasPrice for EIP-1559 as long as it matches maxFeePerGas
    populateTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = yield resolveProperties(this.checkTransaction(transaction));
            if (tx.to != null) {
                tx.to = Promise.resolve(tx.to).then((to) => __awaiter(this, void 0, void 0, function* () {
                    if (to == null) {
                        return null;
                    }
                    const address = yield this.resolveName(to.toString());
                    if (address == null) {
                        logger.throwArgumentError("provided ENS name resolves to null", "tx.to", to);
                    }
                    return address;
                }));
                // Prevent this error from causing an UnhandledPromiseException
                tx.to.catch((error) => { });
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
                tx.gasLimit = this.estimateGas(tx).catch((error) => {
                    if (forwardErrors.indexOf(error.code) >= 0) {
                        throw error;
                    }
                    return logger.throwError("cannot estimate gas; transaction may fail or may require manual gas limit", Logger.errors.UNPREDICTABLE_GAS_LIMIT, {
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
                ]).then((results) => {
                    if (results[1] !== 0 && results[0] !== results[1]) {
                        logger.throwArgumentError("chainId address mismatch", "transaction", transaction);
                    }
                    return results[0];
                });
            }
            return yield resolveProperties(tx);
        });
    }
    ///////////////////
    // Sub-classes SHOULD leave these alone
    _checkProvider(operation) {
        if (!this.provider) {
            logger.throwError("missing provider", Logger.errors.UNSUPPORTED_OPERATION, {
                operation: (operation || "_checkProvider")
            });
        }
    }
    static isSigner(value) {
        return !!(value && value._isSigner);
    }
}
export class VoidSigner extends Signer {
    constructor(address, provider) {
        logger.checkNew(new.target, VoidSigner);
        super();
        defineReadOnly(this, "address", address);
        defineReadOnly(this, "provider", provider || null);
    }
    getAddress() {
        return Promise.resolve(this.address);
    }
    _fail(message, operation) {
        return Promise.resolve().then(() => {
            logger.throwError(message, Logger.errors.UNSUPPORTED_OPERATION, { operation: operation });
        });
    }
    signMessage(message) {
        return this._fail("VoidSigner cannot sign messages", "signMessage");
    }
    signTransaction(transaction) {
        return this._fail("VoidSigner cannot sign transactions", "signTransaction");
    }
    _signTypedData(domain, types, value) {
        return this._fail("VoidSigner cannot sign typed data", "signTypedData");
    }
    connect(provider) {
        return new VoidSigner(this.address, provider);
    }
}
function splitInChunks(data, chunkSize) {
    const chunks = [];
    let num = 0;
    while (num <= data.length) {
        const slice = data.slice(num, chunkSize + num);
        num += chunkSize;
        chunks.push(slice);
    }
    return chunks;
}
//# sourceMappingURL=index.js.map