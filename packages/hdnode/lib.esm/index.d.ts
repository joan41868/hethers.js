import { ExternallyOwnedAccount } from "@ethersproject/abstract-signer";
import { BytesLike } from "@ethersproject/bytes";
import { Wordlist } from "@ethersproject/wordlists";
import { Account, AccountLike } from "@ethersproject/address";
export declare const defaultPath = "m/44'/60'/0'/0/0";
export interface Mnemonic {
    readonly phrase: string;
    readonly path: string;
    readonly locale: string;
}
export declare class HDNode implements ExternallyOwnedAccount {
    readonly privateKey: string;
    readonly publicKey: string;
    readonly fingerprint: string;
    readonly parentFingerprint: string;
    readonly address: string;
    readonly account: Account;
    readonly mnemonic?: Mnemonic;
    readonly path: string;
    readonly chainCode: string;
    readonly index: number;
    readonly depth: number;
    /**
     *  This constructor should not be called directly.
     *
     *  Please use:
     *   - fromMnemonic
     *   - fromSeed
     */
    constructor(constructorGuard: any, accountLike: AccountLike, privateKey: string, publicKey: string, parentFingerprint: string, chainCode: string, index: number, depth: number, mnemonicOrPath: Mnemonic | string);
    get extendedKey(): string;
    neuter(): HDNode;
    private _derive;
    derivePath(path: string): HDNode;
    static _fromSeed(accountLike: AccountLike, seed: BytesLike, mnemonic: Mnemonic): HDNode;
    static fromMnemonic(accountLike: AccountLike, mnemonic: string, password?: string, wordlist?: string | Wordlist): HDNode;
    static fromSeed(accountLike: AccountLike, seed: BytesLike): HDNode;
    static fromExtendedKey(accountLike: AccountLike, extendedKey: string): HDNode;
}
export declare function mnemonicToSeed(mnemonic: string, password?: string): string;
export declare function mnemonicToEntropy(mnemonic: string, wordlist?: string | Wordlist): string;
export declare function entropyToMnemonic(entropy: BytesLike, wordlist?: string | Wordlist): string;
export declare function isValidMnemonic(mnemonic: string, wordlist?: Wordlist): boolean;
export declare function getAccountPath(index: number): string;
//# sourceMappingURL=index.d.ts.map