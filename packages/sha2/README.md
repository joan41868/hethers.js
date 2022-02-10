SHA2 Hash Functions
===================

This sub-module is part of the [hethers project](https://github.com/hashgraph/hethers.js). It is a fork of the original [ethers project](https://github.com/ethers-io/ethers.js) sub-module.

It is responsible for common cryptographic hashes and HMAC.

For more information, see the [documentation](https://docs.ethers.io/v5/api/utils/hashing/).


Importing
---------

Most users will prefer to use the [umbrella package](https://www.npmjs.com/package/@hashgraph/hethers),
but for those with more specific needs, individual components can be imported.

```javascript
const {

    ripemd160,

    sha256,
    sha512,

    computeHmac,

    // Enums

    SupportedAlgorithm

} = require("@hethers/sha2");
```


License
-------

MIT License
