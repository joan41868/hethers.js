import {BaseProvider} from "./base-provider";
// @ts-ignore
import {Client, NetworkName} from '@hashgraph/sdk';

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
    private hederaClient : Client;

    constructor(network: string) {
        super(network);
        this.hederaClient = Client.forName(getNetwork(network));
    }

    logClient() {
        console.log(this.hederaClient);
    }
}
