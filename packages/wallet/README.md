Ethereum Wallet
===============

This sub-module is part of the [hethers project](https://github.com/hashgraph/hethers.js). It is a fork of the original [ethers project](https://github.com/ethers-io/ethers.js) sub-module.

It contains the class to manage a private key and signing for a standard
externally-owned account.

For more information, see the [documentation](https://docs.ethers.io/v5/api/signer/#Wallet).


Importing
---------

Most users will prefer to use the [umbrella package](https://www.npmjs.com/package/ethers) TODO link once deployed,
but for those with more specific needs, individual components can be imported.

```javascript
const {

    Wallet,

    verifyMessage

} = require("@ethersproject/wallet");
```


License
-------

MIT License
