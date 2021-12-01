export declare type Network = {
    name: string;
    chainId: number;
    ensAddress?: string;
    _defaultProvider?: (providers: any, options?: any) => any;
};
export declare type HederaNetwork = {
    name: string;
    chainId: number;
    ensAddress?: string;
    _defaultProvider?: (providers: any, options?: any) => any;
    nodeUrl: string;
    mirrorNodeUrl: string;
};
export declare type Networkish = Network | HederaNetwork | string | number;
//# sourceMappingURL=types.d.ts.map