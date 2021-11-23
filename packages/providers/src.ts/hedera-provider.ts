import {BaseProvider} from "./base-provider";
import {AccountBalanceQuery, AccountId, Client, NetworkName} from '@hashgraph/sdk';
import {BigNumber} from "@ethersproject/bignumber";
import {BlockTag} from "@ethersproject/abstract-provider";
import {fromSolidityAddress} from "ethers/lib/hedera-utils";

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

export class HederaProvider extends BaseProvider {
    private hederaClient: Client;

    constructor(network: string) {
        super(network);
        this.hederaClient = Client.forName(getNetwork(network));
    }

    /**
     *
     * @param addressOrName The address to check balance of
     * @param blockTag - not used
     */
    async getBalance(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<BigNumber> {
        addressOrName = await addressOrName;
        const [shard, realm, num] = fromSolidityAddress(addressOrName);
        const balance = await new AccountBalanceQuery()
            .setAccountId(new AccountId({shard, realm, num}))
            .execute(this.hederaClient);
        return BigNumber.from(balance.hbars.toTinybars().toNumber());
    }
}

