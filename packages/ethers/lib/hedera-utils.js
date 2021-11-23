"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSolidityAddress = exports.encodeHex = exports.decodeHex = exports.fromSolidityAddress = void 0;
var long_1 = __importDefault(require("long"));
function fromSolidityAddress(address) {
    var addr = address.startsWith("0x")
        ? decodeHex(address.slice(2))
        : decodeHex(address);
    if (addr.length !== 20) {
        throw new Error("Invalid hex encoded solidity address length:\n                expected length 40, got length " + address.length);
    }
    var addr2 = [];
    addr.map(function (e) { return addr2.push(e.valueOf()); });
    var shard = long_1.default.fromBytesBE(__spreadArray([0, 0, 0, 0], addr2.slice(0, 4), true));
    var realm = long_1.default.fromBytesBE(Array.from(addr.slice(4, 12)));
    var num = long_1.default.fromBytesBE(Array.from(addr.slice(12, 20)));
    return [shard, realm, num];
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