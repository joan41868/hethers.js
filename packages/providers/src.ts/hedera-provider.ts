import {BaseProvider} from "./base-provider";
import {AccountBalanceQuery, AccountId, Client, NetworkName} from '@hashgraph/sdk';
import {BigNumber} from "@ethersproject/bignumber";
import Long from "long";
import {BlockTag} from "@ethersproject/abstract-provider";

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

function fromSolidityAddress(address: string) {
    let addr = address.startsWith("0x")
        ? decode(address.slice(2))
        : decode(address);

    if (addr.length !== 20) {
        throw new Error(`Invalid hex encoded solidity address length:
                expected length 40, got length ${address.length}`);
    }
    const addr2: number[] = [];
    addr.map(e => addr2.push(e.valueOf()));
    const shard = Long.fromBytesBE([0, 0, 0, 0, ...addr2.slice(0, 4)]);
    const realm = Long.fromBytesBE(Array.from(addr.slice(4, 12)));
    const num = Long.fromBytesBE(Array.from(addr.slice(12, 20)));

    return [shard, realm, num];
}

function decode(text: string): Uint8Array {
    const str = text.startsWith("0x") ? text.substring(2) : text;
    return Buffer.from(str, "hex");
}
