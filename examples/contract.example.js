// main
const {
	AccountId,
	Client, ContractCreateTransaction,
	ContractExecuteTransaction, FileAppendTransaction,
	FileCreateTransaction,
	PrivateKey,
	Transaction,
	FileContentsQuery,
	TransactionRecordQuery,
	TransactionId,
	Hbar, ContractFunctionParameters, ContractFunctionSelector
} = require("@hashgraph/sdk");
const {readFileSync} = require('fs');
const hethers = require("ethers");
const {getAddressFromAccount, arrayify, hexlify} = require("ethers/lib/utils");

const account = {
	"operator": {
		"accountId": "0.0.1280",
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

(async () => {
	/* create the operator */
	const privateKey = PrivateKey.fromString(account.operator.privateKey);
	const operatorId = AccountId.fromString(account.operator.accountId);
	const client = Client.forNetwork(account.network);
	client.setOperator(operatorId, privateKey);

	// TODO: deploy
	const contractByteCode = readFileSync('examples/assets/bytecode/GLDToken.bin').toString();
	console.log(`contractByteCode length: ${contractByteCode.length} `);

	let chunks = splitInChunks(contractByteCode, 4096);
	const chunksLen = chunks.map(c => c.length)
		.reduce((a, b) => a + b, 0);
	console.log('Chunks total size:', chunksLen);
	const fileCreateTx = await new FileCreateTransaction()
		.setKeys([client.operatorPublicKey])
		.setContents(chunks[0])
		.execute(client);

	const fileCreateResp = (await fileCreateTx.getReceipt(client));
	for (let chunk of chunks.slice(1)) {
		await new FileAppendTransaction()
			.setFileId(fileCreateResp.fileId)
			.setContents(chunk)
			.execute(client);
	}
	console.log('File ready.');
	const contents = await new FileContentsQuery()
		.setFileId(fileCreateResp.fileId)
		.execute(client);

	console.log('Contents are equal:', contents.toString() === contractByteCode.toString());

	// TODO: try from hethers
	const contractCreateTx = await new ContractCreateTransaction()
		.setBytecodeFileId(fileCreateResp.fileId)
		.setAdminKey(client.operatorPublicKey)
		.setGas(300000)
		.execute(client);
	const contractCreateReceipt = await contractCreateTx.getReceipt(client);

	const hederaEoa = {
		account: account.operator.accountId,
		privateKey: "0x074cc0bd198d1bc91f668c59b46a1e74fd13215661e5a7bd42ad0d324476295d"
	};
	const wallet = new hethers.Wallet(hederaEoa, hethers.providers.getDefaultProvider('testnet'));

	const approveAbi = require('./assets/abi/GLDToken_approve.abi.json');
	console.log('Using contract:', contractCreateReceipt.contractId.toString());
	console.log('Wallet account:', wallet.account.toString());

	const abi = require('./assets/abi/GLDToken_abi.json');
	const contract = hethers.ContractFactory.getContract(getAddressFromAccount(contractCreateReceipt.contractId.toString()), abi, wallet);
	console.log(contract);
	const params = contract.interface.encodeFunctionData('approve', [operatorId.toSolidityAddress(), 100]);
	console.log(params);
	const approveTx = {
		to: getAddressFromAccount(contractCreateReceipt.contractId.toString()),
		from: getAddressFromAccount(wallet.account),
		data: params,
		gasLimit: 100000,
	};
	const signedTx = await wallet.signTransaction(approveTx);
	const hederaTx = Transaction.fromBytes(arrayify(signedTx));
	const callResponse = await hederaTx.execute(client);
	const receipt = await callResponse.getReceipt(client);
	console.log(receipt);
})();


function splitInChunks(data /*: string*/, chunkSize/*: number*/) /*: string[] */ {
	const chunks = [];
	let num = 0;
	while (num <= data.length) {
		const slice = data.slice(num, chunkSize + num);
		num += chunkSize;
		chunks.push(slice);
	}
	return chunks;
}
