import {ethers} from 'ethers';
import {AccountId, ContractExecuteTransaction, TransactionId, PrivateKey} from '@hashgraph/sdk';

(async () => {
    const operatorId = AccountId.fromString("0.0.1546615");
    const privateKey = PrivateKey.fromString("302e020100300506032b657004220420c7cb0caa71b05f62dafaf426052b317dad25aa66228d6faa3291712efd86c6b8");
	const provider = ethers.providers.getDefaultProvider("testnet");

    const tx = await new ContractExecuteTransaction()
		.setContractId("0.0.25623322")
		.setFunction("mint")
		.setGas(300000)
		.setTransactionMemo("ContractExecuteTransaction memo")
		.setTransactionId(TransactionId.generate(operatorId))
		.setNodeAccountIds([AccountId.fromString("0.0.3")])
		.freeze()
		.sign(privateKey)
	const txBytes = tx.toBytes();
	const signedTx = ethers.utils.hexlify(txBytes);
	const txResponse = await provider.sendTransaction(signedTx);
    console.log("sendTransaction submitted txResponse: ", txResponse);
    const minedResult = await txResponse.wait();
	console.log("txResponse.wait() mined receipt: ");
	console.dir(minedResult, {depth: null});
})();