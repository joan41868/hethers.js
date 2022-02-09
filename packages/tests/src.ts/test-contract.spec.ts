'use strict';

import assert from "assert";

import { BigNumber, ethers } from "ethers";

import contractData from "./test-contract.json";
import fs, {readFileSync} from "fs";
// @ts-ignore
import * as abi from '../../../examples/assets/abi/GLDToken_abi.json';
// @ts-ignore
import * as abiWithArgs from '../../../examples/assets/abi/GLDTokenWithConstructorArgs_abi.json';
// @ts-ignore
abi = abi.default;
// @ts-ignore
abiWithArgs = abiWithArgs.default;
import { arrayify } from "ethers/lib/utils";

// const provider = new ethers.providers.InfuraProvider("rinkeby", "49a0efa3aaee4fd99797bfa94d8ce2f1");
const provider = ethers.getDefaultProvider("testnet");

const TIMEOUT_PERIOD = 120000;

const contract = (function() {
    return new ethers.Contract('', contractData.interface, provider);
})();

function equals(name: string, actual: any, expected: any): void {
    if (Array.isArray(expected)) {
        assert.equal(actual.length, expected.length, 'array length mismatch - '  + name);
        expected.forEach(function(expected, index) {
            equals(name + ':' + index, actual[index], expected);
        });
        return;
    }

    if (typeof(actual) === 'object') {
        if (expected.indexed) {
            assert.ok(ethers.Contract.isIndexed(actual), 'index property has index - ' + name);
            if (expected.hash) {
                assert.equal(actual.hash, expected.hash, 'index property with known hash matches - ' + name);
            }
            return;
        }

        if (actual.eq) {
            assert.ok(actual.eq(expected), 'numeric value matches - ' + name);
        }
    }

    assert.equal(actual, expected, 'value matches - ' + name);
}

// @ts-ignore
async function TestContractEvents() {
    const data = await ethers.utils.fetchJson('https://api.ethers.io/api/v1/?action=triggerTest&address=' + contract.address);

    console.log('*** Triggered Transaction Hash: ' + data.hash);

    contract.on("error", (error) => {
        console.log(error);
        assert(false);
        contract.removeAllListeners();
    });

    function waitForEvent(eventName: string, expected: Array<any>): Promise<void> {
        return new Promise(function(resolve, reject) {
            let done = false;
            contract.on(eventName, function() {
                if (done) { return; }
                done = true;

                let args = Array.prototype.slice.call(arguments);
                let event = args[args.length - 1];
                event.removeListener();
                equals(event.event, args.slice(0, args.length - 1), expected);
                resolve();
            });

            const timer = setTimeout(() => {
                if (done) { return; }
                done = true;

                contract.removeAllListeners();
                reject(new Error("timeout"));
            }, TIMEOUT_PERIOD);
            if (timer.unref) { timer.unref(); }
        });
    }

    return new Promise(function(resolve, reject) {
        let p0 = '0x06B5955A67D827CDF91823E3bB8F069e6c89c1D6';
        let p0_1 = '0x06b5955A67d827CdF91823e3Bb8F069e6C89C1d7';
        let p1 = 0x42;
        let p1_1 = 0x43;

        return Promise.all([
            waitForEvent('Test', [ p0, p1 ]),
            waitForEvent('TestP0', [ p0, p1 ]),
            waitForEvent('TestP0P1', [ p0, p1 ]),
            waitForEvent('TestIndexedString', [ { indexed: true, hash: '0x7c5ea36004851c764c44143b1dcb59679b11c9a68e5f41497f6cf3d480715331' }, p1 ]),
            waitForEvent('TestV2', [ { indexed: true }, [ p0, p1 ] ]),
            waitForEvent('TestV2Nested', [ { indexed: true }, [ p0_1, p1_1, [ p0, p1 ] ] ]),
        ]).then(function(result) {
            resolve(result);
        });
    });
}

// describe('Test Contract Objects', function() {
//
//     it('parses events', function() {
//         this.timeout(TIMEOUT_PERIOD);
//         return TestContractEvents();
//     });
//
//     it('ABIv2 parameters and return types work', function() {
//         this.timeout(TIMEOUT_PERIOD);
//         let p0 = '0x06B5955A67D827CDF91823E3bB8F069e6c89c1D6';
//         let p0_0f = '0x06B5955a67d827cDF91823e3bB8F069E6c89c1e5';
//         let p0_f0 = '0x06b5955a67D827CDF91823e3Bb8F069E6C89c2C6';
//         let p1 = 0x42;
//         let p1_0f = 0x42 + 0x0f;
//         let p1_f0 = 0x42 + 0xf0;
//
//         let expectedPosStruct: any = [ p0_f0, p1_f0, [ p0_0f, p1_0f ] ];
//
//         let seq = Promise.resolve();
//         [
//             [ p0, p1, [ p0, p1 ] ],
//             { p0: p0, p1: p1, child: [ p0, p1 ] },
//             [ p0, p1, { p0: p0, p1: p1 } ],
//             { p0: p0, p1: p1, child: { p0: p0, p1: p1 } }
//         ].forEach(function(struct) {
//             seq = seq.then(function() {
//                 return contract.testV2(struct).then((result: any) => {
//                     equals('position input', result, expectedPosStruct);
//                     equals('keyword input p0', result.p0, expectedPosStruct[0]);
//                     equals('keyword input p1', result.p1, expectedPosStruct[1]);
//                     equals('keyword input child.p0', result.child.p0, expectedPosStruct[2][0]);
//                     equals('keyword input child.p1', result.child.p1, expectedPosStruct[2][1]);
//                 });
//             });
//         });
//
//         return seq;
//     });
//
//     it('collapses single argument solidity methods', function() {
//         this.timeout(TIMEOUT_PERIOD);
//         return contract.testSingleResult(4).then((result: any) => {
//             assert.equal(result, 5, 'single value returned');
//         });
//     });
//
//     it('does not collapses multi argument solidity methods', function() {
//         this.timeout(TIMEOUT_PERIOD);
//         return contract.testMultiResult(6).then((result: any) => {
//             assert.equal(result[0], 7, 'multi value [0] returned');
//             assert.equal(result[1], 8, 'multi value [1] returned');
//             assert.equal(result.r0, 7, 'multi value [r0] returned');
//             assert.equal(result.r1, 8, 'multi value [r1] returned');
//         });
//     });
// });

// @TODO: Exapnd this
describe("Test Contract Transaction Population", function() {

    const testAddress = "0xdeadbeef00deadbeef01deadbeef02deadbeef03"
    const testAddressCheck = "0xDEAdbeeF00deAdbeEF01DeAdBEEF02DeADBEEF03";
    const fireflyAddress = "0x8ba1f109551bD432803012645Ac136ddd64DBA72";

    const contract = new ethers.Contract(null, abi);
    const contractConnected = contract.connect(ethers.getDefaultProvider("testnet"));

    xit("standard population", async function() {
        const tx = await contract.populateTransaction.balanceOf(testAddress);
        //console.log(tx);
        assert.equal(Object.keys(tx).length, 2, "correct number of keys");
        assert.equal(tx.data, "0x70a08231000000000000000000000000deadbeef00deadbeef01deadbeef02deadbeef03", "data matches");
        assert.equal(tx.to, testAddressCheck, "to address matches");
    });

    xit("allows 'from' overrides", async function() {
        const tx = await contract.populateTransaction.balanceOf(testAddress, {
            from: testAddress
        });
        //console.log(tx);

        assert.equal(Object.keys(tx).length, 3, "correct number of keys");
        assert.equal(tx.data, "0x70a08231000000000000000000000000deadbeef00deadbeef01deadbeef02deadbeef03", "data matches");
        assert.equal(tx.to, testAddressCheck, "to address matches");
        assert.equal((<any>tx).from, testAddressCheck, "from address matches");
    });

    xit("allows ENS 'from' overrides", async function() {
        this.timeout(20000);

        const tx = await contractConnected.populateTransaction.balanceOf(testAddress, {
            from: "ricmoo.firefly.eth"
        });
        //console.log(tx);

        assert.equal(Object.keys(tx).length, 3, "correct number of keys");
        assert.equal(tx.data, "0x70a08231000000000000000000000000deadbeef00deadbeef01deadbeef02deadbeef03", "data matches");
        assert.equal(tx.to, testAddressCheck, "to address matches");
        assert.equal((<any>tx).from, fireflyAddress, "from address matches");
    });

    xit("allows send overrides", async function() {
        const tx = await contract.populateTransaction.mint({
            gasLimit: 150000,
            value: 1234,
            from: testAddress
        });
        //console.log(tx);

        assert.equal(Object.keys(tx).length, 7, "correct number of keys");
        assert.equal(tx.data, "0x1249c58b", "data matches");
        assert.equal(tx.to, testAddressCheck, "to address matches");
        assert.equal(tx.gasLimit.toString(), "150000", "gasLimit matches");
        assert.equal(tx.value.toString(), "1234", "value matches");
        assert.equal(tx.from, testAddressCheck, "from address matches");
    });

    xit("allows zero 'value' to non-payable", async function() {
        const tx = await contract.populateTransaction.unstake({
            from: testAddress,
            value: 0
        });
        //console.log(tx);

        assert.equal(Object.keys(tx).length, 3, "correct number of keys");
        assert.equal(tx.data, "0x2def6620", "data matches");
        assert.equal(tx.to, testAddressCheck, "to address matches");
        assert.equal(tx.from, testAddressCheck, "from address matches");
    });

    // @TODO: Add test cases to check for fault cases
    // - cannot send non-zero value to non-payable
    // - using the wrong from for a Signer-connected contract
    xit("forbids non-zero 'value' to non-payable", async function() {
        try {
            const tx = await contract.populateTransaction.unstake({
                value: 1
            });
            console.log("Tx", tx);
            assert.ok(false, "throws on non-zero value to non-payable");
        } catch(error) {
            assert.ok(error.operation === "overrides.value");
        }
    });

    xit("allows overriding same 'from' with a Signer", async function() {
        const contractSigner = contract.connect(testAddress);
        const tx = await contractSigner.populateTransaction.unstake({
            from: testAddress
        });
        //console.log(tx);

        assert.equal(Object.keys(tx).length, 3, "correct number of keys");
        assert.equal(tx.data, "0x2def6620", "data matches");
        assert.equal(tx.to, testAddressCheck, "to address matches");
        assert.equal(tx.from, testAddressCheck, "from address matches");
    });

    xit("forbids overriding 'from' with a Signer", async function() {
        const contractSigner = contract.connect(testAddress);
        try {
            const tx = await contractSigner.populateTransaction.unstake({
                from: fireflyAddress
            });
            console.log("Tx", tx);
            assert.ok(false, "throws on non-zero value to non-payable");
        } catch(error) {
            assert.ok(error.operation === "overrides.from");
        }
    });

    xit("allows overriding with invalid, but nullish values", async function() {
        const contractSigner = contract.connect(testAddress);
        const tx = await contractSigner.populateTransaction.unstake({
            from: null
        });
        //console.log("Tx", tx);
        assert.equal(Object.keys(tx).length, 3, "correct number of keys");
        assert.equal(tx.data, "0x2def6620", "data matches");
        assert.equal(tx.to, testAddressCheck, "to address matches");
        assert.equal(tx.from, testAddressCheck.toLowerCase(), "from address matches");
    });

    it("should return an array of transactions on getDeployTransaction call", async function () {
        const hederaEoa = {
            account: '0.0.29562194',
            privateKey: '0x3b6cd41ded6986add931390d5d3efa0bb2b311a8415cfe66716cac0234de035d'
        };
        const provider = ethers.providers.getDefaultProvider('testnet');
        // @ts-ignore
        const wallet = new ethers.Wallet(hederaEoa, provider);

        const contractBytecode = fs.readFileSync('examples/assets/bytecode/GLDTokenWithConstructorArgs.bin').toString();
        const contractFactory = new ethers.ContractFactory(abiWithArgs, contractBytecode, wallet);
        const transaction = contractFactory.getDeployTransaction(ethers.BigNumber.from("1000000"), {
            gasLimit: 300000
        });
        assert('data' in transaction);
        assert('customData' in transaction);
        assert('gasLimit' in transaction);
        assert.strictEqual(300000, transaction.gasLimit);
    });

    it("should be able to deploy a contract", async function() {
        const hederaEoa = {
            account: '0.0.29562194',
            privateKey: '0x3b6cd41ded6986add931390d5d3efa0bb2b311a8415cfe66716cac0234de035d'
        };
        const provider = ethers.providers.getDefaultProvider('testnet');
        // @ts-ignore
        const wallet = new ethers.Wallet(hederaEoa, provider);
        const bytecode = fs.readFileSync('examples/assets/bytecode/GLDToken.bin').toString();
        const contractFactory = new ethers.ContractFactory(abi, bytecode, wallet);
        const contract = await contractFactory.deploy( { gasLimit: 300000 });
        assert.notStrictEqual(contract, null, "nullified contract");
        assert.notStrictEqual(contract.deployTransaction, "missing deploy transaction");
        assert.notStrictEqual(contract.address, null, 'missing address');
        const params = contract.interface.encodeFunctionData('balanceOf', [
            wallet.address
        ])
        const balance = await wallet.call({
            from: wallet.address,
            to: contract.address,
            data: arrayify(params),
            gasLimit: 300000
        });
        assert.strictEqual(BigNumber.from(balance).toNumber(), 10000, 'balance mismatch');
    }).timeout(60000);

    it("should be able to call contract methods", async function () {
        // configs
        const providerTestnet = ethers.providers.getDefaultProvider('testnet');
        const contractHederaEoa = {
            "account": '0.0.29562194',
            "privateKey": '0x3b6cd41ded6986add931390d5d3efa0bb2b311a8415cfe66716cac0234de035d'
        };

        // contract init
        // @ts-ignore
        const contractWallet = new ethers.Wallet(contractHederaEoa, providerTestnet);
        const abiGLDTokenWithConstructorArgs = JSON.parse(readFileSync('examples/assets/abi/GLDTokenWithConstructorArgs_abi.json').toString());
        const contractByteCodeGLDTokenWithConstructorArgs = readFileSync('examples/assets/bytecode/GLDTokenWithConstructorArgs.bin').toString();
        const contractFactory = new ethers.ContractFactory(abiGLDTokenWithConstructorArgs, contractByteCodeGLDTokenWithConstructorArgs, contractWallet);
        const contract = await contractFactory.deploy(ethers.BigNumber.from('10000'), {gasLimit: 3000000});

        // client wallet init
        let clientWallet = ethers.Wallet.createRandom();
        const clientAccountId = (await contractWallet.createAccount(clientWallet._signingKey().compressedPublicKey)).customData.accountId;
        clientWallet = clientWallet.connect(providerTestnet).connectAccount(clientAccountId.toString());

        // test sending hbars to the contract
        await contractWallet.sendTransaction({
            to: contract.address,
            from: contractWallet.address,
            value: 30,
            gasLimit: 300000
        });

        // test if initial balance of the client is zero
        assert.strictEqual((await contract.balanceOf(clientWallet.address, {gasLimit: 300000})).toString(), '0');

        // test calling a contract view method
        const viewMethodCall = await contract.getInternalCounter({gasLimit: 300000});
        assert.strictEqual(viewMethodCall.toString(), '29');

        // test sending hbars via populateTransaction.transfer
        const populatedTx = await contract.populateTransaction.transfer(clientWallet.address, 10, {gasLimit: 300000});
        const signedTransaction = await contractWallet.signTransaction(populatedTx);
        const tx = await contractWallet.provider.sendTransaction(signedTransaction);
        await tx.wait();
        assert.strictEqual((await contract.balanceOf(clientWallet.address, {gasLimit: 300000})).toString(), '10');

        // test sending hbars via contract.transfer
        const transferMethodCall = await contract.transfer(clientWallet.address, 10, {gasLimit: 300000});
        await transferMethodCall.wait();
        assert.strictEqual((await contract.balanceOf(clientWallet.address, {gasLimit: 300000})).toString(), '20');
    }).timeout(300000);

   it('should have a .wait function', async function() {
       const hederaEoa = {
           account: '0.0.29562194',
           privateKey: '0x3b6cd41ded6986add931390d5d3efa0bb2b311a8415cfe66716cac0234de035d'
       };
       const provider = ethers.providers.getDefaultProvider('testnet');
       // @ts-ignore
       const wallet = new ethers.Wallet(hederaEoa, provider);
       const bytecode = fs.readFileSync('examples/assets/bytecode/GLDToken.bin').toString();
       const contractFactory = new ethers.ContractFactory(abi, bytecode, wallet);
       const contract = await contractFactory.deploy( { gasLimit: 300000 });

       try {
           await contract.deployTransaction.wait(10);
           assert.notStrictEqual(true, false, "It should go in the catch block");
       }
       catch(err) {
           assert.notStrictEqual(err, null, "An error is thrown when the specified timeout is exceeded");
           assert.strictEqual(err.code, 'TIMEOUT');
       }

       const deployTx = contract.deployTransaction;
       const receipt = await deployTx.wait();

       assert.notStrictEqual(receipt, null, "wait returns a receipt");
       assert.strictEqual(receipt.transactionId, deployTx.transactionId, "receipt.transactionId is correct");
       assert.strictEqual(receipt.transactionHash, deployTx.hash, "receipt.transactionHash is correct");
       assert.notStrictEqual(receipt.logs, null, "receipt.logs exists");
       assert.strictEqual(receipt.logs.length, 2);

       // @ts-ignore
       const events = receipt.events;

       assert.notStrictEqual(events, null, "receipt.events exists");
       assert.strictEqual(events.length, 2);

       assert.strictEqual(events[0].event, 'Mint');
       assert.strictEqual(events[0].eventSignature, 'Mint(address,uint256)');
       assert.strictEqual(events[1].event, 'Transfer');
       assert.strictEqual(events[1].eventSignature, 'Transfer(address,address,uint256)');

       for (let i = 0; i < events.length; i++) {
           const log = receipt.logs[i];
           const event = events[i];

           assert.strictEqual(log.timestamp, receipt.timestamp, 'timestamp is correct');
           assert.strictEqual(log.address, receipt.contractAddress, 'address is correct');
           assert.notStrictEqual(log.data, null, 'data exists');
           assert.strictEqual(log.logIndex, i, 'logIndex is correct');
           assert.strictEqual(log.transactionHash, receipt.transactionHash, 'transactionHash is correct');

           assert.strictEqual(event.timestamp, receipt.timestamp, 'event.timestamp is correct');
           assert.strictEqual(event.address, receipt.contractAddress, 'event.address is correct');
           assert.notStrictEqual(event.data, 'event.data exists');
           assert.strictEqual(event.logIndex, i, 'event.logIndex is correct');
           assert.strictEqual(event.transactionHash, receipt.transactionHash, 'event.transactionHash is correct');

           assert.notStrictEqual(event.getTransaction, null, 'events have a method `getTransaction`');
           assert.notStrictEqual(event.getTransactionReceipt, null, 'events have a method `getTransactionReceipt`');

           const eventTx = await event.getTransaction();
           assert.notStrictEqual(eventTx, null, 'event.getTransaction() returns a result');
           assert.notStrictEqual(eventTx.chainId, null, 'eventTx.chainId is correct');
           assert.strictEqual(eventTx.hash, receipt.transactionHash, 'eventTx.hash is correct');
           assert.strictEqual(eventTx.timestamp, receipt.timestamp, 'eventTx.timestamp is correct');
           assert.strictEqual(eventTx.transactionId, receipt.transactionId, 'eventTx.transactionId is correct');
           assert.strictEqual(eventTx.from, receipt.from, 'eventTx.from is correct');
           assert.strictEqual(eventTx.to, receipt.contractAddress,'eventTx.contractAddress is correct');
           assert.strictEqual(eventTx.value.toString(), BigNumber.from(0).toString(), 'eventTx.value is correct');

           const eventRc = await event.getTransactionReceipt();
           assert.strictEqual(eventRc, receipt, "getTransactionReceipt returns the same receipt");

       }
   }).timeout(60000);
});

describe("contract.deployed", function() {
    const hederaEoa = {
        account: '0.0.29562194',
        privateKey: '0x3b6cd41ded6986add931390d5d3efa0bb2b311a8415cfe66716cac0234de035d'
    };
    const provider = ethers.providers.getDefaultProvider('testnet');
    // @ts-ignore
    const wallet = new ethers.Wallet(hederaEoa, provider);
    const bytecode = fs.readFileSync('examples/assets/bytecode/GLDToken.bin').toString();

    it("should work for already deployed contracts", async function() {
        const contract = ethers.ContractFactory.getContract('0000000000000000000000000000000001c3903b', abi, wallet);
        const contractDeployed = await contract.deployed();

        assert.notStrictEqual(contractDeployed, null, "deployed returns the contract");
        assert.strictEqual(contractDeployed.address, contract.address, "deployed returns the same contract instance");
    });


    it("should work if contract is just now deployed", async function() {
        const contractFactory = new ethers.ContractFactory(abi, bytecode, wallet);
        const contract = await contractFactory.deploy( { gasLimit: 300000 });

        assert.notStrictEqual(contract, null, "nullified contract");
        assert.notStrictEqual(contract.deployTransaction, "missing deploy transaction");
        assert.notStrictEqual(contract.address, null, 'missing address');

        const contractDeployed = await contract.deployed();

        assert.notStrictEqual(contractDeployed, null, "deployed returns the contract");
        assert.strictEqual(contractDeployed.address, contract.address, "deployed returns the same contract instance");

    }).timeout(60000);

});



/*
// Test Contract interaction inside Grid-deployed Geth
describe("Test Contract Life-Cycle", function() {
    this.timeout(10000);

    let blockNumber: number = null;

    before(async function() {
        const provider = ethers.getDefaultProvider();
        blockNumber = await provider.getBlockNumber();
        //console.log(blockNumber);
        this.skip();
    });

    it("says hi", function() {
        console.log("hi", blockNumber);
    });
});
*/
