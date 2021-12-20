"use strict";

import {Account, AccountLike, getAccountFromAddress, getAddress, getAddressFromAccount} from "@ethersproject/address";
import {Provider, TransactionRequest} from "@ethersproject/abstract-provider";
import {
	ExternallyOwnedAccount,
	Signer,
	TypedDataDomain,
	TypedDataField,
	TypedDataSigner
} from "@ethersproject/abstract-signer";
import {
	arrayify,
	Bytes,
	BytesLike,
	concat,
	hexDataSlice, hexlify,
	isHexString,
	joinSignature,
	SignatureLike
} from "@ethersproject/bytes";
import {_TypedDataEncoder, hashMessage} from "@ethersproject/hash";
import {defaultPath, entropyToMnemonic, HDNode, Mnemonic} from "@ethersproject/hdnode";
import {keccak256} from "@ethersproject/keccak256";
import {defineReadOnly} from "@ethersproject/properties";
import {randomBytes} from "@ethersproject/random";
import {SigningKey} from "@ethersproject/signing-key";
import {decryptJsonWallet, decryptJsonWalletSync, encryptKeystore, ProgressCallback} from "@ethersproject/json-wallets";
import {computeAlias, recoverAddress, } from "@ethersproject/transactions";
import {Wordlist} from "@ethersproject/wordlists";

import {Logger} from "@ethersproject/logger";
import {version} from "./_version";
import { AccountId, ContractExecuteTransaction, ContractId, PrivateKey, TransactionId } from "@hashgraph/sdk";
import { BigNumber } from "ethers";

const logger = new Logger(version);

function isAccount(value: any): value is ExternallyOwnedAccount {
	return value != null && isHexString(value.privateKey, 32);
}

function hasMnemonic(value: any): value is { mnemonic: Mnemonic } {
	const mnemonic = value.mnemonic;
	return (mnemonic && mnemonic.phrase);
}

function hasAlias(value: any): value is ExternallyOwnedAccount {
	return isAccount(value) && value.alias != null;
}

const account = {
    "operator": {
        "accountId": "0.0.1280",
        "publicKey": "302a300506032b65700321004aed2e9e0cb6cbcd12b58476a2c39875d27e2a856444173830cc1618d32ca2f0",
        "privateKey": "302e020100300506032b65700422042072874996deabc69bde7287a496295295b8129551903a79b895a9fd5ed025ece8"
    },
    "network": {
        "35.231.208.148:50211": "0.0.3",
        "35.199.15.177:50211": "0.0.4",
        "35.225.201.195:50211": "0.0.5",
        "35.247.109.135:50211": "0.0.6"
    }
};


export class Wallet extends Signer implements ExternallyOwnedAccount, TypedDataSigner {

	// EVM Address format
	readonly address?: string;
	// Hedera Account format
	readonly account?: Account;
	// Hedera alias
	readonly alias?: string;
	readonly provider: Provider;

	// Wrapping the _signingKey and _mnemonic in a getter function prevents
	// leaking the private key in console.log; still, be careful! :)
	readonly _signingKey: () => SigningKey;
	readonly _mnemonic: () => Mnemonic;

	constructor(identity: BytesLike | ExternallyOwnedAccount | SigningKey, provider?: Provider) {
		logger.checkNew(new.target, Wallet);
		super();

		if (isAccount(identity) && !SigningKey.isSigningKey(identity)) {
			const signingKey = new SigningKey(identity.privateKey);
			defineReadOnly(this, "_signingKey", () => signingKey);

			if (identity.address || identity.account) {
				defineReadOnly(this, "address", identity.address ? getAddress(identity.address) : getAddressFromAccount(identity.account));
				defineReadOnly(this, "account", identity.account ? identity.account : getAccountFromAddress(identity.address));
			}

			if (hasAlias(identity)) {
				defineReadOnly(this, "alias", identity.alias);
				if (this.alias !== computeAlias(signingKey.privateKey)) {
					logger.throwArgumentError("privateKey/alias mismatch", "privateKey", "[REDACTED]");
				}
			}

			if (hasMnemonic(identity)) {
				const srcMnemonic = identity.mnemonic;
				defineReadOnly(this, "_mnemonic", () => (
					{
						phrase: srcMnemonic.phrase,
						path: srcMnemonic.path || defaultPath,
						locale: srcMnemonic.locale || "en"
					}
				));
				const mnemonic = this.mnemonic;
				const node = HDNode.fromMnemonic(mnemonic.phrase, null, mnemonic.locale).derivePath(mnemonic.path);
				if (node.privateKey !== this._signingKey().privateKey) {
					logger.throwArgumentError("mnemonic/privateKey mismatch", "privateKey", "[REDACTED]");
				}
			} else {
				defineReadOnly(this, "_mnemonic", (): Mnemonic => null);
			}
		} else {
			if (SigningKey.isSigningKey(identity)) {
				/* istanbul ignore if */
				if (identity.curve !== "secp256k1") {
					logger.throwArgumentError("unsupported curve; must be secp256k1", "privateKey", "[REDACTED]");
				}
				defineReadOnly(this, "_signingKey", () => (<SigningKey>identity));
			} else {
				// A lot of common tools do not prefix private keys with a 0x (see: #1166)
				if (typeof (identity) === "string") {
					if (identity.match(/^[0-9a-f]*$/i) && identity.length === 64) {
						identity = "0x" + identity;
					}
				}

				const signingKey = new SigningKey(identity);
				defineReadOnly(this, "_signingKey", () => signingKey);
			}

			defineReadOnly(this, "_mnemonic", (): Mnemonic => null);
			defineReadOnly(this, "alias", computeAlias(this._signingKey().privateKey));
		}
		/* istanbul ignore if */
		if (provider && !Provider.isProvider(provider)) {
			logger.throwArgumentError("invalid provider", "provider", provider);
		}

		defineReadOnly(this, "provider", provider || null);
	}

	get mnemonic(): Mnemonic {
		return this._mnemonic();
	}

	get privateKey(): string {
		return this._signingKey().privateKey;
	}

	get publicKey(): string {
		return this._signingKey().publicKey;
	}

	getAddress(): Promise<string> {
		return Promise.resolve(this.address);
	}

	getAccount(): Promise<Account> {
		return Promise.resolve(this.account);
	}

	getAlias(): Promise<string> {
		return Promise.resolve(this.alias);
	}

	connect(provider: Provider): Wallet {
		return new Wallet(this, provider);
	}

	connectAccount(accountLike: AccountLike): Wallet {
		const eoa = {
			privateKey: this._signingKey().privateKey,
			address: getAddressFromAccount(accountLike),
			alias: this.alias,
			mnemonic: this._mnemonic()
		};
		return new Wallet(eoa, this.provider);
	}

	// TODO to be revised
    // 1. TransactionRequest must be addressed and modified
    // 2. We must check whether it is Contract Create or Call (if there is no `to` field, we must sign FileCreate;
    // If there is `to` field we must read the `customData` and see whether we should sign ContractCreate or
    // ContractCall)
    // FIXME:
    //  the wallet has an identity, thus it has privateKey, publicKey and accountId.
    //  Those properties should be added to the class itself in the future.
    //  There will probably be an instance of the hedera client with an operator already set.
	signTransaction(transaction: TransactionRequest): Promise<string> {
		// Assuming it's always going to be a `ContractCall` transaction. FIXME
		const tx = new ContractExecuteTransaction()
				.setContractId(ContractId.fromSolidityAddress((transaction.to.toString())))
				.setFunctionParameters(arrayify(transaction.data))
				.setPayableAmount(transaction.value.toString())
				.setGas(BigNumber.from(transaction.gasLimit).toNumber())
				.setTransactionId(TransactionId.generate(account.operator.accountId))
				.setNodeAccountIds([new AccountId(0, 0, 3)]) // FIXME - should be taken from the network
				.freeze();
        const privKey = PrivateKey.fromString(account.operator.privateKey);
		return new Promise<string>(async(resolve)=>{
			const signed = await tx.sign(privKey);
			resolve(hexlify(signed.toBytes()));
		});
	}

	async signMessage(message: Bytes | string): Promise<string> {
		return joinSignature(this._signingKey().signDigest(hashMessage(message)));
	}

	// TODO to be revised
	async _signTypedData(domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, value: Record<string, any>): Promise<string> {
		// Populate any ENS names
		const populated = await _TypedDataEncoder.resolveNames(domain, types, value, (name: string) => {
			if (this.provider == null) {
				logger.throwError("cannot resolve ENS names without a provider", Logger.errors.UNSUPPORTED_OPERATION, {
					operation: "resolveName",
					value: name
				});
			}
			return this.provider.resolveName(name);
		});

		return joinSignature(this._signingKey().signDigest(_TypedDataEncoder.hash(populated.domain, types, populated.value)));
	}

	encrypt(password: Bytes | string, options?: any, progressCallback?: ProgressCallback): Promise<string> {
		if (typeof (options) === "function" && !progressCallback) {
			progressCallback = options;
			options = {};
		}

		if (progressCallback && typeof (progressCallback) !== "function") {
			throw new Error("invalid callback");
		}

		if (!options) {
			options = {};
		}

		return encryptKeystore(this, password, options, progressCallback);
	}

	/**
	 *  Static methods to create Wallet instances.
	 */
	static createRandom(options?: any): Wallet {
		let entropy: Uint8Array = randomBytes(16);

		if (!options) {
			options = {};
		}

		if (options.extraEntropy) {
			entropy = arrayify(hexDataSlice(keccak256(concat([entropy, options.extraEntropy])), 0, 16));
		}

		const mnemonic = entropyToMnemonic(entropy, options.locale);
		return Wallet.fromMnemonic(mnemonic, options.path, options.locale);
	}

	static fromEncryptedJson(json: string, password: Bytes | string, progressCallback?: ProgressCallback): Promise<Wallet> {
		return decryptJsonWallet(json, password, progressCallback).then((account) => {
			return new Wallet(account);
		});
	}

	static fromEncryptedJsonSync(json: string, password: Bytes | string): Wallet {
		return new Wallet(decryptJsonWalletSync(json, password));
	}

	static fromMnemonic(mnemonic: string, path?: string, wordlist?: Wordlist): Wallet {
		if (!path) {
			path = defaultPath;
		}
		return new Wallet(HDNode.fromMnemonic(mnemonic, null, wordlist).derivePath(path));
	}
}

// TODO to be revised
export function verifyMessage(message: Bytes | string, signature: SignatureLike): string {
	return recoverAddress(hashMessage(message), signature);
}

// TODO to be revised
export function verifyTypedData(domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, value: Record<string, any>, signature: SignatureLike): string {
	return recoverAddress(_TypedDataEncoder.hash(domain, types, value), signature);
}
