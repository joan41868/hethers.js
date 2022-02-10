Solidity Packed-Encoding Utilities
==================================

This sub-module is part of the [hethers project](https://github.com/hashgraph/hethers.js). It is a fork of the original [ethers project](https://github.com/ethers-io/ethers.js) sub-module.

It contains functions to perform Solidity-specific packed (i.e. non-standard)
encoding operations.

For more information, see the [documentation](https://docs.ethers.io/v5/api/utils/hashing/#utils--solidity-hashing). TODO Docs

Importing
---------

Most users will prefer to use the [umbrella package](https://www.npmjs.com/package/@hashgraph/hethers),
but for those with more specific needs, individual components can be imported.

```javascript
const {

    pack,
    keccak256,
    sha256

} = require("@hethers/solidity");
```


License
-------

MIT License
