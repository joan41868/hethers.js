/* istanbul ignore file */

'use strict';

import { ethers } from "ethers";
import {AccountCreateTransaction, AccountId, Client, Hbar, PrivateKey, TransactionId, Key as HederaKey} from "@hashgraph/sdk";
import {Key} from "@hashgraph/proto";
import { arrayify } from "ethers/lib/utils";

function randomBytes(seed: string, lower: number, upper?: number): Uint8Array {
    if (!upper) { upper = lower; }

    if (upper === 0 && upper === lower) { return new Uint8Array(0); }

    let result = ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes(seed)));
    while (result.length < upper) {
        result = ethers.utils.concat([result, ethers.utils.keccak256(ethers.utils.concat([seed, result]))]);
    }

    let top = ethers.utils.arrayify(ethers.utils.keccak256(result));
    let percent = ((top[0] << 16) | (top[1] << 8) | top[2]) / 0x01000000;

    return result.slice(0, lower + Math.floor((upper - lower) * percent));
}

function randomHexString(seed: string, lower: number, upper?: number): string {
    return ethers.utils.hexlify(randomBytes(seed, lower, upper));
}

function randomNumber(seed: string, lower: number, upper: number): number {
    let top = randomBytes(seed, 3);
    let percent = ((top[0] << 16) | (top[1] << 8) | top[2]) / 0x01000000;
    return lower + Math.floor((upper - lower) * percent);
}

function equals(a: any, b: any): boolean {

    // Array (treat recursively)
    if (Array.isArray(a)) {
        if (!Array.isArray(b) || a.length !== b.length) { return false; }
        for (let i = 0; i < a.length; i++) {
            if (!equals(a[i], b[i])) { return false; }
        }
        return true;
    }

    // BigNumber
    if (a.eq) {
        if (!b.eq || !a.eq(b)) { return false; }
        return true;
    }

    // Uint8Array
    if (a.buffer) {
        if (!b.buffer || a.length !== b.length) { return false; }
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) { return false; }
        }

        return true;
    }

    // Something else
    return a === b;
}

const defaultAccount = {
    "operator": {
        "accountId": "0.0.19041642",
        "publicKey": "302a300506032b6570032100049d07fb89aa8f5e54eccd7b92846d9839404e8c0af8489a9a511422be958b2f",
        "privateKey": "302e020100300506032b6570042204207ef3437273a5146e4e504a6e22c5caedf07cb0821f01bc05d18e8e716f77f66c"
    },
    "network": {
        "0.testnet.hedera.com:50211": "0.0.3",
        "1.testnet.hedera.com:50211": "0.0.4",
        "2.testnet.hedera.com:50211": "0.0.5",
        "3.testnet.hedera.com:50211": "0.0.6"
    }
};

/**
 * Helper function that returns a Wallet instance from the provided ED25519 credentials, provided from portal.hedera.com
 */
const createWalletFromED25519 = async (provider: ethers.providers.BaseProvider, account?: any, initialBalance?: number) => {
    if (!account) account = defaultAccount;
    const edPrivateKey = PrivateKey.fromString(account.operator.privateKey);
    const client = Client.forNetwork(account.network);
    const randomWallet = ethers.Wallet.createRandom();
    const protoKey = Key.create({
        ECDSASecp256k1: arrayify(randomWallet._signingKey().compressedPublicKey)
    });

    const newAccountKey = HederaKey._fromProtobufKey(protoKey);
    const accountCreate = await (await new AccountCreateTransaction()
        .setKey(newAccountKey)
        .setTransactionId(TransactionId.generate(account.operator.accountId))
        .setInitialBalance(new Hbar(initialBalance))
        .setNodeAccountIds([new AccountId(0,0,3)])
        .freeze()
        .sign(edPrivateKey))
        .execute(client);
    const receipt = await accountCreate.getReceipt(client);
    // @ts-ignore
    const newAccountId = receipt.accountId.toString();

    const hederaEoa = {
        account: newAccountId,
        privateKey: randomWallet.privateKey
    };

    // @ts-ignore
    return new ethers.Wallet(hederaEoa, provider);
}


export {
    randomBytes,
    randomHexString,
    randomNumber,
    equals,
    createWalletFromED25519
}
