Property Utilities
==================

This sub-module is part of the [hethers project](https://github.com/hashgraph/hethers.js). It is a fork of the original [ethers project](https://github.com/ethers-io/ethers.js) sub-module.

It contains several useful utility methods for managing simple objects with
defined properties.

For more information, see the [documentation](https://docs.ethers.io/v5/api/utils/properties/).


Importing
---------

Most users will prefer to use the [umbrella package](https://www.npmjs.com/package/@hashgraph/hethers),
but for those with more specific needs, individual components can be imported.

```javascript
const {

    defineReadOnly,

    getStatic,

    resolveProperties,
    checkProperties,

    shallowCopy,
    deepCopy,

    Description,

    // Types

    Deferrable

} = require("@hethers/properties");
```


License
-------

MIT License
