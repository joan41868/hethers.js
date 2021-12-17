const hethers = require("ethers");

(async () => {
    const accountNum = 98;
    //
    const provider = hethers.providers.getDefaultProvider("testnet");
    const accountConfig = { shard: BigInt(0), realm: BigInt(0), num: BigInt(accountNum) };
    const solAddr = hethers.utils.getAddressFromAccount(accountConfig);
    console.log(`Using account with num ${accountNum} <->`, solAddr);

    let balance = await provider.getBalance(hethers.utils.getAddressFromAccount(accountConfig));
    console.log(balance);
    console.log(balance.toNumber());

    // ensure it works with solidity addresses as well
    balance = await provider.getBalance(solAddr);
    console.log(balance);
    console.log(balance.toNumber());

    const txId = `0.0.15680048-1638189529-145876922`;
    const record = await provider.getTransaction(txId);
    console.log(record);

    const genesis = {
        operator: {
            // genesis is the operator
            accountId: "0.0.2",
                privateKey: "302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137",
                publicKey: "302a300506032b65700321000aa8e21064c61eab86e2a9c164565b4e7a9a4146106e0a6cd03a8c395a110e92"
        },
        network: {
            "127.0.0.1:50211": "0.0.3",
                "127.0.0.1:50212": "0.0.4",
                "127.0.0.1:50213": "0.0.5"
        }
    };
    /* Connected to the local network as the GENESIS account*/
    const provider2 = new hethers.providers.HederaProvider(genesis.network["127.0.0.1:50211"], "127.0.0.1:50211", "");
    const balance2 = await provider2.getBalance(solAddr);
    console.log(balance2);
})();

