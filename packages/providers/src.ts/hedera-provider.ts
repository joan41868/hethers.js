import {BaseProvider} from "./base-provider";
import {AccountBalanceQuery, AccountId, Client, NetworkName,} from '@hashgraph/sdk';
import {BigNumber} from "@ethersproject/bignumber";
import {BlockTag} from "@ethersproject/abstract-provider";
import {getAccountFromAddress} from "ethers/lib/utils";
import axios from 'axios';
import {Logger} from '@ethersproject/logger';
import {version} from "./_version";

const logger = new Logger(version);

// utilities which can later be moved to separate file

function sleep(timeout: number) {
    return new Promise(res => {
        setTimeout(res, timeout);
    })
}

function getNetwork(net: string) {
    switch (net) {
        case 'mainnet':
            return NetworkName.Mainnet;
        case 'previewnet':
            return NetworkName.Previewnet;
        case 'testnet':
            return NetworkName.Testnet;
        default:
            throw new Error("Invalid network name");
    }
}

/**
 * Currently, the URLs are hardcoded, as the hedera SDK does not expose them
 *
 * @param net - the network
 */
function resolveMirrorNetGetTransactionUrl(net: string) :string {
    switch (net) {
        case 'mainnet':
            return 'https://mainnet.mirrornode.hedera.com/';
        case 'previewnet':
            return 'https://previewnet.mirrornode.hedera.com/';
        case 'testnet':
            return 'https://testnet.mirrornode.hedera.com/';
        default:
            throw new Error("Invalid network name");
    }
}


export class HederaProvider extends BaseProvider {
    private readonly hederaClient: Client;
    private readonly hederaNetwork: string;

    constructor(network: string) {
        super('testnet');
        this.hederaNetwork = network;
        this.hederaClient = Client.forName(getNetwork(network))
    }

    /**
     *
     * @param addressOrName The address to check balance of
     * @param blockTag - not used
     */
    async getBalance(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<BigNumber> {
        addressOrName = await addressOrName;
        const {shard, realm, num} = getAccountFromAddress(addressOrName);
        const shardNum = BigNumber.from(shard).toNumber();
        const realmNum = BigNumber.from(realm).toNumber();
        const accountNum = BigNumber.from(num).toNumber();
        const balance = await new AccountBalanceQuery()
            .setAccountId(new AccountId({shard: shardNum, realm: realmNum, num: accountNum}))
            .execute(this.hederaClient);
        return BigNumber.from(balance.hbars.toTinybars().toNumber());
    }

    /**
     *
     * @param txId - id of the transaction to search for
     */
    async getTransaction(txId: string | Promise<string>): Promise<any> {
        txId = await txId;
        const ep = '/api/v1/transactions';
        const url = resolveMirrorNetGetTransactionUrl(this.hederaNetwork);
        const maxRetries = 10;
        let counter = 0;
        while (true) {
            if (counter >= maxRetries) {
                logger.info('Giving up after 10 retries.')
                return [];
            }
            const {data} = await axios.get(url + ep);
            const filtered = data.transactions.filter((e: { transaction_id: string | Promise<string>; }) => e.transaction_id === txId);
            if (filtered.length > 0) {
                return filtered[0];
            }
            await sleep(1000);
            counter++;
        }
    }

    public getClient(): Client {
        return this.hederaClient;
    }

}
