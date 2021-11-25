import {HederaProvider} from "@ethersproject/providers";
import {getAddressFromAccount} from "ethers/lib/utils";

(async () => {
    const provider = new HederaProvider("testnet");
    const accountConfig = {shard: BigInt(0), realm: BigInt(0), num: BigInt(1)};
    const solAddr = getAddressFromAccount(accountConfig);
    console.log('Using account 0.0.98 <->', solAddr);

    const balance = await provider.getBalance(getAddressFromAccount(accountConfig));
    console.log(balance);
    console.log(balance.toNumber());

    const balance2 = await provider.getBalance(solAddr);
    console.log(balance2);
    console.log(balance2.toNumber());
})();
