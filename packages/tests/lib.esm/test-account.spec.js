'use strict';
import assert from 'assert';
import { ethers } from "ethers";
import { loadTests } from "@ethersproject/testcases";
describe('Private key generation & Alias population', function () {
    let tests = loadTests('accounts');
    tests.forEach((test) => {
        if (!test.privateKey) {
            return;
        }
        it(('correctly converts private key - ' + test.name), function () {
            let wallet = new ethers.Wallet(test.privateKey);
            assert.strictEqual(wallet.alias, test.alias, 'correctly computes privateKey - ' + test.privateKey);
        });
    });
});
describe('Account & Address population', () => {
    let tests = loadTests('accounts');
    tests.forEach(test => {
        if (!(test.address && test.account && test.privateKey)) {
            return;
        }
        it(('correctly populates account/address - ' + test.name), () => {
            let wallet = new ethers.Wallet({ privateKey: test.privateKey, address: test.address });
            assert.strictEqual(wallet.address.toLowerCase(), test.address.toLowerCase(), `correctly populates address - ` + test.address);
            assert.deepStrictEqual(wallet.account, ethers.utils.parseAccount(test.account), `correctly populates account - ` + test.account);
        });
    });
});
describe('Checksum and ICAP address generation', function () {
    let tests = loadTests('accounts');
    tests.forEach((test) => {
        it(('correctly transforms address - ' + test.name), function () {
            assert.strictEqual(ethers.utils.getAddress(test.address), test.checksumAddress, 'correctly computes checksum address from address');
            assert.strictEqual(ethers.utils.getIcapAddress(test.address), test.icapAddress, 'correctly computes ICAP address from address');
            assert.strictEqual(ethers.utils.getAddress(test.checksumAddress), test.checksumAddress, 'correctly computes checksum address from checksum address');
            assert.strictEqual(ethers.utils.getIcapAddress(test.checksumAddress), test.icapAddress, 'correctly computes ICAP address from checksum address');
            assert.strictEqual(ethers.utils.getAddress(test.icapAddress), test.checksumAddress, 'correctly computes checksum address from icap address');
            assert.strictEqual(ethers.utils.getIcapAddress(test.icapAddress), test.icapAddress, 'correctly computes ICAP address from icap address');
        });
    });
});
//# sourceMappingURL=test-account.spec.js.map