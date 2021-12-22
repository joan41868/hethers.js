import {
	AccountId, Client, PrivateKey, Transaction,
} from "@hashgraph/sdk";
import {readFileSync} from 'fs';
import * as hethers from "ethers";
import {getAddressFromAccount, arrayify}  from "ethers/lib/utils";

const account = {
	"operator": {
		"accountId": "0.0.1280",
		"publicKey": "302a300506032b65700321004aed2e9e0cb6cbcd12b58476a2c39875d27e2a856444173830cc1618d32ca2f0",
		"privateKey": "302e020100300506032b65700422042072874996deabc69bde7287a496295295b8129551903a79b895a9fd5ed025ece8"
	}, "network": {
		"35.231.208.148:50211": "0.0.3",
		"35.199.15.177:50211": "0.0.4",
		"35.225.201.195:50211": "0.0.5",
		"35.247.109.135:50211": "0.0.6"
	}
};

// main
(async () => {
	/* create the operator */
	const privateKey = PrivateKey.fromString(account.operator.privateKey);
	const operatorId = AccountId.fromString(account.operator.accountId);
	const client = Client.forNetwork(account.network);
	client.setOperator(operatorId, privateKey);
	const hederaEoa = {
		account: account.operator.accountId, //  mock key, real key is hardcoded
		privateKey: "0x074cc0bd198d1bc91f668c59b46a1e74fd13215661e5a7bd42ad0d324476295d"
	};
	// @ts-ignore
	const wallet = new hethers.Wallet(hederaEoa, hethers.providers.getDefaultProvider('previewnet'));
	// @ts-ignore
	console.log('Wallet.account:', wallet.account.toString());

	const contractByteCode = readFileSync('examples/assets/bytecode/GLDToken.bin').toString();
	let chunks = splitInChunks(contractByteCode, 4096);
	const fileCreate = {
		customData: {
			fileChunk: chunks[0], fileKey: client.operatorPublicKey
		}
	};
	const signedFileCreate = await wallet.signTransaction(fileCreate);
	const executableFileCreate = Transaction.fromBytes(arrayify(signedFileCreate));
	const fileCreateResp = await executableFileCreate.execute(client);

	const fileCreateReceipt = await fileCreateResp.getReceipt(client);
	for (let chunk of chunks.slice(1)) {
		const fileAppend = {
			customData: {
				// @ts-ignore
				fileId: fileCreateReceipt.fileId.toString(), fileChunk: chunk
			}
		};
		const signedFileAppend = await wallet.signTransaction(fileAppend);
		await Transaction.fromBytes(arrayify(signedFileAppend))
			.execute(client);
	}

	const contractCreate = {
		gasLimit: 300000, customData: {
			// @ts-ignore
			bytecodeFileId: fileCreateReceipt.fileId.toString()
		}
	}
	const signedContractCreate = await wallet.signTransaction(contractCreate);
	const contractCreateTx = await Transaction.fromBytes(arrayify(signedContractCreate))
		.execute(client);
	const contractCreateReceipt = await contractCreateTx.getReceipt(client);
	// @ts-ignore
	console.log('Contract:', contractCreateReceipt.contractId.toString());

	const abi = require('./assets/abi/GLDToken_abi.json');
	const contract = hethers.ContractFactory.getContract(
		// @ts-ignore
		getAddressFromAccount(contractCreateReceipt.contractId.toString()), abi, wallet);
	const params = contract.interface.encodeFunctionData('approve', [operatorId.toSolidityAddress(), 100]);
	const approveTx = {
		// @ts-ignore
		to: getAddressFromAccount(contractCreateReceipt.contractId.toString()),
		// @ts-ignore
		from: getAddressFromAccount(wallet.account),
		data: params,
		gasLimit: 100000,
	};
	const signedTx = await wallet.signTransaction(approveTx);
	const hederaTx = Transaction.fromBytes(arrayify(signedTx));
	const callResponse = await hederaTx.execute(client);
	console.log(`ContractCall response:`, callResponse);
	const receipt = await callResponse.getReceipt(client);
	console.log(`ContractCall receipt:`, receipt);
})();


function splitInChunks(data : string, chunkSize: number) : string[] {
	const chunks = [];
	let num = 0;
	while (num <= data.length) {
		const slice = data.slice(num, chunkSize + num);
		num += chunkSize;
		chunks.push(slice);
	}
	return chunks;
}
