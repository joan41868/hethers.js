const hethers = require("ethers");

(async () => {
    const accountNum = 98;
    //
    const provider = hethers.providers.getDefaultProvider("testnet");
    const accountConfig = { shard: BigInt(0), realm: BigInt(0), num: BigInt(accountNum) };
    const solAddr = hethers.utils.getAddressFromAccount(accountConfig);
    console.log(`Using account with num ${accountNum} <->`, solAddr);

    /**
     * Example 1: Getting Balance for account
     */
    let balance = await provider.getBalance(hethers.utils.getAddressFromAccount(accountConfig));
    console.log(balance);
    console.log(balance.toNumber());

    // ensure it works with solidity addresses as well
    balance = await provider.getBalance(solAddr);
    console.log(balance);
    console.log(balance.toNumber());

    /**
     * Example 2: Getting Transaction Record
     */
    const txId = `0.0.15680048-1638189529-145876922`;
    const record = await provider.getTransaction(txId);
    console.log(record);

    const testnetOperator = {
        "operator": {
            "accountId": "0.0.19041642",
            "publicKey": "302a300506032b6570032100049d07fb89aa8f5e54eccd7b92846d9839404e8c0af8489a9a511422be958b2f",
            "privateKey": "302e020100300506032b6570042204207ef3437273a5146e4e504a6e22c5caedf07cb0821f01bc05d18e8e716f77f66c"
        },
        "network": {
            "0.testnet.hedera.com:50211": "0.0.3",
            "1.testnet.hedera.com:50211": "0.0.4",
            "2.testnet.hedera.com:50211": "0.0.5",
            "3.testnet.hedera.com:50211": "0.0.6"
        }
    };
    const provider2 = new hethers.providers.HederaProvider(
        testnetOperator.network["0.testnet.hedera.com:50211"],
        "0.testnet.hedera.com:50211",
        "https://testnet.mirrornode.hedera.com");

    const balance2 = await provider2.getBalance(solAddr);
    console.log(balance2);

    const txId2 = '0.0.15680048-1638189529-145876922';
    const record2 = await provider2.getTransaction(txId2);
    console.log(record2);
})();

