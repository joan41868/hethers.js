import { EventType, FeeData, Filter, Log, Listener, Provider, TransactionReceipt, TransactionRequest, TransactionResponse } from "@ethersproject/abstract-provider";
import { getNetwork } from "@ethersproject/networks";
import { Network, Networkish } from "@ethersproject/networks";
import { BaseProvider } from "./base-provider";
import { DefaultHederaProvider } from "./default-hedera-provider";
import { Formatter } from "./formatter";
import HederaProvider from "./hedera-provider";
declare function getDefaultProvider(network?: Networkish, options?: any): BaseProvider;
/**
 * Always composes a hedera timestamp from the given string/numeric input.
 * May lose precision - JavaScript's floating point loss
 *
 * @param timestamp - the timestamp to be formatted
 */
declare function composeHederaTimestamp(timestamp: number | string): string;
export { Provider, BaseProvider, DefaultHederaProvider, HederaProvider, getDefaultProvider, getNetwork, composeHederaTimestamp, Formatter, EventType, FeeData, Filter, Log, Listener, TransactionReceipt, TransactionRequest, TransactionResponse, Network, Networkish };
//# sourceMappingURL=index.d.ts.map