import {BigNumber} from "./ethers";
import {hexlify} from "./utils";

export function fromSolidityAddress(address: string) {
    let addr = address.startsWith("0x")
        ? decodeHex(address.slice(2))
        : decodeHex(address);

    if (addr.length !== 20) {
        throw new Error(`Invalid hex encoded solidity address length:
                expected length 40, got length ${address.length}`);
    }
    const shard = BigNumber.from(hexlify(addr.slice(0, 4)));
    const realm = BigNumber.from(hexlify(addr.slice(4, 12)));
    const num = BigNumber.from(hexlify(addr.slice(12, 20)));
    return [shard.toNumber(), realm.toNumber(), num.toNumber()];
}

export function decodeHex(text: string): Uint8Array {
    const str = text.startsWith("0x") ? text.substring(2) : text;
    return Buffer.from(str, "hex");
}

export function encodeHex(data: Uint8Array) :string {
    return Buffer.from(data).toString("hex");
}

export function toSolidityAddress(address: [number, number, number]) {
    const buffer = new Uint8Array(20);
    const view = new DataView(buffer.buffer, 0, 20);
    const [shard, realm, num] = address;

    view.setUint32(0, shard);
    view.setUint32(8, realm);
    view.setUint32(16, num);

    return encodeHex(buffer);
}
