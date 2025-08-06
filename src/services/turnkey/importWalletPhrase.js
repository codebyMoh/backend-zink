const { decryptExportBundle, generateP256KeyPair } = require("@turnkey/crypto");
const { turnkeyClient } = require("./turnkeyInit");
const organizationId = process.env.TURNKEY_ORG_KEY;
async function importWalletSeedPhrase(walletId) {
  if (!walletId) {
    throw new Error("WalletId Id is required.");
  }
  // Generate ephemeral key pair for decrypting wallet bundle
  const keyPair = generateP256KeyPair();
  const privateKey = keyPair.privateKey;
  const publicKey = keyPair.publicKeyUncompressed;
  // Request export of the wallet
  const exportResult = await turnkeyClient.apiClient().exportWallet({
    walletId,
    targetPublicKey: publicKey,
  });

  // Decrypt the returned export bundle
  const decryptedBundle = await decryptExportBundle({
    exportBundle: exportResult.exportBundle,
    embeddedKey: privateKey,
    organizationId: organizationId,
    returnMnemonic: true,
  });

  return {
    seed: decryptedBundle,
  };
}

module.exports = { importWalletSeedPhrase };
