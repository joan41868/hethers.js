// @ts-ignore
export function isValidName(name) {
    // try {
    //     const comps = name.split(".");
    //     for (let i = 0; i < comps.length; i++) {
    //         if (nameprep(comps[i]).length === 0) {
    //             throw new Error("empty")
    //         }
    //     }
    //     return true;
    // } catch (error) { }
    // return false;
}
// @ts-ignore
export function namehash(name) {
    /* istanbul ignore if */
    // if (typeof(name) !== "string") {
    //     logger.throwArgumentError("invalid ENS name; not a string", "name", name);
    // }
    //
    // let current = name;
    // let result: string | Uint8Array = Zeros;
    // while (current.length) {
    //     const partition = current.match(Partition);
    //     if (partition == null || partition[2] === "") {
    //         logger.throwArgumentError("invalid ENS address; missing component", "name", name);
    //     }
    //     const label = toUtf8Bytes(nameprep(partition[3]));
    //     result = keccak256(concat([result, keccak256(label)]));
    //
    //     current = partition[2] || "";
    // }
    //
    // return hexlify(result);
}
//# sourceMappingURL=namehash.js.map