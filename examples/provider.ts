import { getAddressFromAccount } from "ethers/lib/utils";
import * as hethers  from "ethers";

(async () => {
    // TODO: replace with yours when testing.
    const accountNum = 98;

    const provider = hethers.providers.getDefaultProvider("hederaTestnet");
    const accountConfig = { shard: BigInt(0), realm: BigInt(0), num: BigInt(accountNum) };
    const solAddr = getAddressFromAccount(accountConfig);
    console.log(`Using account with num ${accountNum} <->`, solAddr);

    const balance = await provider.getBalance(getAddressFromAccount(accountConfig));
    console.log(balance);
    console.log(balance.toNumber());

    // ensure it works with solidity addresses as well
    const balance2 = await provider.getBalance(solAddr);
    console.log(balance2);
    console.log(balance2.toNumber());

    const txId = `0.0.15680048-1638189529-145876922`;
    const record = await provider.getTransaction(txId);
    console.log(record);
})();

