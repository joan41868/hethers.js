"use strict";

import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { BytesLike, isHexString } from "@ethersproject/bytes";
import { Network } from "@ethersproject/networks";
import { Deferrable, Description, defineReadOnly } from "@ethersproject/properties";
import { AccessListish, Transaction } from "@ethersproject/transactions";

import { Logger } from "@ethersproject/logger";
import { version } from "./_version";
import { AccountLike } from "@ethersproject/address";
import { AccountId } from "@hashgraph/sdk";
const logger = new Logger(version);

///////////////////////////////
// Exported Types


export type TransactionRequest = {
    to?: AccountLike,
    from?: AccountLike,
    gasLimit?: BigNumberish,
    data?: BytesLike,
    value?: BigNumberish,
    chainId?: number
    type?: number;
    accessList?: AccessListish;
    maxPriorityFeePerGas?: BigNumberish;
    maxFeePerGas?: BigNumberish;
    nodeId?: AccountLike,
    customData?: Record<string, any>;
}

export type HederaTransactionResponse = {
    amount: number,
    call_result: string,
    contract_id: string,
    created_contract_ids: string[],
    error_message: string,
    from: string,
    function_parameters: string,
    gas_limit: number,
    gas_used: number,
    timestamp: string,
    to: string,
    block_hash: string,
    block_number: number,
    hash: string,
    logs: {},
    transaction: {
        transaction_id: string,
        result: string
    }
}
  
export interface TransactionResponse extends Transaction {
    hash: string;
    timestamp?: number,
    from: string;
    raw?: string,
    wait: (confirmations?: number) => Promise<TransactionReceipt>,
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
    gasUsed: BigNumber,
    logsBloom: string,
    transactionHash: string,
    logs: Array<Log>,
    cumulativeGasUsed: BigNumber,
    byzantium: boolean,
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
    getHederaNetworkConfig() : AccountId[] {
        return logger.throwError("getHederaNetworkConfig not implemented", Logger.errors.NOT_IMPLEMENTED, {
            operation: 'getHederaNetworkConfig'
        })
    }

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
    abstract estimateGas(transaction: Deferrable<TransactionRequest>): Promise<BigNumber>;

    abstract getTransaction(transactionHash: string): Promise<TransactionResponse>;
    abstract getTransactionReceipt(transactionHash: string): Promise<TransactionReceipt>;

    // Bloom-filter Queries
    abstract getLogs(filter: Filter): Promise<Array<Log>>;

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
