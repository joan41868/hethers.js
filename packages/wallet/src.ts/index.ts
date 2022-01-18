import { Account, AccountLike, getAccountFromAddress, getAddress, getAddressFromAccount } from "@ethersproject/address";
import { BlockTag, Provider, TransactionRequest } from "@ethersproject/abstract-provider";
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
import { _TypedDataEncoder, hashMessage } from "@ethersproject/hash";
import { defaultPath, entropyToMnemonic, HDNode, Mnemonic } from "@ethersproject/hdnode";
import { keccak256 } from "@ethersproject/keccak256";
import { Deferrable, defineReadOnly, resolveProperties } from "@ethersproject/properties";
import { randomBytes } from "@ethersproject/random";
import { SigningKey } from "@ethersproject/signing-key";
import {
	decryptJsonWallet,
	decryptJsonWalletSync,
	encryptKeystore,
	ProgressCallback
} from "@ethersproject/json-wallets";
import { computeAlias, recoverAddress } from "@ethersproject/transactions";
import { Wordlist } from "@ethersproject/wordlists";

import { Logger } from "@ethersproject/logger";
import { version } from "./_version";
import {
	ContractCreateTransaction,
	ContractExecuteTransaction,
	ContractId,
	FileAppendTransaction, FileCreateTransaction,
	Transaction,
	PrivateKey as HederaPrivKey,
	PublicKey as HederaPubKey,
	ContractCallQuery,
	TransactionId,
	Hbar,
	AccountId,
	PrivateKey
} from "@hashgraph/sdk";
import { TransactionBody, SignedTransaction } from '@hashgraph/proto'
import {numberify} from "@ethersproject/bignumber";
import * as Long from 'long';

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

	signTransaction(transaction: TransactionRequest): Promise<string> {
		this._checkAddress('signTransaction');
		if (transaction.from) {
			if (getAddressFromAccount(transaction.from) !== this.address) {
				logger.throwArgumentError("transaction from address mismatch", "transaction.from", transaction.from);
			}
		}

		let tx: Transaction;
		const arrayifiedData = transaction.data ? arrayify(transaction.data) : new Uint8Array();
		const gas = numberify(transaction.gasLimit ? transaction.gasLimit : 0);
		if (transaction.to) {
			tx = new ContractExecuteTransaction()
				.setContractId(ContractId.fromSolidityAddress(getAddressFromAccount(transaction.to)))
				.setFunctionParameters(arrayifiedData)
				.setGas(gas);
			if (transaction.value) {
				(tx as ContractExecuteTransaction).setPayableAmount(transaction.value?.toString())
			}
		} else {
			if (transaction.customData.bytecodeFileId) {
				tx = new ContractCreateTransaction()
					.setBytecodeFileId(transaction.customData.bytecodeFileId)
					.setConstructorParameters(arrayifiedData)
					.setInitialBalance(transaction.value?.toString())
					.setGas(gas);
			} else {
				if (transaction.customData.fileChunk && transaction.customData.fileId) {
					tx = new FileAppendTransaction()
						.setContents(transaction.customData.fileChunk)
						.setFileId(transaction.customData.fileId)
				} else if (!transaction.customData.fileId && transaction.customData.fileChunk) {
					// only a chunk, thus the first one
					tx = new FileCreateTransaction()
						.setContents(transaction.customData.fileChunk)
						.setKeys([ transaction.customData.fileKey ?
							transaction.customData.fileKey :
							HederaPubKey.fromString(this._signingKey().compressedPublicKey) ])
				} else {
					logger.throwArgumentError(
						"Cannot determine transaction type from given custom data. Need either `to`, `fileChunk`, `fileId` or `bytecodeFileId`",
						Logger.errors.INVALID_ARGUMENT,
						transaction);
				}
			}
		}
		const account = getAccountFromAddress(this.address);
		tx.setTransactionId(
			TransactionId.generate(new AccountId({
			shard: numberify(account.shard),
			realm: numberify(account.realm),
			num: numberify(account.num)
		})))
			// FIXME - should be taken from the network/ wallet's provider
			.setNodeAccountIds([ new AccountId(0, 0, 3) ])
			.freeze();

		const pkey = HederaPrivKey.fromStringECDSA(this._signingKey().privateKey);
		return new Promise<string>(async (resolve) => {
			const signed = await tx.sign(pkey);
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

	async call(txRequest : Deferrable<TransactionRequest>, blockTag?: BlockTag | Promise<BlockTag>): Promise<string> {
		this._checkProvider("call");
		const tx = await resolveProperties(this.checkTransaction(txRequest));
		const contractAccountLikeID = getAccountFromAddress(tx.to.toString());
		const contractId = `${contractAccountLikeID.shard}.${contractAccountLikeID.realm}.${contractAccountLikeID.num}`;

		const thisAcc = getAccountFromAddress(await this.getAddress());
		const thisAccId = `${thisAcc.shard}.${thisAcc.realm}.${thisAcc.num}`;

		const nodeID = AccountId.fromString(tx.nodeId.toString());
		const paymentTxId = TransactionId.generate(thisAccId);

		const hederaTx = new ContractCallQuery()
			.setContractId(contractId)
			.setFunctionParameters(arrayify(tx.data))
			.setNodeAccountIds([nodeID])
			.setGas(Long.fromString(tx.gasLimit.toString()))
			.setPaymentTransactionId(paymentTxId);

		const paymentBody = {
			transactionID: paymentTxId._toProtobuf(),
			nodeAccountID: nodeID._toProtobuf(),
			transactionFee: new Hbar(1).toTinybars(),
			transactionValidDuration: {
				seconds: Long.fromInt(120),
			},
			cryptoTransfer: {
				transfers: {
					accountAmounts:[
						{
							accountID: AccountId.fromString(thisAccId)._toProtobuf(),
							amount: new Hbar(3).negated().toTinybars()
						},
						{
							accountID: nodeID._toProtobuf(),
							amount: new Hbar(3).toTinybars()
						}
					],
				},
			},
		};

		const signed = {
			bodyBytes: TransactionBody.encode(paymentBody).finish(),
			sigMap: {}
		};

		const walletKey = PrivateKey.fromStringECDSA(this._signingKey().privateKey);
		const signature = walletKey.sign(signed.bodyBytes);
		signed.sigMap ={
			sigPair: [walletKey.publicKey._toProtobufSignature(signature)]
		}

		const transferSignedTransactionBytes =  SignedTransaction.encode(signed).finish();
		hederaTx._paymentTransactions.push({
			signedTransactionBytes: transferSignedTransactionBytes
		});
		const response = await hederaTx.execute(this.provider.getHederaClient());
		// TODO: this may not be the best thing to return but it should work for testing
		return hexlify(response.asBytes());
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
			entropy = arrayify(hexDataSlice(keccak256(concat([ entropy, options.extraEntropy ])), 0, 16));
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

	_checkAddress(operation?: string): void {
		if (!this.address) { logger.throwError("missing address", Logger.errors.UNSUPPORTED_OPERATION, {
			operation: (operation || "_checkAddress") });
		}
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
