"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MIRROR_PREVIEWNET_CONFIG = exports.MIRROR_TESTNET_CONFIG = exports.MIRROR_MAINNET_CONFIG = exports.PREVIEWNET_CONFIG = exports.TESTNET_CONFIG = exports.MAINNET_CONFIG = exports.PREVIEWNET = exports.TESTNET = exports.MAINNET = exports.NetworkType = exports.HEDERA_CHAIN_IDS = void 0;
// @ts-ignore
var proto_1 = require("@hashgraph/proto");
var Long = require("long");
function propsWithAccountNum(num) {
    return {
        shardNum: Long.fromNumber(0),
        realmNum: Long.fromNumber(0),
        accountNum: Long.fromNumber(num)
    };
}
exports.HEDERA_CHAIN_IDS = {
    MAINNET: 290,
    TESTNET: 291,
    PREVIEWNET: 292
};
var NetworkType;
(function (NetworkType) {
    NetworkType["MAINNET"] = "mainnet";
    NetworkType["TESTNET"] = "testnet";
    NetworkType["PREVIEWNET"] = "previewnet";
})(NetworkType = exports.NetworkType || (exports.NetworkType = {}));
exports.MAINNET = {
    chainId: exports.HEDERA_CHAIN_IDS.MAINNET,
    name: NetworkType.MAINNET
};
exports.TESTNET = {
    chainId: exports.HEDERA_CHAIN_IDS.TESTNET,
    name: NetworkType.TESTNET
};
exports.PREVIEWNET = {
    chainId: exports.HEDERA_CHAIN_IDS.PREVIEWNET,
    name: NetworkType.PREVIEWNET
};
exports.MAINNET_CONFIG = {
    "35.237.200.180:50211": new proto_1.AccountID(propsWithAccountNum(3)),
    "35.186.191.247:50211": new proto_1.AccountID(propsWithAccountNum(4)),
    "35.192.2.25:50211": new proto_1.AccountID(propsWithAccountNum(5)),
    "35.199.161.108:50211": new proto_1.AccountID(propsWithAccountNum(6)),
    "35.203.82.240:50211": new proto_1.AccountID(propsWithAccountNum(7)),
    "35.236.5.219:50211": new proto_1.AccountID(propsWithAccountNum(8)),
    "35.197.192.225:50211": new proto_1.AccountID(propsWithAccountNum(9)),
    "35.242.233.154:50211": new proto_1.AccountID(propsWithAccountNum(10)),
    "35.240.118.96:50211": new proto_1.AccountID(propsWithAccountNum(11)),
    "35.204.86.32:50211": new proto_1.AccountID(propsWithAccountNum(12)),
    "35.234.132.107:50211": new proto_1.AccountID(propsWithAccountNum(13)),
    "35.236.2.27:50211": new proto_1.AccountID(propsWithAccountNum(14)),
    "35.228.11.53:50211": new proto_1.AccountID(propsWithAccountNum(15)),
    "34.91.181.183:50211": new proto_1.AccountID(propsWithAccountNum(16)),
    "34.86.212.247:50211": new proto_1.AccountID(propsWithAccountNum(17)),
    "172.105.247.67:50211": new proto_1.AccountID(propsWithAccountNum(18)),
    "34.89.87.138:50211": new proto_1.AccountID(propsWithAccountNum(19)),
    "34.82.78.255:50211": new proto_1.AccountID(propsWithAccountNum(20)),
};
exports.TESTNET_CONFIG = {
    "0.testnet.hedera.com:50211": new proto_1.AccountID(propsWithAccountNum(3)),
    "1.testnet.hedera.com:50211": new proto_1.AccountID(propsWithAccountNum(4)),
    "2.testnet.hedera.com:50211": new proto_1.AccountID(propsWithAccountNum(5)),
    "3.testnet.hedera.com:50211": new proto_1.AccountID(propsWithAccountNum(6)),
    "4.testnet.hedera.com:50211": new proto_1.AccountID(propsWithAccountNum(7)),
};
exports.PREVIEWNET_CONFIG = {
    "0.previewnet.hedera.com:50211": new proto_1.AccountID(propsWithAccountNum(3)),
    "1.previewnet.hedera.com:50211": new proto_1.AccountID(propsWithAccountNum(4)),
    "2.previewnet.hedera.com:50211": new proto_1.AccountID(propsWithAccountNum(5)),
    "3.previewnet.hedera.com:50211": new proto_1.AccountID(propsWithAccountNum(6)),
    "4.previewnet.hedera.com:50211": new proto_1.AccountID(propsWithAccountNum(7)),
};
exports.MIRROR_MAINNET_CONFIG = [
    "hcs.mainnet.mirrornode.hedera.com:5600"
];
exports.MIRROR_TESTNET_CONFIG = [
    "hcs.testnet.mirrornode.hedera.com:5600"
];
exports.MIRROR_PREVIEWNET_CONFIG = [
    "hcs.previewnet.mirrornode.hedera.com:5600"
];
//# sourceMappingURL=hedera_networks.js.map