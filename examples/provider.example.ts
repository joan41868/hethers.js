const hethers = require("ethers");

(async () => {
    const accountNum = 98;
    //
    const provider = hethers.providers.getDefaultProvider("testnet");
    const accountConfig = { shard: BigInt(0), realm: BigInt(0), num: BigInt(accountNum) };
    const solAddr = hethers.utils.getAddressFromAccount(accountConfig);

    /**
     * Example 1: Getting Balance for account
     */
    let balance = await provider.getBalance(hethers.utils.getAddressFromAccount(accountConfig));
    console.log(`Balance of 98 account: ${balance}`);

    // ensure it works with solidity addresses as well
    balance = await provider.getBalance(solAddr);
    console.log(`Balance of 98 account: ${balance}`);

    /**
     * Example 2: Getting Transaction Record
     */
    const txId = `0.0.15680048-1638189529-145876922`;
    const record = await provider.getTransaction(txId);
    console.log(`Transaction Record:`);
    console.log(record);

    /**
     * Example 3: Connecting to custom consensus and mirror node URLs via HederaProvider
     */
    const consensusNodeUrl = '0.testnet.hedera.com:50211';
    const consensusNodeId = '0.0.3';
    const mirrorNodeUrl = 'https://testnet.mirrornode.hedera.com';
    const provider2 = new hethers.providers.HederaProvider(consensusNodeId, consensusNodeUrl, mirrorNodeUrl);

    const balance2 = await provider2.getBalance(solAddr);
    console.log(balance2);

    const record2 = await provider2.getTransaction(txId);
    console.log(record2);
})();

