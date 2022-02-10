String Manipulation Utilities
=============================

This sub-module is part of the [hethers project](https://github.com/hashgraph/hethers.js). It is a fork of the original [ethers project](https://github.com/ethers-io/ethers.js) sub-module.

It contains functions to safely convert between UTF-8 data, strings and Bytes32 strings
(i.e. "short strings").

For more information, see the [documentation](https://docs.ethers.io/v5/api/utils/strings/).

Importing
---------

Most users will prefer to use the [umbrella package](https://www.npmjs.com/package/@hashgraph/hethers),
but for those with more specific needs, individual components can be imported.

```javascript
const {

    toUtf8Bytes,
    toUtf8CodePoints,
    toUtf8String,

    formatBytes32String,
    parseBytes32String,

    nameprep

    // Enums

    Utf8ErrorFuncs,
    Utf8ErrorReason,

    UnicodeNormalizationForm

    // Types

    Utf8ErrorFunc,

} = require("@hethers/strings");
```


License
-------

MIT License
