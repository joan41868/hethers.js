"use strict";

import { AccountLike } from "@ethersproject/address";

export type Network = {
    name: string,
    chainId: number,
    ensAddress?: string,
    _defaultProvider?: (providers: any, options?: any) => any
};


export type HederaOperator = {
    accountId: AccountLike,
    privateKey: string,
    publicKey?: string // can be derived from the private key
};

export type HederaNetworkConfigLike = {
    operator?: HederaOperator,
    network?: NodeUrlEntries
}

export type NodeUrlEntries = {
    [key: string]: any;
};



export type Networkish = Network | string | number;
