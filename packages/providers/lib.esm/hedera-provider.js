var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { BaseProvider } from "./base-provider";
import { AccountBalanceQuery, AccountId, Client, NetworkName, } from '@hashgraph/sdk';
import { BigNumber } from "@ethersproject/bignumber";
import { getAccountFromAddress } from "ethers/lib/utils";
import axios from 'axios';
import { Logger } from '@ethersproject/logger';
import { version } from "./_version";
const logger = new Logger(version);
// resolves network string to a hedera network name
function resolveNetwork(net) {
    switch (net) {
        case 'mainnet':
            return NetworkName.Mainnet;
        case 'previewnet':
            return NetworkName.Previewnet;
        case 'testnet':
            return NetworkName.Testnet;
        default:
            logger.throwArgumentError("Invalid network name", "network", net);
            return null;
    }
}
// resolves the mirror node url from the given provider network.
function resolveMirrorNetworkUrl(net) {
    switch (net) {
        case 'mainnet':
            return 'https://mainnet.mirrornode.hedera.com';
        case 'previewnet':
            return 'https://previewnet.mirrornode.hedera.com';
        case 'testnet':
            return 'https://testnet.mirrornode.hedera.com';
        default:
            logger.throwArgumentError("Invalid network name", "network", net);
            return null;
    }
}
// contains predefined, sdk acceptable hedera network strings
export var HederaNetworks;
(function (HederaNetworks) {
    HederaNetworks["TESTNET"] = "testnet";
    HederaNetworks["PREVIEWNET"] = "previewnet";
    HederaNetworks["MAINNET"] = "mainnet";
})(HederaNetworks || (HederaNetworks = {}));
/**
 * The hedera provider uses the hashgraph module to establish a connection to the Hedera network.
 * As every provider, this one also gives us read-only access.
 *
 * Constructable with a string, which automatically resolves to a hedera network via the hashgraph SDK.
 */
export class DefaultHederaProvider extends BaseProvider {
    constructor(network) {
        super('testnet');
        this.hederaNetwork = network;
        this.hederaClient = Client.forName(resolveNetwork(network));
    }
    /**
     *  AccountBalance query implementation, using the hashgraph sdk.
     *  It returns the tinybar balance of the given address.
     *
     * @param addressOrName The address to check balance of
     * @param blockTag -  not used. Will throw if used.
     */
    getBalance(addressOrName, blockTag) {
        return __awaiter(this, void 0, void 0, function* () {
            if (blockTag || (yield blockTag)) {
                logger.throwArgumentError("Cannot use blockTag for hedera services.", "blockTag", blockTag);
                return BigNumber.from(0);
            }
            addressOrName = yield addressOrName;
            const { shard, realm, num } = getAccountFromAddress(addressOrName);
            const shardNum = BigNumber.from(shard).toNumber();
            const realmNum = BigNumber.from(realm).toNumber();
            const accountNum = BigNumber.from(num).toNumber();
            const balance = yield new AccountBalanceQuery()
                .setAccountId(new AccountId({ shard: shardNum, realm: realmNum, num: accountNum }))
                .execute(this.hederaClient);
            return BigNumber.from(balance.hbars.toTinybars().toNumber());
        });
    }
    /**
     * Transaction record query implementation using the mirror node REST API.
     *
     * @param txId - id of the transaction to search for
     */
    getTransaction(txId) {
        return __awaiter(this, void 0, void 0, function* () {
            txId = yield txId;
            const [accountIdRaw, ,] = txId.split("-");
            const ep = '/api/v1/transactions?account.id=' + accountIdRaw;
            const url = resolveMirrorNetworkUrl(this.hederaNetwork);
            const { data } = yield axios.get(url + ep);
            const filtered = data.transactions
                .filter((e) => e.transaction_id === txId);
            return filtered.length > 0 ? filtered[0] : null;
        });
    }
}
//# sourceMappingURL=hedera-provider.js.map