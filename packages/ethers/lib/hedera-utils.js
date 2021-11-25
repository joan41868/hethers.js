"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSolidityAddress = exports.encodeHex = exports.decodeHex = exports.fromSolidityAddress = void 0;
var ethers_1 = require("./ethers");
var utils_1 = require("./utils");
function fromSolidityAddress(address) {
    var addr = address.startsWith("0x")
        ? decodeHex(address.slice(2))
        : decodeHex(address);
    if (addr.length !== 20) {
        throw new Error("Invalid hex encoded solidity address length:\n                expected length 40, got length " + address.length);
    }
    var shard = ethers_1.BigNumber.from((0, utils_1.hexlify)(addr.slice(0, 4)));
    var realm = ethers_1.BigNumber.from((0, utils_1.hexlify)(addr.slice(4, 12)));
    var num = ethers_1.BigNumber.from((0, utils_1.hexlify)(addr.slice(12, 20)));
    return [shard.toNumber(), realm.toNumber(), num.toNumber()];
}
exports.fromSolidityAddress = fromSolidityAddress;
function decodeHex(text) {
    var str = text.startsWith("0x") ? text.substring(2) : text;
    return Buffer.from(str, "hex");
}
exports.decodeHex = decodeHex;
function encodeHex(data) {
    return Buffer.from(data).toString("hex");
}
exports.encodeHex = encodeHex;
function toSolidityAddress(address) {
    var buffer = new Uint8Array(20);
    var view = new DataView(buffer.buffer, 0, 20);
    var shard = address[0], realm = address[1], num = address[2];
    view.setUint32(0, shard);
    view.setUint32(8, realm);
    view.setUint32(16, num);
    return encodeHex(buffer);
}
exports.toSolidityAddress = toSolidityAddress;
//# sourceMappingURL=hedera-utils.js.map