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
import { ethers } from "ethers";
import { version } from "./_version";
const logger = new ethers.utils.Logger(version);
// @TODO: Keep a per-NonceManager pool of sent but unmined transactions for
//        rebroadcasting, in case we overrun the transaction pool
/**
 * TODO: This class and it's usage in the hedera network must be explored.
 */
export class NonceManager extends ethers.Signer {
    constructor(signer) {
        logger.checkNew(new.target, NonceManager);
        super();
        this._deltaCount = 0;
        ethers.utils.defineReadOnly(this, "signer", signer);
        ethers.utils.defineReadOnly(this, "provider", signer.provider || null);
    }
    connect(provider) {
        return new NonceManager(this.signer.connect(provider));
    }
    getAddress() {
        return this.signer.getAddress();
    }
    setTransactionCount(transactionCount) {
        this._initialPromise = Promise.resolve(transactionCount).then((nonce) => {
            return ethers.BigNumber.from(nonce).toNumber();
        });
        this._deltaCount = 0;
    }
    incrementTransactionCount(count) {
        this._deltaCount += (count ? count : 1);
    }
    signMessage(message) {
        return this.signer.signMessage(message);
        ;
    }
    signTransaction(transaction) {
        return this.signer.signTransaction(transaction);
    }
    sendTransaction(transaction) {
        return this.signer.sendTransaction(transaction).then((tx) => {
            return tx;
        });
    }
    createAccount(pubKey, initialBalance) {
        return __awaiter(this, void 0, void 0, function* () {
            // @ts-ignore
            return logger.throwError("Unsupported operation", ethers.errors.UNSUPPORTED_OPERATION, {
                operation: "createAccount"
            });
        });
    }
    ;
}
//# sourceMappingURL=nonce-manager.js.map