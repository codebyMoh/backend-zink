const solWeb3 = require("@solana/web3.js");
const { Transaction, PublicKey, SystemProgram } = solWeb3;

async function withdrawSol(
  fromWallet,
  toWallet,
  sol,
  PK,
  connection,
  db,
  user,
  type,
  tradeTx
) {
  try {
    const fromPublicKey = new PublicKey(fromWallet);
    const toPublicKey = new PublicKey(toWallet);
    const solImLamports = Math.floor(Number(sol) * solWeb3.LAMPORTS_PER_SOL);
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromPublicKey,
        toPubkey: toPublicKey,
        lamports: solImLamports,
      })
    );

    // add blockhash manually
    transaction.feePayer = fromPublicKey;
    transaction.recentBlockhash = (
      await connection.getRecentBlockhash()
    ).blockhash;
    //   send transaction to the chain
    const signature = await solWeb3.sendAndConfirmTransaction(
      connection,
      transaction,
      [PK],
      {
        commitment: "confirmed",
        preflightCommitment: "confirmed",
      }
    );
    if (signature) {
      await db?.feeCollection?.create({
        wallet: fromWallet,
        userId: user?._id,
        chain: 101,
        feeAmount: Number(Number(sol).toFixed(9)),
        type: type,
        tradeTx: tradeTx,
        tx: signature,
      });
    }
    return signature;
  } catch (error) {
    return false;
  }
}

async function claimSolHandler(connection, fromWallet, toWallet, sol, PK) {
  const fromPublicKey = new PublicKey(fromWallet);
  const toPublicKey = new PublicKey(toWallet);
  const solImLamports = Math.floor(Number(sol) * solWeb3.LAMPORTS_PER_SOL);
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromPublicKey,
      toPubkey: toPublicKey,
      lamports: solImLamports,
    })
  );

  // add blockhash manually
  transaction.feePayer = fromPublicKey;
  transaction.recentBlockhash = (
    await connection.getRecentBlockhash()
  ).blockhash;
  //   send transaction to the chain
  const signature = await solWeb3.sendAndConfirmTransaction(
    connection,
    transaction,
    [PK],
    {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    }
  );
  return signature;
}

module.exports = { withdrawSol, claimSolHandler };
