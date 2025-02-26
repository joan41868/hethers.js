Big Numbers
===========

This sub-module is part of the [hethers project](https://github.com/hashgraph/hethers.js). It is a fork of the original [ethers project](https://github.com/ethers-io/ethers.js) sub-module.

It is responsible for handling arbitrarily large numbers and mathematic operations.

For more information, see the documentation for [Big Numbers](https://docs.ethers.io/v5/api/utils/bignumber/)
and [Fixed-Point Numbers](https://docs.ethers.io/v5/api/utils/fixednumber/).


Importing
---------

Most users will prefer to use the [umbrella package](https://www.npmjs.com/package/@hashgraph/hethers),
but for those with more specific needs, individual components can be imported.

```javascript
const {

    BigNumber,

    FixedFormat,
    FixedNumber,

    formatFixed,

    parseFixed

    // Types

    BigNumberish

} = require("@hethers/bignumber");
```


License
-------

MIT License
