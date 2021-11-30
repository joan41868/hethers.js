import { DefaultHederaProvider } from "@ethersproject/providers";
import { getAddressFromAccount } from "ethers/lib/utils";
import { AccountId, TransferTransaction } from "@hashgraph/sdk";
import { HederaNetworks } from "@ethersproject/providers/lib/hedera-provider";

(async () => {
    // TODO: replace with yours when testing.
    const accountNum = 0;
    const pkey = '';

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

    // set operator in order to execute the following transfer
    provider.getClient().setOperator(new AccountId({
        shard: 0,
        realm: 0,
        num: accountNum
    }), pkey);

    const tx = new TransferTransaction()
        .addHbarTransfer(`0.0.${accountConfig.num}`, -0.25) // sending 0.25 Hbars to the 98 acc
        .addHbarTransfer("0.0.98", 0.25);
    const txId = await tx.execute(provider.getClient());

    // get the record of the transfer txn
    // @ts-ignore -> tsc suggests that the long object chain may lead to null object
    const validStart = txId.transactionId.validStart.toString().split(".").join('-'); // necessary as of different ID formats
    const txIdStr = `${txId.transactionId.accountId}-${validStart}`;
    const record = await provider.getTransaction(txIdStr);
    console.log(record);
})();

