'use strict';

import assert from 'assert';

import { ethers } from "ethers";
import { loadTests } from "@ethersproject/testcases";

type TestCase = {
    name: string;
    address: string;
    account?: string;
    checksumAddress: string;
    icapAddress: string;
    publicKey?: string;
    privateKey?: string;
};

describe('Private key generation', function() {
    let tests: Array<TestCase> = loadTests('accounts');
    tests.forEach((test) => {
        if (!test.privateKey) { return; }
        it(('correctly converts private key - ' + test.name), function() {
            let wallet = new ethers.Wallet({address: test.address, privateKey: test.privateKey});
            assert.strictEqual(wallet.privateKey, test.privateKey,
                'correctly computes privateKey - ' + test.privateKey);
            assert.strictEqual(wallet.address.toLowerCase(), test.address,
                'correctly populates address - ' + test.address);

            let accountObjFromAddress = ethers.utils.getAccountFromAddress(test.address);
            assert.strictEqual(wallet.account.shard, accountObjFromAddress.shard,
                'correctly populates account shard from address - ' + accountObjFromAddress.shard);
            assert.strictEqual(wallet.account.realm, accountObjFromAddress.realm,
                'correctly populates account realm from address - ' + accountObjFromAddress.realm);
            assert.strictEqual(wallet.account.num, accountObjFromAddress.num,
                'correctly populates account num from address - ' + accountObjFromAddress.num);

            if (test.publicKey) {
                assert.strictEqual(wallet.publicKey, test.publicKey,
                    'correctly computes publicKey - ' + test.publicKey);
            } 
            if (test.account) {
                assert.strictEqual(wallet.address.toLowerCase(), ethers.utils.getAddressFromAccount(test.account),
                    'correctly populates address from account - ' + test.account);
                
                let accountObjFromAccount = ethers.utils.parseAccount(test.account);
                assert.strictEqual(wallet.account.shard, accountObjFromAccount.shard,
                    'correctly populates account shard from account - ' + accountObjFromAccount.shard);
                assert.strictEqual(wallet.account.realm, accountObjFromAccount.realm,
                    'correctly populates account realm from account - ' + accountObjFromAccount.realm);
                assert.strictEqual(wallet.account.num, accountObjFromAccount.num,
                    'correctly populates account num from account - ' + accountObjFromAccount.num);
            } 
        });
    });
});

describe('Checksum and ICAP address generation', function() {
    let tests: Array<TestCase> = loadTests('accounts');
    tests.forEach((test) => {
        it(('correctly transforms address - ' + test.name), function() {
            assert.strictEqual(ethers.utils.getAddress(test.address), test.checksumAddress,
                'correctly computes checksum address from address');
            assert.strictEqual(ethers.utils.getIcapAddress(test.address), test.icapAddress,
                'correctly computes ICAP address from address');
            assert.strictEqual(ethers.utils.getAddress(test.checksumAddress), test.checksumAddress,
                'correctly computes checksum address from checksum address');
            assert.strictEqual(ethers.utils.getIcapAddress(test.checksumAddress), test.icapAddress,
                'correctly computes ICAP address from checksum address');
            assert.strictEqual(ethers.utils.getAddress(test.icapAddress), test.checksumAddress,
                'correctly computes checksum address from icap address');
            assert.strictEqual(ethers.utils.getIcapAddress(test.icapAddress), test.icapAddress,
                'correctly computes ICAP address from icap address');
        });
    });
});
