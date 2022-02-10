Base-X
======

This sub-module is part of the [hethers project](https://github.com/hashgraph/hethers.js). It is a fork of the original [ethers project](https://github.com/ethers-io/ethers.js) sub-module.

It is responsible for encoding and decoding vinary data in arbitrary bases, but
is primarily for Base58 encoding which is used for various blockchain data.

For more information, see the [documentation](https://docs.ethers.io/v5/api/utils/encoding/).

Importing
---------

Most users will prefer to use the [umbrella package](https://www.npmjs.com/package/@hashgraph/hethers),
but for those with more specific needs, individual components can be imported.

```javascript
const {

    BaseX,

    Base32,
    Base58

} = require("@ethersproject/basex");
```

License
-------

MIT License
