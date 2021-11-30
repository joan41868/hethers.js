const hethers = require("ethers");

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

