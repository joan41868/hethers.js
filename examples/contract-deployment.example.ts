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
     * Example 1. Creating contract from ABI and bytecode
     */
    const contractFactory = new hethers.ContractFactory(abi, contractByteCode, wallet);

    /**
     * Example 2. Using contractFactory.deploy()
     */
    const contract = await contractFactory.deploy(BigNumber.from("10000"), {gasLimit: 3000000});
    console.log(contract.address);

    /**
     * Example 3. Calling a contract method
     */
    const methodCall = await contract.getInternalCounter({gasLimit: 300000});
    console.log(methodCall.toString());

    /**
     * Example 4. Try out the populateTransaction
     */
    const populatedTx = await contract.populateTransaction.transfer(contract.address, 1, {gasLimit: 300000});
    const signedTransaction = await wallet.signTransaction(populatedTx);
    const tx = await wallet.provider.sendTransaction(signedTransaction);
    console.log(tx.transactionId);
})();