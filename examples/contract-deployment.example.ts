import * as hethers from "ethers";
import {readFileSync} from "fs";
import {BigNumber} from "@ethersproject/bignumber";

// main
(async () => {
    const provider = hethers.providers.getDefaultProvider('testnet');

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

    // Won't work as this branch is not based on buildCall/buildSend branch

    const mintCall = await contract.mint(BigNumber.from("10000"), {gasLimit: 3000000});
    console.log('mintCallResponse', mintCall);

    contract.on('Mint', (data) => {
        console.log('mintEvent', data);
    });

})();