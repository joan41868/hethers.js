Ethereum ABI Coder
==================

This sub-module is part of the [hethers project](https://github.com/hashgraph/hethers.js). It is a clean fork 
version of 
the [abi](https://github.com/ethers-io/ethers.js/tree/master/packages/abi) sub-module from the [ethers project](https://github.com/ethers-io/ethers.js)

It is responsible for encoding and decoding the Application Binary Interface (ABI)
used by most smart contracts to interoperate between other smart contracts and clients.

For more information, see the [documentation](https://docs.ethers.io/v5/api/utils/abi/). TODO add link to docs

Importing
---------

Most users will prefer to use the [umbrella package](https://www.npmjs.com/package/@hashgraph/hethers),
but for those with more specific needs, individual components can be imported.

```javascript
const {

    ConstructorFragment,
    EventFragment,
    Fragment,
    FunctionFragment,
    ParamType,
    FormatTypes,

    AbiCoder,
    defaultAbiCoder,

    Interface,
    Indexed,

    /////////////////////////
    // Types

    CoerceFunc,
    JsonFragment,
    JsonFragmentType,

    Result,
    checkResultErrors,

    LogDescription,
    TransactionDescription

} = require("@hethers/abi");
```

License
-------

MIT License
