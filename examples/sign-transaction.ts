// const hethers = require("ethers");
// const {PrivateKey} = require('@hashgraph/cryptography');
// const {AccountId, ContractExecuteTransaction, TransactionId} = require('@hashgraph/sdk');

import {ethers} from 'ethers';
// import {PrivateKey} from '@hashgraph/cryptography';
import {AccountId, ContractExecuteTransaction, TransactionId, PrivateKey, Client} from '@hashgraph/sdk';

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
	console.log(signedTx);

	const txResponse = await provider.sendTransaction(signedTx);
    console.log("sendTransaction response: ", txResponse);
    const minedResult = await txResponse.wait(7000); //block confirmations, not relevant
    console.log("result.wait(): ", minedResult);
	
	// const response = await tx.execute(Client.forTestnet());
	// console.log(response);
})();