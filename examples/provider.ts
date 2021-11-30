import { DefaultHederaProvider } from "@ethersproject/providers";
import { getAddressFromAccount } from "ethers/lib/utils";
import { AccountId, TransferTransaction } from "@hashgraph/sdk";
import { HederaNetworks } from "@ethersproject/providers/lib/hedera-provider";

(async () => {
    // TODO: replace with yours when testing.
    const accountNum = 98;

    const provider = new DefaultHederaProvider(HederaNetworks.TESTNET);
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

    const txId = `0.0.15680048-1638195233-881537326`;
    const record = await provider.getTransaction(txId);
    console.log(record);
})();

