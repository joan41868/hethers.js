import {ethers} from 'ethers';
import {AccountId, ContractCreateTransaction, ContractFunctionParameters, TransactionId, PrivateKey} from '@hashgraph/sdk';

// main
(async () => {
    const operatorId = AccountId.fromString("0.0.1546615");
    const privateKey = PrivateKey.fromString("302e020100300506032b657004220420c7cb0caa71b05f62dafaf426052b317dad25aa66228d6faa3291712efd86c6b8");
	const provider = ethers.providers.getDefaultProvider("testnet");

    const tx = await new ContractCreateTransaction()
        .setContractMemo("ContractCreateTransaction memo")
        .setGas(300000)
        .setInitialBalance(1000)
        .setBytecodeFileId("0.0.26568171")
        .setNodeAccountIds([new AccountId(0,0,3)])
        // .setConstructorParameters(new ContractFunctionParameters().addUint256(100))
        .setTransactionId(TransactionId.generate(operatorId))
        .freeze()
        .sign(privateKey);
    const txBytes = tx.toBytes();
    const signedTx = ethers.utils.hexlify(txBytes);
    const txResponse = await provider.sendTransaction(signedTx);
    console.log("sendTransaction submitted txResponse: ", txResponse);
    const minedResult = await txResponse.wait();
	console.log("txResponse.wait() mined receipt: ");
    console.dir(minedResult, {depth: null});
})();