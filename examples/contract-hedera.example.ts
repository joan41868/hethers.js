import * as hethers from "ethers";
import {arrayify, getAddressFromAccount} from "ethers/lib/utils";
import {
    AccountCreateTransaction,
    PrivateKey,
    Hbar,
    Client,
    Key as HederaKey, AccountId, TransactionId,
} from "@hashgraph/sdk";
import {readFileSync} from "fs";
import {Key} from "@hashgraph/proto";

const account = {
    "operator": {
        "accountId": "0.0.28542425",
        "publicKey": "302a300506032b6570032100a997b103c3e0c12d80179ee3b5f1c7ffe37e0a779fd5bc1bc14e6cc27321c6ee",
        "privateKey": "302e020100300506032b65700422042077d69b53642df4e59215da8f5f10c97f6a6214b6c8de46940d394da21d30e7cc"
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
    const edPrivateKey = PrivateKey.fromString(account.operator.privateKey);
    const client = Client.forNetwork(account.network);
    const generatedWallet = hethers.Wallet.createRandom();
    const provider = hethers.providers.getDefaultProvider('testnet');
    const protoKey = Key.create({
        ECDSASecp256k1: arrayify(generatedWallet._signingKey().compressedPublicKey)
    });
    const newAccountKey = HederaKey._fromProtobufKey(protoKey);
    const accountCreate = await (await new AccountCreateTransaction()
        .setKey(newAccountKey)
        .setTransactionId(TransactionId.generate(account.operator.accountId))
        .setInitialBalance(new Hbar(10))
        .setNodeAccountIds([new AccountId(0, 0, 3)])
        .freeze()
        .sign(edPrivateKey))
        .execute(client);
    const receipt = await accountCreate.getReceipt(client);
    // @ts-ignore
    const newAccountId = receipt.accountId.toString();
    const hederaEoa = {
        account: newAccountId,
        privateKey: generatedWallet.privateKey
    };
    // @ts-ignore
    const wallet = new hethers.Wallet(hederaEoa, provider);

    const abi = JSON.parse(readFileSync('examples/assets/abi/GLDToken_abi.json').toString());
    const contractByteCode = readFileSync('examples/assets/bytecode/GLDToken.bin').toString();

    const contractFactory = new hethers.ContractFactory(abi, contractByteCode, wallet);
    const cc = await contractFactory.deploy();
    console.log(cc);
    // const transactions = contractFactory.getDeployTransaction({
    //     gasLimit: 300000
    // });
    // const signedFileCreateTx = await wallet.signTransaction(transactions[0]);
    // const fileCreateTx = await wallet.provider.sendTransaction(signedFileCreateTx);
    // // @ts-ignore
    // const fileId = fileCreateTx.customData.fileId;
    //
    // for (let i = 1; i <= transactions.length - 2; i++) {
    //     // @ts-ignore
    //     transactions[i].customData.fileId = fileId;
    //
    //     const signedFileAppendTx = await wallet.signTransaction(transactions[i]);
    //     await wallet.provider.sendTransaction(signedFileAppendTx);
    // }
    //
    // // @ts-ignore
    // transactions[transactions.length - 1].customData.bytecodeFileId = fileId;
    //
    // const signedContractCreateTx = await wallet.signTransaction(transactions[transactions.length - 1]);
    // const contractCreateTx = await wallet.provider.sendTransaction(signedContractCreateTx);
    //
    // // @ts-ignore
    // const contractId = contractCreateTx.customData.contractId;
    // console.log(contractId);
})();