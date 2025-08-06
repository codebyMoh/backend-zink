const { Keypair } = require("@solana/web3.js");
const bip39 = require("bip39");
const { derivePath } = require("ed25519-hd-key");
const { ethers } = require("ethers");

// Function to generate wallet dynamically based on account index
function generateSolWalletWithSamePhrase(seedPhrase, accountIndex) {
  // Convert your seed phrase into a binary seed
  const seed = bip39.mnemonicToSeedSync(seedPhrase);
  const path = `m/44'/501'/${accountIndex}'/0'`; // Create a dynamic path using the account index
  const derivedSeed = derivePath(path, seed.toString("hex")).key;
  const wallet = Keypair.fromSeed(derivedSeed.slice(0, 32)); // Generate and return wallet using the derived seed
  return wallet;
}

// generate PK using evm seed phrase
function getPrivateKeyFromMnemonic(mnemonic) {
  if (!ethers.utils.isValidMnemonic(mnemonic)) {
    throw new Error("Invalid mnemonic phrase.");
  }
  const path = "m/44'/60'/0'/0/0'";
  const wallet = ethers.Wallet.fromMnemonic(mnemonic, path);
  if (!wallet?.privateKey) {
    throw new Error("Internal server error(generating EVM a PK).");
  }
  return {
    privateKey: wallet?.privateKey,
    address: wallet?.address,
  };
}

module.exports = { generateSolWalletWithSamePhrase, getPrivateKeyFromMnemonic };
