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

/**
 * 0.0.10254 - previewnet contract - GLDToken
 */

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
	const provider = hethers.providers.getDefaultProvider('previewnet');
	// @ts-ignore
	const wallet = new hethers.Wallet(hederaEoa, provider);
	// @ts-ignore
	console.log('Wallet.account:', wallet.account.toString());

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
		operatorId.toSolidityAddress(),
		1000
	]);
	const approveResponse = await wallet.sendTransaction({
		to: contract.address,
		data: params,
		gasLimit: 100000
	});
	console.log(approveResponse);
})();
