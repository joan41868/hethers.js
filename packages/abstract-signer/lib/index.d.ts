import { BlockTag, Provider, TransactionRequest, TransactionResponse } from "@ethersproject/abstract-provider";
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { Bytes, BytesLike } from "@ethersproject/bytes";
import { Deferrable } from "@ethersproject/properties";
import { Account } from "@ethersproject/address";
import { SigningKey } from "@ethersproject/signing-key";
export interface TypedDataDomain {
    name?: string;
    version?: string;
    chainId?: BigNumberish;
    verifyingContract?: string;
    salt?: BytesLike;
}
export interface TypedDataField {
    name: string;
    type: string;
}
export interface ExternallyOwnedAccount {
    readonly address?: string;
    readonly account?: Account;
    readonly alias?: string;
    readonly privateKey: string;
}
export interface TypedDataSigner {
    _signTypedData(domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, value: Record<string, any>): Promise<string>;
}
export declare abstract class Signer {
    readonly provider?: Provider;
    readonly _signingKey: () => SigningKey;
    abstract getAddress(): Promise<string>;
    abstract signMessage(message: Bytes | string): Promise<string>;
    /**
     * Signs a transaction with the key given upon creation.
     * The transaction can be:
     * - FileCreate - when there is only `fileChunk` field in the `transaction.customData` object
     * - FileAppend - when there is both `fileChunk` and a `fileId` fields
     * - ContractCreate - when there is a `bytecodeFileId` field
     * - ContractCall - when there is a `to` field present. Ignores the other fields
     *
     * @param transaction - the transaction to be signed.
     */
    abstract signTransaction(transaction: TransactionRequest): Promise<string>;
    abstract connect(provider: Provider): Signer;
    readonly _isSigner: boolean;
    constructor();
    getGasPrice(): Promise<BigNumber>;
    getBalance(blockTag?: BlockTag): Promise<BigNumber>;
    estimateGas(transaction: Deferrable<TransactionRequest>): Promise<BigNumber>;
    /**
     * TODO: attempt hacking the hedera sdk to get a costAnswer query.
     *  The dry run of the query should have returned the answer as well
     *  This may be bad for hedera but is good for ethers
     *  It may also be necessary to re-create the provider.call method in order to send those queries
     *
     *
     * @param transaction - the unsigned raw query to be sent against the smart contract
     * @param blockTag - currently unused
     */
    call(transaction: Deferrable<TransactionRequest>, blockTag?: BlockTag): Promise<string>;
    sendTransaction(transaction: Deferrable<TransactionRequest>): Promise<TransactionResponse>;
    getChainId(): Promise<number>;
    resolveName(name: string): Promise<string>;
    checkTransaction(transaction: Deferrable<TransactionRequest>): Deferrable<TransactionRequest>;
    populateTransaction(transaction: Deferrable<TransactionRequest>): Promise<TransactionRequest>;
    _checkProvider(operation?: string): void;
    static isSigner(value: any): value is Signer;
}
export declare class VoidSigner extends Signer implements TypedDataSigner {
    readonly address: string;
    constructor(address: string, provider?: Provider);
    getAddress(): Promise<string>;
    _fail(message: string, operation: string): Promise<any>;
    signMessage(message: Bytes | string): Promise<string>;
    signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string>;
    _signTypedData(domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, value: Record<string, any>): Promise<string>;
    connect(provider: Provider): VoidSigner;
}
//# sourceMappingURL=index.d.ts.map