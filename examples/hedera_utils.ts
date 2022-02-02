import { AccountBalanceQuery, Client, Hbar, HbarUnit, TransferTransaction } from "@hashgraph/sdk";

const account = {
	"operator": {
		"accountId": "0.0.19041642",
		"privateKey": "302e020100300506032b6570042204207ef3437273a5146e4e504a6e22c5caedf07cb0821f01bc05d18e8e716f77f66c"
	},
	"network": {
		"0.testnet.hedera.com:50211": "0.0.3",
		"1.testnet.hedera.com:50211": "0.0.4",
		"2.testnet.hedera.com:50211": "0.0.5",
		"3.testnet.hedera.com:50211": "0.0.6"
	}
};

(async () => {

	const client = Client.forNetwork(account.network).setOperator(account.operator.accountId, account.operator.privateKey);
	// accounts which have ECDSA keys are not topped-up with 10k hbars automatically.
	// This script will top up this account with another testnet account
	const testAccount = '0.0.29562194';
	const amount = 3000;
	const transfer = await new TransferTransaction()
		.addHbarTransfer(account.operator.accountId, new Hbar(amount).negated())
		.addHbarTransfer(testAccount, new Hbar(amount));
	await transfer.execute(client);
	const testAccountBalance = await new AccountBalanceQuery().setAccountId(testAccount).execute(client);
	console.log(testAccountBalance.hbars.toString(HbarUnit.Hbar));
})();