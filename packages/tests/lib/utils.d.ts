import { ethers } from "ethers";
declare function randomBytes(seed: string, lower: number, upper?: number): Uint8Array;
declare function randomHexString(seed: string, lower: number, upper?: number): string;
declare function randomNumber(seed: string, lower: number, upper: number): number;
declare function equals(a: any, b: any): boolean;
/**
 * Helper function that returns a Wallet instance from the provided ED25519 credentials, provided from portal.hedera.com
 */
declare const createWalletFromED25519: (provider: ethers.providers.BaseProvider, account?: any, initialBalance?: number) => Promise<ethers.Wallet>;
export { randomBytes, randomHexString, randomNumber, equals, createWalletFromED25519 };
//# sourceMappingURL=utils.d.ts.map