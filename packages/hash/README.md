Etheruem Hash Utilities
=======================

This sub-module is part of the [hethers project](https://github.com/hashgraph/hethers.js). It is a fork of the original [ethers project](https://github.com/ethers-io/ethers.js) sub-module.

It contains several common hashing utilities (but not the actual hash functions).

For more information, see the [documentation](https://docs.ethers.io/v5/api/utils/hashing/). TODO link

Importing
---------

Most users will prefer to use the [umbrella package](https://www.npmjs.com/package/@hashgraph/hethers),
but for those with more specific needs, individual components can be imported.

```javascript
const {

    isValidName,
    namehash,

    id,

    messagePrefix,
    hashMessage

} = require("@hethers/hash");
```


License
-------

MIT License
