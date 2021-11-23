import {HederaProvider} from "@ethersproject/providers";
import {toSolidityAddress} from "ethers/lib/hedera-utils";

(async ()=>{
    const provider = new HederaProvider("testnet");
    const solAddr = toSolidityAddress([0, 0, 98]);
    console.log('Using account 0.0.98 <->', solAddr);

    const balance = await provider.getBalance(toSolidityAddress([0, 0, 98]));
    console.log(balance);
    console.log(balance.toNumber());

    const balance2 = await provider.getBalance(solAddr);
    console.log(balance2);
    console.log(balance2.toNumber());
})();
