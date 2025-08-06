require("dotenv").config();
const crypto = require("crypto");
const cryptoJS = require("crypto-js");
const ThrowError = require("../utils/ThrowError");
const { code } = require("../../constant/code");
const { Wallet } = require("ethers");
const { Keypair } = require("@solana/web3.js");
const { base58 } = require("ethers/lib/utils");
const {
  generateSolWalletWithSamePhrase,
} = require("./generateWalletUsingPhrase/generateWalletSol");
const { importWalletSeedPhrase } = require("./turnkey/importWalletPhrase");
function encrypt(text, key, iv) {
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}
function decrypt(encryptedText, key, iv) {
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function encryptDataForFrontEnd(data) {
  const plainData = JSON.stringify(data);
  const cipherData = cryptoJS.AES.encrypt(
    plainData,
    process.env.FE_ENCRYPT_SEC_KEY
  ).toString();
  return cipherData;
}
function convertSolPKInString(PK) {
  if (!PK) {
    return 0;
  }
  const numbersArray = PK.toString().split(",").map(Number);
  const keypair = Keypair.fromSecretKey(Uint8Array.from(numbersArray));
  const privateKeyBase58 = base58.encode(keypair.secretKey);
  return privateKeyBase58;
}
// function to get privatekyes from DB in decrypted form
async function getSolanaPk(wallet, id, db) {
  const pkEncrypt = await db?.solPK.findOne({
    userId: id,
  });
  if (!pkEncrypt) {
    return ThrowError(code.NOT_FOUND, "Not found (sol PK)");
  }
  // merge PK
  const finalPK = pkEncrypt?.pk1 + pkEncrypt?.pk2 + pkEncrypt?.pk3;
  const PK = await generateSolWalletWithSamePhrase(finalPK, wallet?.index);
  if (PK?.publicKey?.toString() != wallet?.wallet) {
    return ThrowError(
      code.INTERNAL_SERVER_ERROR,
      "Internal server error(sol PK)"
    );
  }
  return { solana: { pk: PK?.secretKey } };
}

// fetch wallet from turnkey
async function getSolanaPkFromTurnkey(solTurnkeyId, wallet, index) {
  if (!solTurnkeyId || !wallet) {
    return ThrowError(
      code.INTERNAL_SERVER_ERROR,
      "Internal server error(IdTurn || wallet)"
    );
  }
  const pk = await importWalletSeedPhrase(solTurnkeyId);
  if (!pk?.seed) {
    return ThrowError(
      code.INTERNAL_SERVER_ERROR,
      "Internal server error(sol phrase)"
    );
  }
  const getPKSol = await generateSolWalletWithSamePhrase(pk?.seed, index);
  if (getPKSol?.publicKey?.toString() != wallet) {
    return ThrowError(
      code.INTERNAL_SERVER_ERROR,
      "Internal server error(sol PK)"
    );
  }
  if (!getPKSol?.secretKey) {
    return ThrowError(
      code.INTERNAL_SERVER_ERROR,
      "Internal server error(sol PK 2)."
    );
  }
  return { solana: { pk: getPKSol?.secretKey } };
}
async function getEVMPk(id, db) {
  const pkEncrypt = await db?.evmPK.findOne({
    userId: id,
  });
  if (!pkEncrypt) {
    return ThrowError(code.NOT_FOUND, "Not sound (evm pk)");
  }
  // merge PK
  const finalPK = pkEncrypt?.pk1 + pkEncrypt?.pk2 + pkEncrypt?.pk3;
  const restoredWallet = await Wallet.fromMnemonic(finalPK);
  return { evm: { phrase: finalPK, privateKey: restoredWallet.privateKey } };
}

// get phrase only

async function getEvmPhrase(id, db) {
  const pkEncrypt = await db?.evmPK.findOne({
    userId: id,
  });
  if (!pkEncrypt) {
    return ThrowError(code.NOT_FOUND, "Not sound (evm pk)");
  }
  // merge PK
  const finalPK = pkEncrypt?.pk1 + pkEncrypt?.pk2 + pkEncrypt?.pk3;
  return finalPK;
}

async function getSolanaPhrase(id, db) {
  const pkEncrypt = await db?.solPK.findOne({
    userId: id,
  });
  if (!pkEncrypt) {
    return ThrowError(code.NOT_FOUND, "Not found (sol pk)");
  }
  // merge PK
  const finalPK = pkEncrypt?.pk1 + pkEncrypt?.pk2 + pkEncrypt?.pk3;
  return finalPK;
}

module.exports = {
  encrypt,
  decrypt,
  getSolanaPk,
  getEVMPk,
  getEvmPhrase,
  getSolanaPhrase,
  encryptDataForFrontEnd,
  convertSolPKInString,
  getSolanaPkFromTurnkey,
};
