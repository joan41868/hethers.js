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
		account: "0.0.2",
		privateKey: "0x074cc0bd198d1bc91f668c59b46a1e74fd13215661e5a7bd42ad0d324476295d"
	}
	const wallet2 = new hethers.Wallet(hederaAcc);
	console.log(wallet2);

	/**
	 * Example 3: Instantiation of random Wallet
	 * TODO not creating new account at Hedera yet
	 */
	const newWallet = await hethers.Wallet.createRandom(wallet1);
	console.log(newWallet);

	/**
	 * Example 4: Instantiation of Wallet from mnemonic
	 */
	const mnemonic = "bullet network weekend dash ahead kick donkey require blame ability punch surprise";
	const mnemonicWallet1 = hethers.Wallet.fromMnemonic("0.0.4", mnemonic);
	console.log(mnemonicWallet1);
	const mnemonicWallet2 = hethers.Wallet.fromMnemonic({shard: BigInt(0), realm: BigInt(0), num: BigInt(4)}, mnemonic);
	console.log(mnemonicWallet2);
	const mnemonicWallet3 = hethers.Wallet.fromMnemonic("0x0000000000000000000000000000000000000004", mnemonic);
	console.log(mnemonicWallet3);

	/**
	 * Example 5: Instantiation of HDNode from seed
	 */
	const seedHDWallet = hethers.utils.HDNode.fromSeed("0.0.1", "0xdeadbeefdeadbeefdeadbeefdeadbeef");
	console.log(seedHDWallet);

	/**
	 * Example 6: Instantiation of HDNode from mnemonic
	 */
	const mnemonicHDWallet = hethers.utils.HDNode.fromMnemonic("0.0.1", mnemonic);
	console.log(mnemonicHDWallet);

	/**
	 * Example 7: Instantiation of HDNode from extended key
	 */
	const extendedKeyWallet = hethers.utils.HDNode.fromExtendedKey("0.0.1", seedHDWallet.neuter().extendedKey);
	console.log(extendedKeyWallet);

	/**
	 * Example 8: Derive path from HDNode
	 */
	const derivedWallet = seedHDWallet.derivePath("42");
	console.log(derivedWallet);

	/**
	 * Example 9: Encryption of Wallet
	 */
	const encryptedJson = await wallet1.encrypt("asd");
	console.log(`Encrypted JSON: ${encryptedJson}`);

	/**
	 * Example 10: Decrypt Wallet Async
	 */
	const decryptedWallet = await hethers.Wallet.fromEncryptedJson(encryptedJson, "asd");
	console.log(`Decrypted Wallet:`);
	console.log(decryptedWallet);

	/**
	 * Example 11: Decrypt Wallet Sync
	 */
	const decryptedWalletSync = hethers.Wallet.fromEncryptedJsonSync(encryptedJson, "asd");
	console.log(`Decrypted Wallet Sync:`);
	console.log(decryptedWalletSync);

})()
