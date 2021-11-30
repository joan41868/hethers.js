const hethers = require("ethers");

(async () => {
    /**
     * Example 1: Instantiation of Wallet using EOA
     */
    const eoa = {
        address: "0x0000000000000000000000000000000000000001",
        privateKey: "0x074cc0bd198d1bc91f668c59b46a1e74fd13215661e5a7bd42ad0d324476295d"
    }
    const wallet1 = new hethers.Wallet(eoa);
    console.log(wallet1);

    /**
     * Example 2: Instantiation of Wallet using Hedera Account
     */
    const hederaAcc = {
        account: "0.0.1",
        privateKey: "0x074cc0bd198d1bc91f668c59b46a1e74fd13215661e5a7bd42ad0d324476295d"
    }
    const wallet2 = new hethers.Wallet(hederaAcc);
    console.log(wallet2);

    /**
     * Example 3: Encryption of Wallet
     */
    const encryptedJson = await wallet1.encrypt("asd");
    console.log(`Encrypted JSON: ${encryptedJson}`);

    /**
     * Example 4: Decrypt Wallet Async
     */
    const decryptedWallet = await hethers.Wallet.fromEncryptedJson(encryptedJson, "asd");
    console.log(`Decrypted Wallet:`);
    console.log(decryptedWallet);

    /**
     * Example 5: Decrypt Wallet Sync
     */
    const decryptedWalletSync = hethers.Wallet.fromEncryptedJsonSync(encryptedJson, "asd");
    console.log(`Decrypted Wallet Sync:`);
    console.log(decryptedWalletSync);
})()
