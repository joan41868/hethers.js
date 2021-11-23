import {HederaProvider} from "@ethersproject/providers";


function encode(data: Uint8Array) :string {
    return Buffer.from(data).toString("hex");
}

function toSolidityAddress(address: [number, number, number]) {
    const buffer = new Uint8Array(20);
    const view = new DataView(buffer.buffer, 0, 20);
    const [shard, realm, num] = address;

    view.setUint32(0, shard);
    view.setUint32(8, realm);
    view.setUint32(16, num);

    return encode(buffer);
}

// main - run with ` ts-node playground.js `
(async () => {
    const provider = new HederaProvider("mainnet");
    const solidityAddr = toSolidityAddress([0, 0, 98])
    const bal = await provider.getBalance(solidityAddr);
    console.log(bal); // outputs: BigNumber { _hex: '0x0131dcc4030d40', _isBigNumber: true }
    console.log(bal.toNumber()); // outputs: 336299263359826
})();
