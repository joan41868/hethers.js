"use strict";


export type Network = {
    name: string,
    chainId: number,
    ensAddress?: string,
    _defaultProvider?: (providers: any, options?: any) => any
}

export type HederaNetwork = {
    name: string,
    chainId: number,
    ensAddress?: string,
    _defaultProvider?: (providers: any, options?: any) => any,
    nodeUrl: string,
    mirrorNodeUrl: string
}

export type Networkish = Network | HederaNetwork | string | number;
