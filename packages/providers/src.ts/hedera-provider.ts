import {  HederaNetworkConfigLike } from "@ethersproject/networks";
import { BaseProvider } from "./base-provider";
import { AccountLike } from "@ethersproject/address";

export default class HederaProvider extends BaseProvider {
    constructor(accId: AccountLike, consensusNodeUrl: string, mirrorNodeUrl: string) {
        const props :HederaNetworkConfigLike = {
            network:{}
        };

        props.network[consensusNodeUrl] = accId.toString();
        super({
            network:(props as HederaNetworkConfigLike).network
        });
    }
}
