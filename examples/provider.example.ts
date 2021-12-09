import { getAddressFromAccount } from "ethers/lib/utils";
import * as hethers  from "ethers";
import { HederaNetworks } from "@ethersproject/providers/lib/default-hedera-provider";

(async () => {
    // TODO: replace with yours when testing.
    const accountNum = 98;

    const provider = hethers.providers.getDefaultProvider(HederaNetworks.TESTNET);
    const accountConfig = { shard: BigInt(0), realm: BigInt(0), num: BigInt(accountNum) };
    const solAddr = getAddressFromAccount(accountConfig);
    console.log(`Using account with num ${accountNum} <->`, solAddr);

    let balance = await provider.getBalance(getAddressFromAccount(accountConfig));
    console.log(balance);
    console.log(balance.toNumber());

    // ensure it works with solidity addresses as well
    balance = await provider.getBalance(solAddr);
    console.log(balance);
    console.log(balance.toNumber());

    const txId = `0.0.15680048-1638189529-145876922`;
    const record = await provider.getTransaction(txId);
    console.log(record);

    const contractNum = 16645669;
    const contractAccountConfig = { shard: BigInt(0), realm: BigInt(0), num: BigInt(contractNum) };
    const contractSolAddr = getAddressFromAccount(contractAccountConfig);
    console.log(`Get bytecode for contract with num ${contractNum} <->`, contractSolAddr);
    
    let contractBytecode = await provider.getCode(getAddressFromAccount(contractAccountConfig));
    console.log(contractBytecode);

    //not a contract 
    contractBytecode = await provider.getCode("0x0000000000000000000000000000000000000000");
    console.log(contractBytecode);


    const expiredContractNum = 15067;
    const expiredContractAccountConfig = { shard: BigInt(0), realm: BigInt(0), num: BigInt(expiredContractNum) };
    const expiredContractSolAddr = getAddressFromAccount(expiredContractAccountConfig);
    //contract with an empty bytecode
    contractBytecode = await provider.getCode(expiredContractSolAddr);
    console.log(contractBytecode);
})();

