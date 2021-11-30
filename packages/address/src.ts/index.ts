"use strict";

import {
    arrayify,
    BytesLike,
    concat,
    hexDataLength,
    hexDataSlice, hexlify,
    isHexString,
    stripZeros
} from "@ethersproject/bytes";
import {_base16To36, _base36To16, BigNumber, BigNumberish} from "@ethersproject/bignumber";
import {keccak256} from "@ethersproject/keccak256";
import {encode} from "@ethersproject/rlp";

import {Logger} from "@ethersproject/logger";
import {version} from "./_version";

const logger = new Logger(version);

// Shims for environments that are missing some required constants and functions
const MAX_SAFE_INTEGER: number = 0x1fffffffffffff;

function log10(x: number): number {
    if (Math.log10) {
        return Math.log10(x);
    }
    return Math.log(x) / Math.LN10;
}


// See: https://en.wikipedia.org/wiki/International_Bank_Account_Number

// Create lookup table
const ibanLookup: { [character: string]: string } = {};
for (let i = 0; i < 10; i++) {
    ibanLookup[String(i)] = String(i);
}
for (let i = 0; i < 26; i++) {
    ibanLookup[String.fromCharCode(65 + i)] = String(10 + i);
}

// How many decimal digits can we process? (for 64-bit float, this is 15)
const safeDigits = Math.floor(log10(MAX_SAFE_INTEGER));

function ibanChecksum(address: string): string {
    address = address.toUpperCase();
    address = address.substring(4) + address.substring(0, 2) + "00";

    let expanded = address.split("").map((c) => {
        return ibanLookup[c];
    }).join("");

    // Javascript can handle integers safely up to 15 (decimal) digits
    while (expanded.length >= safeDigits) {
        let block = expanded.substring(0, safeDigits);
        expanded = parseInt(block, 10) % 97 + expanded.substring(block.length);
    }

    let checksum = String(98 - (parseInt(expanded, 10) % 97));
    while (checksum.length < 2) {
        checksum = "0" + checksum;
    }

    return checksum;
}

export function getAddress(address: string): string {
    if (typeof (address) !== "string" || !address.match(/^(0x)?[0-9a-fA-F]{40}$/)) {
        logger.throwArgumentError("invalid address", "address", address);
    }

    // Missing the 0x prefix
    if (address.substring(0, 2) !== "0x") {
        address = "0x" + address;
    }
    if (!isHexString(address, 20)) {
        logger.throwArgumentError("invalid address", "address", address);
    }

    return address.toLowerCase();
}

export function isAddress(address: string): boolean {
    try {
        getAddress(address);
        return true;
    } catch (error) {
    }
    return false;
}

export function getIcapAddress(address: string): string {
    let base36 = _base16To36(getAddress(address).substring(2)).toUpperCase();
    while (base36.length < 30) {
        base36 = "0" + base36;
    }
    return "XE" + ibanChecksum("XE00" + base36) + base36;
}

// http://ethereum.stackexchange.com/questions/760/how-is-the-address-of-an-ethereum-contract-computed
export function getContractAddress(transaction: { from: string, nonce: BigNumberish }) {
    let from: string = null;
    try {
        from = getAddress(transaction.from);
    } catch (error) {
        logger.throwArgumentError("missing from address", "transaction", transaction);
    }

    const nonce = stripZeros(arrayify(BigNumber.from(transaction.nonce).toHexString()));

    return getAddress(hexDataSlice(keccak256(encode([from, nonce])), 12));
}

export function getCreate2Address(from: string, salt: BytesLike, initCodeHash: BytesLike): string {
    if (hexDataLength(salt) !== 32) {
        logger.throwArgumentError("salt must be 32 bytes", "salt", salt);
    }
    if (hexDataLength(initCodeHash) !== 32) {
        logger.throwArgumentError("initCodeHash must be 32 bytes", "initCodeHash", initCodeHash);
    }
    return getAddress(hexDataSlice(keccak256(concat(["0xff", getAddress(from), salt, initCodeHash])), 12))
}

export function getAddressFromAccount(accountLike: AccountLike): string {
    let parsedAccount: Account = typeof (accountLike) === "string" ? parseAccount(accountLike) : accountLike;
    const buffer = new Uint8Array(20);
    const view = new DataView(buffer.buffer, 0, 20);

    view.setInt32(0, Number(parsedAccount.shard));
    view.setBigInt64(4, parsedAccount.realm);
    view.setBigInt64(12, parsedAccount.num);

    return hexlify(buffer);
}

export function getAccountFromAddress(address: string): Account {
    let buffer = arrayify(getAddress(address))
    const view = new DataView(buffer.buffer, 0, 20);

    return {
        shard: BigInt(view.getInt32(0)),
        realm: BigInt(view.getBigInt64(4)),
        num: BigInt(view.getBigInt64(12))
    }
}

export function parseAccount(account: string): Account {
    let result: Account = null;
    if (typeof (account) !== "string") {
        logger.throwArgumentError("invalid account", "account", account);
    }
    if (account.match(/^[0-9]+.[0-9]+.[0-9]+$/)) {
        let parsedAccount = account.split('.');
        result = {
            shard: BigInt(parsedAccount[0]),
            realm: BigInt(parsedAccount[1]),
            num: BigInt(parsedAccount[2])
        };
    } else {
        logger.throwArgumentError("invalid account", "account", account);
    }
    return result;
}

export type Account = {
    shard: bigint,
    realm: bigint
    num: bigint
}
/**
 * Used for evm addresses and hedera accounts (represented in both Account structure and string format)
 * `0x0000000000000000000000000000000000000001`
 * `0.0.1`
 * Account{shard:0, realm:0, num: 1}
 */
export type AccountLike = Account | string;