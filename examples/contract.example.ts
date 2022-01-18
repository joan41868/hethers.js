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
		"accountId": "0.0.1391",
		"publicKey": "302a300506032b6570032100659152a5ced818eb7cbfe0e778f5b967c892963c0be798039857b8f5ace324dd",
		"privateKey": "302e020100300506032b6570042204209310582ff3b50e295ce3322ef98d92a4cc25bad5a857db7eb3481eaa3e77b249"
	},
	"network": {
		"35.231.208.148:50211": "0.0.3",
		"35.199.15.177:50211": "0.0.4",
		"35.225.201.195:50211": "0.0.5",
		"35.247.109.135:50211": "0.0.6"
	}
};

// main
(async () => {
	const edPrivateKey = PrivateKey.fromString(account.operator.privateKey);
	const client = Client.forNetwork(account.network);
	const generatedWallet = hethers.Wallet.createRandom();
	const provider = hethers.providers.getDefaultProvider('previewnet');
	const protoKey = Key.create({
		ECDSASecp256k1: arrayify(generatedWallet._signingKey().compressedPublicKey)
	});
	const newAccountKey = HederaKey._fromProtobufKey(protoKey);
	const accountCreate = await (await new AccountCreateTransaction()
		.setKey(newAccountKey)
		.setTransactionId(TransactionId.generate(account.operator.accountId))
		.setInitialBalance(new Hbar(10))
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

	const contractByteCode = readFileSync('examples/assets/bytecode/GLDToken.bin').toString();
	const contractCreateResponse = await wallet.sendTransaction({
		data: contractByteCode,
		gasLimit: 300000
	});
	console.log("contractCreateResponse", contractCreateResponse);
	const contractCreateReceipt = await contractCreateResponse.wait();
	console.log("contractCreateResponse.wait() mined receipt: ");
    console.dir(contractCreateReceipt, {depth: null});

	const abi = JSON.parse(readFileSync('examples/assets/abi/GLDToken_abi.json').toString());
	// @ts-ignore
	const contract = hethers.ContractFactory.getContract(contractCreateResponse.customData.contractId, abi, wallet);
	const approveParams = contract.interface.encodeFunctionData('approve', [
		getAddressFromAccount(account.operator.accountId),
		1000
	]);
	const approveResponse = await wallet.sendTransaction({
		to: contract.address,
		data: approveParams,
		gasLimit: 100000
	});
	console.log("approveResponse", approveResponse);
	const approveReceipt = await approveResponse.wait();
	console.log("approveResponse.wait() mined receipt: ");
    console.dir(approveReceipt, {depth: null});

	const mintParams = contract.interface.encodeFunctionData('mint', [ 1000000000 ]);
	const mintResponse = await wallet.sendTransaction({
		to: contract.address,
		data: mintParams,
		gasLimit: 100000
	});
	console.log("mintResponse", mintResponse);
	const mintReceipt = await mintResponse.wait();
	console.log("mintResponse.wait() mined receipt: ");
    console.dir(mintReceipt, {depth: null});
})();
