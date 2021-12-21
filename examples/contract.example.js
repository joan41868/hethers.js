// main
const {
	AccountId,
	Client, ContractCreateTransaction,
	ContractExecuteTransaction, FileAppendTransaction,
	FileCreateTransaction,
	PrivateKey,
	Transaction,
	FileContentsQuery,
	TransactionId,
	Hbar, ContractFunctionParameters, ContractFunctionSelector
} = require("@hashgraph/sdk");
const {readFileSync} = require('fs');
const hethers = require("ethers");
const {getAddressFromAccount} = require("ethers/lib/utils");

const account = {
	"operator": {
		"accountId": "0.0.19041642",
		"publicKey": "302a300506032b6570032100049d07fb89aa8f5e54eccd7b92846d9839404e8c0af8489a9a511422be958b2f",
		"privateKey": "302e020100300506032b6570042204207ef3437273a5146e4e504a6e22c5caedf07cb0821f01bc05d18e8e716f77f66c"
	},
	"network": {
		"0.testnet.hedera.com:50211": "0.0.3",
		// "1.testnet.hedera.com:50211": "0.0.4",
		// "2.testnet.hedera.com:50211": "0.0.5",
		// "3.testnet.hedera.com:50211": "0.0.6"
	}
};

(async () => {
	/* create the operator */
	const privateKey = PrivateKey.fromString(account.operator.privateKey);
	const operatorId = AccountId.fromString(account.operator.accountId);
	const client = Client.forNetwork(account.network);
	client.setOperator(operatorId, privateKey);

	// TODO: deploy
	const contractByteCode = readFileSync('examples/assets/bytecode/GLDToken.bin', 'hex');
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

	console.log('Contents are equal:', contents.toString() === contractByteCode);

	// TODO: try from hethers
	const contractCreateTx = await new ContractCreateTransaction()
		.setTransactionId(TransactionId.generate(operatorId))
		.setBytecodeFileId(fileCreateResp.fileId)
		.setAdminKey(client.operatorPublicKey)
		.setGas(300000)
		.setInitialBalance(new Hbar(1))
		.execute(client);
	const contractCreateReceipt = await contractCreateTx.getReceipt(client);
	console.log(contractCreateReceipt.contractId);

	const hederaEoa = {
		account: account.operator.accountId,
		privateKey: "0x074cc0bd198d1bc91f668c59b46a1e74fd13215661e5a7bd42ad0d324476295d"
	};
	const wallet = new hethers.Wallet(hederaEoa, hethers.providers.getDefaultProvider('testnet'));


	// // TODO: arguments
	// const data = Buffer.from(`"abi":{},"values":{}`).toString('hex');
	// const tx = {
	//     to: getAddressFromAccount("0.0.12999"),
	//     from: wallet.address,
	//     data: '0x'+data,
	//     gasLimit: 100000
	//
	// };
	// const signed = await wallet.signTransaction(tx);
	// const fromBytes = Transaction.fromBytes(arrayify(signed));
	// const cc = fromBytes as ContractExecuteTransaction;
	// console.log(cc); // Real contract create;
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
