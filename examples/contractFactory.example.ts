import * as hethers from "ethers";
import {readFileSync} from "fs";
import {BigNumber} from "@ethersproject/bignumber";

// main
(async () => {
    const provider = hethers.providers.getDefaultProvider('testnet');

    // This account has around 1.7k HBars.
    const hederaEoa = {
        account: '0.0.29562194',
        privateKey: '0x3b6cd41ded6986add931390d5d3efa0bb2b311a8415cfe66716cac0234de035d'
    };
    // @ts-ignore
    const wallet = new hethers.Wallet(hederaEoa, provider);

    const abi = JSON.parse(readFileSync('examples/assets/abi/GLDTokenWithConstructorArgs_abi.json').toString());
    const contractByteCode = readFileSync('examples/assets/bytecode/GLDTokenWithConstructorArgs.bin').toString();

    /**
     * Example 1. Getting the deployment transactions, signing & executing each one of them
     */
    const contractFactory = new hethers.ContractFactory(abi, contractByteCode, wallet);
    const transactions = contractFactory.getDeployTransactions(BigNumber.from("10000"));
    const signedFileCreateTx = await wallet.signTransaction(transactions[0]);
    const fileCreateTx = await wallet.provider.sendTransaction(signedFileCreateTx);
    // @ts-ignore
    const fileId = fileCreateTx.customData.fileId;

    for (let i = 1; i <= transactions.length - 2; i++) {
        // @ts-ignore
        transactions[i].customData.fileId = fileId;

        const signedFileAppendTx = await wallet.signTransaction(transactions[i]);
        await wallet.provider.sendTransaction(signedFileAppendTx);
    }

    // @ts-ignore
    transactions[transactions.length - 1].customData.bytecodeFileId = fileId;

    const signedContractCreateTx = await wallet.signTransaction(transactions[transactions.length - 1]);
    const contractCreateTx = await wallet.provider.sendTransaction(signedContractCreateTx);
    // @ts-ignore
    const contractId = contractCreateTx.customData.contractId;
    console.log(contractId);

    /**
     * Example 2. Using contractFactory.deploy()
     */
    const contract = await contractFactory.deploy(BigNumber.from("10000"));
    // @ts-ignore
    console.log(contract.deployTransaction.customData.contractId);
})();