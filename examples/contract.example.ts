import * as hethers from "hethers";
import {arrayify, getAddressFromAccount} from "hethers/lib/utils";
import {AccountCreateTransaction, PrivateKey, Hbar, Client, Key as HederaKey, TransactionId} from "@hashgraph/sdk";
import {readFileSync} from "fs";
import {Key} from "@hashgraph/proto";

const account = {
    "operator_ED25519": {
        "account": "0.0.28542425",
        "publicKey": "302a300506032b6570032100a997b103c3e0c12d80179ee3b5f1c7ffe37e0a779fd5bc1bc14e6cc27321c6ee",
        "privateKey": "302e020100300506032b65700422042077d69b53642df4e59215da8f5f10c97f6a6214b6c8de46940d394da21d30e7cc"
    },
    "operator_ECDSA": {
        "account": '0.0.29562194',
        "privateKey": '0x3b6cd41ded6986add931390d5d3efa0bb2b311a8415cfe66716cac0234de035d'
    }
};

(async () => {
    /**
     * Get client and wallet
     */
    const client = Client.forName("testnet");
    let clientWallet = hethers.Wallet.createRandom();

    /**
     * Create the new account with the ECDSA key
     */
    const accountCreate = await (await new AccountCreateTransaction()
        .setKey(HederaKey._fromProtobufKey(Key.create({
            ECDSASecp256k1: arrayify(clientWallet._signingKey().compressedPublicKey)
        })))
        .setTransactionId(TransactionId.generate(account.operator_ED25519.account))
        .setInitialBalance(new Hbar(100))
        .setNodeAccountIds([client._network.getNodeAccountIdsForExecute()[0]])
        .freeze()
        .sign(PrivateKey.fromString(account.operator_ED25519.privateKey)))
        .execute(client);
    const receipt = await accountCreate.getReceipt(client);
    const createdAcc = receipt.accountId || "0.0.0";

    /**
     * Connect account
     */
    clientWallet = clientWallet
        .connect(hethers.providers.getDefaultProvider('testnet'))
        .connectAccount(createdAcc.toString());

    /**
     * Deploy a contract - OZ ERC20
     */
    const contractByteCodeGLDToken = readFileSync('examples/assets/bytecode/GLDToken.bin').toString();
    const deployTx = await clientWallet.sendTransaction({
        data: contractByteCodeGLDToken,
        gasLimit: 300000
    });
    const deploy = await deployTx.wait();
    console.log('contractCreate response:', deploy);

    /**
     * Instantiate the contract locally in order to interact with it
     */
    const abiGLDToken = JSON.parse(readFileSync('examples/assets/abi/GLDToken_abi.json').toString());
    const contractGLDToken = hethers.ContractFactory.getContract(deploy.contractAddress, abiGLDToken, clientWallet);

    /**
     * The following lines call:
     * - approve function for 1000 tokens
     * - mint function for 1000 tokens
     * - balanceOf function for the wallet's address
     */
    const approveParams = contractGLDToken.interface.encodeFunctionData('approve', [
        getAddressFromAccount(account.operator_ED25519.account),
        1000
    ]);
    const approveTx = await clientWallet.sendTransaction({
        to: contractGLDToken.address,
        data: approveParams,
        gasLimit: 100000
    });
    const approve = await approveTx.wait();
    console.log('approve: ', approve);

    const mintParams = contractGLDToken.interface.encodeFunctionData('mint', [
        1000
    ]);
    const mintTx = await clientWallet.sendTransaction({
        to: contractGLDToken.address,
        data: mintParams,
        gasLimit: 100000
    });
    const mint = await mintTx.wait();
    console.log('mint:', mint);

    const balanceOfParams = contractGLDToken.interface.encodeFunctionData('balanceOf', [
        await clientWallet.getAddress()
    ]);
    const balanceOfTx = {
        to: contractGLDToken.address,
        gasLimit: 30000,
        data: arrayify(balanceOfParams)
    };
    const balanceOfResponse = await clientWallet.call(balanceOfTx);
    console.log('balanceOf response: ', balanceOfResponse);
    console.log(hethers.BigNumber.from(balanceOfResponse).toNumber());

    /**
     * Contract deployment
     */
    const providerTestnet = hethers.providers.getDefaultProvider('testnet');
    // @ts-ignore
    const contractWallet = new hethers.Wallet(account.operator_ECDSA, providerTestnet);
    const abiGLDTokenWithConstructorArgs = JSON.parse(readFileSync('examples/assets/abi/GLDTokenWithConstructorArgs_abi.json').toString());
    const contractByteCodeGLDTokenWithConstructorArgs = readFileSync('examples/assets/bytecode/GLDTokenWithConstructorArgs.bin').toString();

    /**
     * Creating a contract from ABI and bytecode
     */
    const contractFactory = new hethers.ContractFactory(abiGLDTokenWithConstructorArgs, contractByteCodeGLDTokenWithConstructorArgs, contractWallet);

    /**
     * Using contractFactory.deploy()
     */
    const contract = await contractFactory.deploy(hethers.BigNumber.from("10000"), {gasLimit: 3000000});
    console.log(contract.address);

    /**
     * Calling a contract method
     */
    const viewMethodCall = await contract.getInternalCounter({gasLimit: 300000});
    console.log(viewMethodCall.toString());

    /**
     * Try out the populateTransaction method
     */
    const populatedTx = await contract.populateTransaction.transfer(contract.address, 1, {gasLimit: 300000});
    const signedTransaction = await contractWallet.signTransaction(populatedTx);
    const tx = await contractWallet.provider.sendTransaction(signedTransaction);
    console.log(tx.transactionId);

    /**
     * Calling a contract method
     */
    const transferMethodCall = await contract.transfer(contract.address, 1, {gasLimit: 300000});
    console.log(transferMethodCall.transactionId);
})();