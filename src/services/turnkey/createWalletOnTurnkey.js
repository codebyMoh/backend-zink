const { turnkeyClient } = require("./turnkeyInit");

async function createWalletInTurnKey(id) {
  if (!id) {
    throw new Error("Name is requeid");
  }
  const response = await turnkeyClient.apiClient().createWallet({
    walletName: `sol-${id?.toString()}`,
    accounts: [
      {
        curve: "CURVE_ED25519",
        pathFormat: "PATH_FORMAT_BIP32",
        path: `m/44'/501'/0'/0'`,
        addressFormat: "ADDRESS_FORMAT_SOLANA",
      },
    ],
  });
  console.log("✅ Wallet created successfully:");
  // console.log(JSON.stringify(response, null, 2));

  return {
    walletId: response?.walletId,
    address: response?.addresses[0],
  };
}
async function createWalletInTurnKeyEvm(id) {
  if (!id) {
    throw new Error("Name is requeid");
  }
  const response = await turnkeyClient.apiClient().createWallet({
    walletName: `evm-${id?.toString()}`,
    accounts: [
      {
        curve: "CURVE_SECP256K1",
        pathFormat: "PATH_FORMAT_BIP32",
        path: `m/44'/60'/0'/0/0'`,
        addressFormat: "ADDRESS_FORMAT_ETHEREUM",
      },
    ],
  });
  console.log("✅ Wallet created successfully:");
  // console.log(JSON.stringify(response, null, 2));

  return {
    walletId: response?.walletId,
    address: response?.addresses[0],
  };
}

async function createWalletsAccountOnSameSeed(index, walletId) {
  if (index > 24) {
    throw new Error("You reach the limit to create wallets");
  }
  if (!walletId) {
    throw new Error("WalletId is requeid.");
  }
  const response = await turnkeyClient.apiClient().createWalletAccounts({
    walletId: walletId,
    accounts: [
      {
        curve: "CURVE_ED25519",
        pathFormat: "PATH_FORMAT_BIP32",
        path: `m/44'/501'/${index}'/0'`,
        addressFormat: "ADDRESS_FORMAT_SOLANA",
      },
    ],
  });
  return {
    address: response?.addresses[0],
    index: index,
  };
}

module.exports = {
  createWalletInTurnKey,
  createWalletInTurnKeyEvm,
  createWalletsAccountOnSameSeed,
};
