const { encryptWalletToBundle } = require("@turnkey/crypto");
const { turnkeyClient } = require("./turnkeyInit");
const organizationId = process.env.TURNKEY_ORG_KEY;
async function exportWalletSeedPhrase(phrase, userId) {
  if (!phrase || !userId) {
    throw new Error("Phrase or userId Id is required.");
  }
  // Step 1: Initialize the import operation
  const initResult = await turnkeyClient.apiClient().initImportWallet({
    userId,
  });

  // Step 2: Encrypt the mnemonic using the import bundle
  const walletBundle = await encryptWalletToBundle({
    mnemonic: phrase,
    importBundle: initResult.importBundle,
    userId,
    organizationId: organizationId,
  });

  // Step 3: Submit the wallet import to Turnkey
  const walletImportResult = await turnkeyClient.apiClient().importWallet({
    userId: userId,
    walletName: "Email",
    encryptedBundle: walletBundle,
    accounts: [],
  });

  console.log("✅ Wallet export successfully:");
  return walletImportResult?.walletId;
}
module.exports = { exportWalletSeedPhrase };
