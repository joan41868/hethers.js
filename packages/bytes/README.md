Byte Manipulation
=================

This sub-module is part of the [hethers project](https://github.com/hashgraph/hethers.js). It is a fork of the original [ethers project](https://github.com/ethers-io/ethers.js) sub-module.

It is responsible for manipulating binary data.

For more information, see the [documentation](https://docs.ethers.io/v5/api/utils/bytes/).


Importing
---------

Most users will prefer to use the [umbrella package](https://www.npmjs.com/package/ethers) TODO link once deployed,
but for those with more specific needs, individual components can be imported.

```javascript
const {

    isBytesLike,
    isBytes,

    arrayify,

    concat,

    stripZeros,
    zeroPad,

    isHexString,
    hexlify,

    hexDataLength,
    hexDataSlice,
    hexConcat,

    hexValue,

    hexStripZeros,
    hexZeroPad,

    splitSignature,
    joinSignature,

    // Types

    Bytes,
    BytesLike,

    DataOptions,

    Hexable,

    SignatureLike,
    Signature

} = require("@ethersproject/bytes");
```


License
-------

MIT License
