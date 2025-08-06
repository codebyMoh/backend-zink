const { Wallet } = require("ethers");

async function generateEVM() {
  // 1. Generate random wallet
  const wallet = Wallet.createRandom();

  // 2. Extract mnemonic phrase
  const phrase = wallet.mnemonic.phrase;

  // 3. Derive wallet again from mnemonic
  //   const restoredWallet = Wallet.fromMnemonic(phrase);

  // 4. Log all details
  //   console.log("Address:", wallet.address);
  //   console.log("Mnemonic:", phrase);
  //   console.log("Private Key:", restoredWallet.privateKey);

  return { walletEVM: wallet.address, phrase };
}

module.exports = { generateEVM };
