import * as hethers from "ethers";
import { arrayify, getAccountFromAddress, getAddressFromAccount } from "ethers/lib/utils";
import {
	AccountCreateTransaction,
	PrivateKey,
	Hbar,
	Client,
	Key as HederaKey, TransactionId, TransferTransaction, AccountId,
	ContractCallQuery
} from "@hashgraph/sdk";
import { readFileSync } from "fs";
import { Key, TransactionBody, SignedTransaction } from "@hashgraph/proto";
import * as Long from 'long';

const account = {
	"operator": {
		"accountId": "0.0.19041642",
		"publicKey": "302a300506032b6570032100049d07fb89aa8f5e54eccd7b92846d9839404e8c0af8489a9a511422be958b2f",
		"privateKey": "302e020100300506032b6570042204207ef3437273a5146e4e504a6e22c5caedf07cb0821f01bc05d18e8e716f77f66c"
	},
	"network": {
		"0.testnet.hedera.com:50211": "0.0.3",
		"1.testnet.hedera.com:50211": "0.0.4",
		"2.testnet.hedera.com:50211": "0.0.5",
		"3.testnet.hedera.com:50211": "0.0.6"
	}
};

// main
(async () => {
	/**
	 * Start the client
	 */
	const edPrivateKey = PrivateKey.fromString(account.operator.privateKey);
	const client = Client.forName("testnet");
	const nodeIds = client._network.getNodeAccountIdsForExecute();
	const generatedWallet = hethers.Wallet.createRandom();
	const provider = hethers.providers.getDefaultProvider('testnet');
	/**
	 * Create an ECDSA key protobuf from the generated wallet
	 */
	const protoKey = Key.create({
		ECDSASecp256k1: arrayify(generatedWallet._signingKey().compressedPublicKey)
	});
	/**
	 * Create the new account with the ECDSA key
	 */
	const newAccountKey = HederaKey._fromProtobufKey(protoKey);
	const accountCreate = await (await new AccountCreateTransaction()
		.setKey(newAccountKey)
		.setTransactionId(TransactionId.generate(account.operator.accountId))
		.setInitialBalance(new Hbar(10))
		.setNodeAccountIds([ nodeIds[0] ])
		.freeze()
		.sign(edPrivateKey))
		.execute(client);
	const receipt = await accountCreate.getReceipt(client);
	console.log('New account', receipt);

	/**
	 * Re-initialize the wallet in order to have the new accountId
	 */
		// @ts-ignore
	const newAccountId = receipt.accountId.toString();
	const hederaEoa = {
		account: newAccountId,
		privateKey: generatedWallet.privateKey
	};
	// @ts-ignore
	const wallet = new hethers.Wallet(hederaEoa, provider);

	/**
	 * Deploy a contract - OZ ERC20
	 */
	const contractByteCode = readFileSync('examples/assets/bytecode/GLDToken.bin').toString();
	const contractCreateResponse = await wallet.sendTransaction({
		data: contractByteCode,
		gasLimit: 300000,
		nodeId: nodeIds[0].toString()
	});
	console.log('contractCreate response:', contractCreateResponse);

	/**
	 * Instantiate the contract locally in order to interact with it
	 */
	const abi = JSON.parse(readFileSync('examples/assets/abi/GLDToken_abi.json').toString());
	// @ts-ignore
	const contract = hethers.ContractFactory.getContract(contractCreateResponse.customData.contractId, abi, wallet);

	/**
	 * The following lines call:
	 * - approve function for 1000 tokens
	 * - mint function for 1000 tokens
	 * - balanceOf function for the wallet's address
	 */
	const approveParams = contract.interface.encodeFunctionData('approve', [
		getAddressFromAccount(account.operator.accountId),
		1000
	]);
	const approveResponse = await wallet.sendTransaction({
		to: contract.address,
		data: approveParams,
		gasLimit: 100000
	});
	console.log('approve response: ', approveResponse);

	const mintParams = contract.interface.encodeFunctionData('mint', [
		1000
	]);
	const mintResponse = await wallet.sendTransaction({
		to: contract.address,
		data: mintParams,
		gasLimit: 100000
	});
	console.log('mint response:', mintResponse);

	const balanceOfParams = contract.interface.encodeFunctionData('balanceOf', [
		await wallet.getAddress()
	]);
	const nodeID = nodeIds[0];

	const balanceOfTx = {
		to: contract.address,
		gasLimit: 10000,
		data: arrayify(balanceOfParams),
		nodeId: nodeID.toString()
	};
	const balanceOfResponse = await wallet.call(balanceOfTx);
	console.log('balanceOf response: ', balanceOfResponse);
	// nothing meaningful for now
	console.log('balanceOf response: ', Buffer.from(balanceOfResponse, 'hex').toString('utf8'))
})();
