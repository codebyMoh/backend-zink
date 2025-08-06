const { Keypair } = require("@solana/web3.js");
const bip39 = require("bip39");
const { default: bs58 } = require("bs58");
const { derivePath } = require("ed25519-hd-key");

function generateSolWallet() {
  // generate seedphrase
  const seedPhrase = bip39.generateMnemonic();
  // convert into binary
  const seed = bip39.mnemonicToSeedSync(seedPhrase);
  // Create a dynamic path using the account index
  const path = `m/44'/501'/0'/0'`;
  const derivedSeed = derivePath(path, seed.toString("hex")).key;
  // Generate and return wallet using the derived seed
  const wallet = Keypair.fromSeed(derivedSeed.slice(0, 32));
  return { walletAddress: wallet.publicKey, seedPhrase: seedPhrase };
}

function getPKInNumberFormate(PK) {
  // Decode base58 to a byte array
  const keyBytes = bs58.decode(PK);

  // Convert to comma-separated string
  const result = Array.from(keyBytes).join(",");
  const numbersArray = result?.toString().split(",").map(Number);
  const privateKeyInArray = Uint8Array.from(numbersArray);
  const mainWallet = Keypair.fromSecretKey(privateKeyInArray);
  return mainWallet;
}

module.exports = { generateSolWallet, getPKInNumberFormate };
