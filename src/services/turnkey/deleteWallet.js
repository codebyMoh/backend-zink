const { turnkeyClient } = require("./turnkeyInit");

async function deleteWallet(walletId) {
  if (!walletId?.length) {
    throw new Error("WalletId is requeid");
  }
  const response = await turnkeyClient.apiClient().deleteWallets({
    walletIds: walletId,
    deleteWithoutExport: true,
  });
  console.log(JSON.stringify(response?.walletIds, null, 2));
}

module.exports = { deleteWallet };
