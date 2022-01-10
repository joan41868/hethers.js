import * as hethers from "ethers";
import { arrayify, getAddressFromAccount } from "ethers/lib/utils";
import {
	AccountCreateTransaction,
	PrivateKey,
	Hbar,
	Client,
	Key as HederaKey, AccountId, TransactionId,
} from "@hashgraph/sdk";
import { readFileSync } from "fs";
import { Key } from "@hashgraph/proto";

const account = {
	"operator": {
		"accountId": "0.0.1356",
		"publicKey": "302a300506032b65700321004aed2e9e0cb6cbcd12b58476a2c39875d27e2a856444173830cc1618d32ca2f0",
		"privateKey": "302e020100300506032b65700422042072874996deabc69bde7287a496295295b8129551903a79b895a9fd5ed025ece8"
	},
	"network": {
		"35.231.208.148:50211": "0.0.3",
		"35.199.15.177:50211": "0.0.4",
		"35.225.201.195:50211": "0.0.5",
		"35.247.109.135:50211": "0.0.6"
	}
};
// feat/transaction-submission

// main
(async () => {
	const edPrivateKey = PrivateKey.fromString(account.operator.privateKey);
	const client = Client.forNetwork(account.network);
	const generatedWallet = hethers.Wallet.createRandom();
	const provider = hethers.providers.getDefaultProvider('previewnet');
	const key = PrivateKey.fromStringECDSA(generatedWallet._signingKey().privateKey); //HederaKey._fromProtobufKey(protoKey);
	const protoKey = Key.create({
		ECDSASecp256k1: arrayify(generatedWallet._signingKey().compressedPublicKey)
	});
	const newAccountKey = HederaKey._fromProtobufKey(protoKey);
	const accountCreate = await (await new AccountCreateTransaction()
		.setKey(newAccountKey)
		.setTransactionId(TransactionId.generate(account.operator.accountId))
		.setInitialBalance(new Hbar(20))
		.setNodeAccountIds([new AccountId(0,0,3)])
		.freeze()
		.sign(edPrivateKey))
		.execute(client);
	const receipt = await accountCreate.getReceipt(client);
	console.log('New account', receipt);
	// @ts-ignore
	const newAccountId = receipt.accountId.toString();
	const hederaEoa = {
		account: newAccountId,
		privateKey: generatedWallet.privateKey
	};
	// @ts-ignore
	const wallet = new hethers.Wallet(hederaEoa, provider);
	// const walletPrivateKey = PrivateKey.fromBytes(arrayify(wallet._signingKey().privateKey));

	const contractByteCode = readFileSync('examples/assets/bytecode/GLDToken.bin').toString();
	const contractCreateResponse = await wallet.sendTransaction({
		data: contractByteCode,
		gasLimit: 300000
	});
	console.log(contractCreateResponse);
	const abi = JSON.parse(readFileSync('examples/assets/abi/GLDToken_abi.json').toString());
	// @ts-ignore
	const contract = hethers.ContractFactory.getContract(contractCreateResponse.customData.contractId, abi, wallet);
	const params = contract.interface.encodeFunctionData('approve', [
		getAddressFromAccount(account.operator.accountId),
		1000
	]);
	const approveResponse = await wallet.sendTransaction({
		to: contract.address,
		data: params,
		gasLimit: 100000
	});
	console.log(approveResponse);
})();
