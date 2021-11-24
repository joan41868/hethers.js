const hethers = require("ethers");


// 0.0.1 -> 0x0000000000000000000000000000000000000001
const account = {shard: 0, realm: 0, num: 1}
const address = hethers.utils.getAddressFromAccount({shard: 0, realm: 0, num: 1});
console.log(`Account: 0.0.1 converted to Address: ${address}`);
