import {ethers} from 'ethers';
import {AccountId, ContractCreateTransaction, ContractFunctionParameters, TransactionId, PrivateKey} from '@hashgraph/sdk';

// main
(async () => {
    const operatorId = AccountId.fromString("0.0.1385");
    const privateKey = PrivateKey.fromString("302e020100300506032b6570042204209310582ff3b50e295ce3322ef98d92a4cc25bad5a857db7eb3481eaa3e77b249");
	const provider = ethers.providers.getDefaultProvider("previewnet");

    const tx = await new ContractCreateTransaction()
        .setContractMemo("ContractCreateTransaction memo")
        .setGas(300000)
        .setInitialBalance(1000)
        .setBytecodeFileId("0.0.29970")
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