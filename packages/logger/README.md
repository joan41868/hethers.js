Logger
======

This sub-module is part of the [hethers project](https://github.com/hashgraph/hethers.js). It is a fork of the original [ethers project](https://github.com/ethers-io/ethers.js) sub-module.

It is responsible for managing logging and errors to maintain a standard
structure.

For more information, see the [documentation](https://docs.ethers.io/v5/api/utils/logger/).

Importing
---------

Most users will prefer to use the [umbrella package](https://www.npmjs.com/package/ethers) TODO link once deployed,
but for those with more specific needs, individual components can be imported.

```javascript
const {

    Logger,

    // Enums

    ErrorCode,

    LogLevel,

} = require("@ethersproject/logger");
```


License
-------

MIT License.
