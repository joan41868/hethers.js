import {AccountID} from "@hashgraph/proto";
import Long = require("long");
import {Network} from "../providers";

function propsWithAccountNum(num: number): { shardNum: Long, realmNum: Long, accountNum: Long } {
    return {
        shardNum: Long.fromNumber(0),
        realmNum: Long.fromNumber(0),
        accountNum: Long.fromNumber(num)
    }
}

export const HEDERA_CHAIN_IDS = {
    MAINNET: 290,
    TESTNET: 291,
    PREVIEWNET: 292
}

declare type HederaNetworkConfigLike = { [key: string]: (string | AccountID) };

export enum NetworkType {
    MAINNET = "mainnet",
    TESTNET = "testnet",
    PREVIEWNET = "previewnet"
}

export const MAINNET: Network = {
    chainId: HEDERA_CHAIN_IDS.MAINNET,
    name: NetworkType.MAINNET
};
export const TESTNET: Network = {
    chainId: HEDERA_CHAIN_IDS.TESTNET,
    name: NetworkType.TESTNET
};
export const PREVIEWNET: Network = {
    chainId: HEDERA_CHAIN_IDS.PREVIEWNET,
    name: NetworkType.PREVIEWNET
};
export const MAINNET_CONFIG: HederaNetworkConfigLike = {
    "35.237.200.180:50211": new AccountID(propsWithAccountNum(3)),
    "35.186.191.247:50211": new AccountID(propsWithAccountNum(4)),
    "35.192.2.25:50211": new AccountID(propsWithAccountNum(5)),
    "35.199.161.108:50211": new AccountID(propsWithAccountNum(6)),
    "35.203.82.240:50211": new AccountID(propsWithAccountNum(7)),
    "35.236.5.219:50211": new AccountID(propsWithAccountNum(8)),
    "35.197.192.225:50211": new AccountID(propsWithAccountNum(9)),
    "35.242.233.154:50211": new AccountID(propsWithAccountNum(10)),
    "35.240.118.96:50211": new AccountID(propsWithAccountNum(11)),
    "35.204.86.32:50211": new AccountID(propsWithAccountNum(12)),
    "35.234.132.107:50211": new AccountID(propsWithAccountNum(13)),
    "35.236.2.27:50211": new AccountID(propsWithAccountNum(14)),
    "35.228.11.53:50211": new AccountID(propsWithAccountNum(15)),
    "34.91.181.183:50211": new AccountID(propsWithAccountNum(16)),
    "34.86.212.247:50211": new AccountID(propsWithAccountNum(17)),
    "172.105.247.67:50211": new AccountID(propsWithAccountNum(18)),
    "34.89.87.138:50211": new AccountID(propsWithAccountNum(19)),
    "34.82.78.255:50211": new AccountID(propsWithAccountNum(20)),
};

export const TESTNET_CONFIG: HederaNetworkConfigLike = {
    "0.testnet.hedera.com:50211": new AccountID(propsWithAccountNum(3)),
    "1.testnet.hedera.com:50211": new AccountID(propsWithAccountNum(4)),
    "2.testnet.hedera.com:50211": new AccountID(propsWithAccountNum(5)),
    "3.testnet.hedera.com:50211": new AccountID(propsWithAccountNum(6)),
    "4.testnet.hedera.com:50211": new AccountID(propsWithAccountNum(7)),
};

export const PREVIEWNET_CONFIG: HederaNetworkConfigLike = {
    "0.previewnet.hedera.com:50211": new AccountID(propsWithAccountNum(3)),
    "1.previewnet.hedera.com:50211": new AccountID(propsWithAccountNum(4)),
    "2.previewnet.hedera.com:50211": new AccountID(propsWithAccountNum(5)),
    "3.previewnet.hedera.com:50211": new AccountID(propsWithAccountNum(6)),
    "4.previewnet.hedera.com:50211": new AccountID(propsWithAccountNum(7)),
}
declare type MirrorNetworkConfigLike = string[];

export const MIRROR_MAINNET_CONFIG: MirrorNetworkConfigLike = [
    "hcs.mainnet.mirrornode.hedera.com:5600"
];

export const MIRROR_TESTNET_CONFIG: MirrorNetworkConfigLike = [
    "hcs.testnet.mirrornode.hedera.com:5600"
];

export const MIRROR_PREVIEWNET_CONFIG: MirrorNetworkConfigLike = [
    "hcs.previewnet.mirrornode.hedera.com:5600"
];
