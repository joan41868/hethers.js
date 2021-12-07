'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var assert_1 = __importDefault(require("assert"));
var ethers_1 = require("ethers");
var testcases_1 = require("@ethersproject/testcases");
describe('Private key generation', function () {
    var tests = (0, testcases_1.loadTests)('accounts');
    tests.forEach(function (test) {
        if (!test.privateKey) {
            return;
        }
        it(('correctly converts private key - ' + test.name), function () {
            var wallet = new ethers_1.ethers.Wallet({ address: test.address, privateKey: test.privateKey });
            assert_1.default.strictEqual(wallet.privateKey, test.privateKey, 'correctly computes privateKey - ' + test.privateKey);
            // assert.strictEqual(wallet.address, ethers.utils.getAddress(test.address),
            //     'correctly populates address - ' + test.address);      
            assert_1.default.strictEqual(wallet.address.toLowerCase(), test.address, 'correctly populates address - ' + test.address);
            var accountObjFromAddress = ethers_1.ethers.utils.getAccountFromAddress(test.address);
            assert_1.default.strictEqual(wallet.account.shard, accountObjFromAddress.shard, 'correctly populates account shard from address - ' + accountObjFromAddress.shard);
            assert_1.default.strictEqual(wallet.account.realm, accountObjFromAddress.realm, 'correctly populates account realm from address - ' + accountObjFromAddress.realm);
            assert_1.default.strictEqual(wallet.account.num, accountObjFromAddress.num, 'correctly populates account num from address - ' + accountObjFromAddress.num);
            if (test.publicKey) {
                assert_1.default.strictEqual(wallet.publicKey, test.publicKey, 'correctly computes publicKey - ' + test.publicKey);
            }
            if (test.account) {
                // assert.strictEqual(wallet.address, ethers.utils.getAddress(ethers.utils.getAddressFromAccount(test.account)),
                //     'correctly populates address from account - ' + test.account);
                assert_1.default.strictEqual(wallet.address.toLowerCase(), ethers_1.ethers.utils.getAddressFromAccount(test.account), 'correctly populates address from account - ' + test.account);
                var accountObjFromAccount = ethers_1.ethers.utils.parseAccount(test.account);
                assert_1.default.strictEqual(wallet.account.shard, accountObjFromAccount.shard, 'correctly populates account shard from account - ' + accountObjFromAccount.shard);
                assert_1.default.strictEqual(wallet.account.realm, accountObjFromAccount.realm, 'correctly populates account realm from account - ' + accountObjFromAccount.realm);
                assert_1.default.strictEqual(wallet.account.num, accountObjFromAccount.num, 'correctly populates account num from account - ' + accountObjFromAccount.num);
            }
        });
    });
});
describe('Checksum and ICAP address generation', function () {
    var tests = (0, testcases_1.loadTests)('accounts');
    tests.forEach(function (test) {
        it(('correctly transforms address - ' + test.name), function () {
            assert_1.default.strictEqual(ethers_1.ethers.utils.getAddress(test.address), test.checksumAddress, 'correctly computes checksum address from address');
            assert_1.default.strictEqual(ethers_1.ethers.utils.getIcapAddress(test.address), test.icapAddress, 'correctly computes ICAP address from address');
            assert_1.default.strictEqual(ethers_1.ethers.utils.getAddress(test.checksumAddress), test.checksumAddress, 'correctly computes checksum address from checksum address');
            assert_1.default.strictEqual(ethers_1.ethers.utils.getIcapAddress(test.checksumAddress), test.icapAddress, 'correctly computes ICAP address from checksum address');
            assert_1.default.strictEqual(ethers_1.ethers.utils.getAddress(test.icapAddress), test.checksumAddress, 'correctly computes checksum address from icap address');
            assert_1.default.strictEqual(ethers_1.ethers.utils.getIcapAddress(test.icapAddress), test.icapAddress, 'correctly computes ICAP address from icap address');
        });
    });
});
//# sourceMappingURL=test-account.js.map