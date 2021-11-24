import { BytesLike } from "@ethersproject/bytes";
import { BigNumberish } from "@ethersproject/bignumber";
export declare function getAddress(address: string): string;
export declare function isAddress(address: string): boolean;
export declare function getIcapAddress(address: string): string;
export declare function getContractAddress(transaction: {
    from: string;
    nonce: BigNumberish;
}): string;
export declare function getCreate2Address(from: string, salt: BytesLike, initCodeHash: BytesLike): string;
export declare function getAddressFromAccount(accountLike: AccountLike): string;
export declare function getAccountFromAddress(address: string): Account;
export declare function parseAccount(account: string): Account;
export declare type Account = {
    shard: number;
    realm: number;
    num: number;
};
export declare type AccountLike = Account | string;
//# sourceMappingURL=index.d.ts.map