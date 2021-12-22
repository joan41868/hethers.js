"use strict";

import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { BytesLike, isHexString } from "@ethersproject/bytes";
import { Network } from "@ethersproject/networks";
import { Deferrable, Description, defineReadOnly } from "@ethersproject/properties";
import { AccessListish, Transaction } from "@ethersproject/transactions";

import { Logger } from "@ethersproject/logger";
import { version } from "./_version";
import { AccountLike } from "@ethersproject/address";
const logger = new Logger(version);

///////////////////////////////
// Exported Types


export type TransactionRequest = {
    // Should be AccountLike. `to` is not populated for Contract Deployment
    to?: AccountLike,
    // Should be AccountLike -> if `from` is populated, we should verify that the Wallet.account is the same
    from?: AccountLike,

    // Should be the same. We must use it for `gas` property in ContractCreate/Call
    gasLimit?: BigNumberish,

    // Should be the same. We must use it for `contents` property in `FileCreate` and for `functionArguments` in
    // ContractCall
    data?: BytesLike,
    // Should be the same. We must use it for `initialBalance` in `ContractCreate` and for `amount` in ContractCall
    value?: BigNumberish,
    // We should leave it as is
    chainId?: number

    // We should ignore it for now. This refers to Type2 TX (EIP1559)
    type?: number;
    // We should ignore it for now. AccessList support is not yet merged into Hedera. Tanyu worked on it
    accessList?: AccessListish;

    // We should ignore it for now. Refers to Type2 TX
    maxPriorityFeePerGas?: BigNumberish;
    // We should ignore it for now. Refers to Type2 TX
    maxFeePerGas?: BigNumberish;

    // https://github.com/ethers-io/ethers.js/issues/1761
    // https://github.com/ethers-io/ethers.js/commit/68095a48ae19ed06cbcf2f415f1fcbda90d4b2ae
    // We should use this to indicate whether we must do FileCreate/ContractCreate or ContractCall
    customData?: Record<string, any>;
}

export interface TransactionResponse extends Transaction {
    // Populate it
    hash: string;

    // Only if a transaction has been mined
    blockNumber?: number, // Ignore and not populate it
    blockHash?: string, // Ignore and not populate it
    timestamp?: number, // Populate it if transaction has been mined and mirror node returns it

    confirmations: number, // hardcode 0 for now

    // Not optional (as it is in Transaction)
    from: string; // populate it from ethersTx

    // The raw transaction
    raw?: string, // equivalent of signed transaction

    // This function waits until the transaction has been mined
    wait: (confirmations?: number) => Promise<TransactionReceipt>,// Should poll the mirror node
    customData?: {
        [key: string]:any;
    }
}

export type BlockTag = string | number;

export interface _Block {
    hash: string;
    parentHash: string;
    number: number;

    timestamp: number;
    nonce: string;
    difficulty: number;
    _difficulty: BigNumber;

    gasLimit: BigNumber;
    gasUsed: BigNumber;

    miner: string;
    extraData: string;

    baseFeePerGas?: null | BigNumber;
}

export interface Block extends _Block {
    transactions: Array<string>;
}

export interface BlockWithTransactions extends _Block {
    transactions: Array<TransactionResponse>;
}


export interface Log {
    blockNumber: number;
    blockHash: string;
    transactionIndex: number;

    removed: boolean;

    address: string;
    data: string;

    topics: Array<string>;

    transactionHash: string;
    logIndex: number;
}

export interface TransactionReceipt {
    to: string;
    from: string;
    contractAddress: string,
    transactionIndex: number,
    root?: string,
    gasUsed: BigNumber,
    logsBloom: string,
    blockHash: string,
    transactionHash: string,
    logs: Array<Log>,
    blockNumber: number,
    confirmations: number,
    cumulativeGasUsed: BigNumber,
    effectiveGasPrice: BigNumber,
    byzantium: boolean,
    type: number;
    status?: number
};

export interface FeeData {
    maxFeePerGas: null | BigNumber;
    maxPriorityFeePerGas: null | BigNumber;
    gasPrice: null | BigNumber;
}

export interface EventFilter {
    address?: string;
    topics?: Array<string | Array<string> | null>;
}

export interface Filter extends EventFilter {
    fromBlock?: BlockTag,
    toBlock?: BlockTag,
}

export interface FilterByBlockHash extends EventFilter {
    blockHash?: string;
}

//export type CallTransactionable = {
//    call(transaction: TransactionRequest): Promise<TransactionResponse>;
//};

export abstract class ForkEvent extends Description {
    readonly expiry: number;

    readonly _isForkEvent?: boolean;

    static isForkEvent(value: any): value is ForkEvent {
        return !!(value && value._isForkEvent);
    }
}

export class BlockForkEvent extends ForkEvent {
    readonly blockHash: string;

    readonly _isBlockForkEvent?: boolean;

    constructor(blockHash: string, expiry?: number) {
        if (!isHexString(blockHash, 32)) {
            logger.throwArgumentError("invalid blockHash", "blockHash", blockHash);
        }

        super({
            _isForkEvent: true,
            _isBlockForkEvent: true,
            expiry: (expiry || 0),
            blockHash: blockHash
        });
    }
}

export class TransactionForkEvent extends ForkEvent {
    readonly hash: string;

    readonly _isTransactionOrderForkEvent?: boolean;

    constructor(hash: string, expiry?: number) {
        if (!isHexString(hash, 32)) {
            logger.throwArgumentError("invalid transaction hash", "hash", hash);
        }

        super({
            _isForkEvent: true,
            _isTransactionForkEvent: true,
            expiry: (expiry || 0),
            hash: hash
        });
    }
}

export class TransactionOrderForkEvent extends ForkEvent {
    readonly beforeHash: string;
    readonly afterHash: string;

    constructor(beforeHash: string, afterHash: string, expiry?: number) {
        if (!isHexString(beforeHash, 32)) {
            logger.throwArgumentError("invalid transaction hash", "beforeHash", beforeHash);
        }
        if (!isHexString(afterHash, 32)) {
            logger.throwArgumentError("invalid transaction hash", "afterHash", afterHash);
        }

        super({
            _isForkEvent: true,
            _isTransactionOrderForkEvent: true,
            expiry: (expiry || 0),
            beforeHash: beforeHash,
            afterHash: afterHash
        });
    }
}

export type EventType = string | Array<string | Array<string>> | EventFilter | ForkEvent;

export type Listener = (...args: Array<any>) => void;

///////////////////////////////
// Exported Abstracts
export abstract class Provider {

    // Network
    abstract getNetwork(): Promise<Network>;

    // Latest State
    getGasPrice(): Promise<BigNumber> {
        return logger.throwArgumentError("getGasPrice not implemented", Logger.errors.NOT_IMPLEMENTED, {
            operation: "getGasPrice"
        });
    }

    // Account
    abstract getBalance(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<BigNumber>;
    abstract getCode(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<string> ;

    // Execution
    abstract sendTransaction(signedTransaction: string | Promise<string>): Promise<TransactionResponse>;
    abstract call(transaction: Deferrable<TransactionRequest>, blockTag?: BlockTag | Promise<BlockTag>): Promise<string>;
    abstract estimateGas(transaction: Deferrable<TransactionRequest>): Promise<BigNumber>;

    abstract getTransaction(transactionHash: string): Promise<TransactionResponse>;
    abstract getTransactionReceipt(transactionHash: string): Promise<TransactionReceipt>;

    // Bloom-filter Queries
    abstract getLogs(filter: Filter): Promise<Array<Log>>;

    // ENS
    abstract resolveName(name: string | Promise<string>): Promise<null | string>;
    abstract lookupAddress(address: string | Promise<string>): Promise<null | string>;

    // Event Emitter (ish)
    abstract on(eventName: EventType, listener: Listener): Provider;
    abstract once(eventName: EventType, listener: Listener): Provider;
    abstract emit(eventName: EventType, ...args: Array<any>): boolean
    abstract listenerCount(eventName?: EventType): number;
    abstract listeners(eventName?: EventType): Array<Listener>;
    abstract off(eventName: EventType, listener?: Listener): Provider;
    abstract removeAllListeners(eventName?: EventType): Provider;

    // Alias for "on"
    addListener(eventName: EventType, listener: Listener): Provider {
        return this.on(eventName, listener);
    }

    // Alias for "off"
    removeListener(eventName: EventType, listener: Listener): Provider {
        return this.off(eventName, listener);
    }

    // @TODO: This *could* be implemented here, but would pull in events...
    abstract waitForTransaction(transactionHash: string, confirmations?: number, timeout?: number): Promise<TransactionReceipt>;

    readonly _isProvider: boolean;

    constructor() {
        logger.checkAbstract(new.target, Provider);
        defineReadOnly(this, "_isProvider", true);
    }

    static isProvider(value: any): value is Provider {
        return !!(value && value._isProvider);
    }

/*
    static getResolver(network: Network, callable: CallTransactionable, namehash: string): string {
        // No ENS...
        if (!network.ensAddress) {
            errors.throwError(
                "network does support ENS",
                errors.UNSUPPORTED_OPERATION,
                { operation: "ENS", network: network.name }
            );
        }

        // Not a namehash
        if (!isHexString(namehash, 32)) {
            errors.throwArgumentError("invalid name hash", "namehash", namehash);
        }

        // keccak256("resolver(bytes32)")
        let data = "0x0178b8bf" + namehash.substring(2);
        let transaction = { to: network.ensAddress, data: data };

        return provider.call(transaction).then((data) => {
            return provider.formatter.callAddress(data);
        });
    }

    static resolveNamehash(network: Network, callable: CallTransactionable, namehash: string): string {
        return this.getResolver(network, callable, namehash).then((resolverAddress) => {
            if (!resolverAddress) { return null; }

            // keccak256("addr(bytes32)")
            let data = "0x3b3b57de" + namehash(name).substring(2);
            let transaction = { to: resolverAddress, data: data };
            return callable.call(transaction).then((data) => {
                return this.formatter.callAddress(data);
            });

        })
    }
*/
}
