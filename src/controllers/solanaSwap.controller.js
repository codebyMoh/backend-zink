const { code } = require("../../constant/code");
const { db } = require("../model");
const {
  getSolanaPk,
  getSolanaPkFromTurnkey,
} = require("../services/encryption");
const ThrowError = require("../utils/ThrowError");
const { ethers } = require("ethers");
const { apiResponse } = require("../utils/apiResponse");
const {
  Keypair,
  Connection,
  VersionedTransaction,
  PublicKey,
  Transaction,
  SystemProgram,
} = require("@solana/web3.js");
const solWeb3 = require("@solana/web3.js");
const {
  getSwapQuote,
  getSignature,
  waitForConfirmation,
  getEncodedDataWithPriorityFee,
  solanaPumpSwapRoutes,
} = require("../services/solanaTransactions/solanatransactions");
const { convertToDecimal } = require("../utils/calcuation");
// =================================== make connection to send transaction ====================>
const connection = new Connection(process.env.SOLANA_STAKE_RPC_URL, {
  commitment: "confirmed",
});
// solana buy
async function solanaBuyJup(req, res) {
  const user = req.user;
  const wallet = await user?.walletAddressSOL?.find((item) => item?.primary);
  const {
    token,
    amount,
    slippage,
    priorityFee,
    price,
    programAddress,
    tokenPrice,
    metaData,
  } = req.body;
  //  =============================== check validation ==============================================>
  if (
    [
      token,
      amount,
      slippage,
      priorityFee,
      price,
      programAddress,
      tokenPrice,
    ].some((item) => !item?.toString().trim())
  ) {
    return ThrowError(code.BAD_REQUEST, "All fileds are required.");
  }
  // =================================== get solana privateKey =====================================>
  const privateKey = await getSolanaPkFromTurnkey(
    user?.solTurnkeyId,
    wallet?.wallet,
    wallet?.index
  );
  const numbersArray = await privateKey.solana.pk
    .toString()
    .split(",")
    .map(Number);
  const PK = Uint8Array.from(numbersArray);
  const mainWallet = Keypair.fromSecretKey(PK);
  // =================================== make connection to send transaction ====================>
  // const connection = new Connection(process.env.SOLANA_STAKE_RPC_URL, {
  //   commitment: "confirmed",
  // });
  let transactionRaw = null;
  const amountForFeeCharge = (amount * user?.feePercentage) / 100;
  if (
    programAddress?.toString().toLowerCase() ==
    "6ef8rrecthr5dkzon8nwu78hrvfckubj14m5ubewf6p"
  ) {
    // console.log("================= pump =======================>");
    const pupmRoutes = await solanaPumpSwapRoutes(
      wallet?.wallet,
      "buy",
      token,
      true,
      amount - amountForFeeCharge,
      slippage,
      priorityFee
    );
    transactionRaw = pupmRoutes;
    metaData.programAddress = programAddress;
  } else {
    // console.log("================= not pump =======================>");
    //================================== convert amount into smallunits =======================================>
    const amountSOL = await ethers.utils.parseUnits(
      Number(amount - amountForFeeCharge)
        ?.toFixed(9)
        .toString(),
      9
    );
    //=================================== get swap quotetion =========================================>
    const swapQuotetion = await getSwapQuote(
      "So11111111111111111111111111111111111111112",
      token,
      amountSOL,
      slippage
    );
    if (!swapQuotetion) {
      return ThrowError(
        code.INTERNAL_SERVER_ERROR,
        "Internal server error(swap routes)."
      );
    }
    metaData.recAmoutnFromRoutes = convertToDecimal(
      Number(swapQuotetion?.outAmount),
      Number(metaData?.decimal)
    );
    //========================================= get swap encoded data =================================>
    const priorityFeeInSmallUnit = priorityFee * 1000000000;
    const swapEncodedData = await getEncodedDataWithPriorityFee(
      swapQuotetion,
      wallet?.wallet,
      priorityFeeInSmallUnit
    );
    if (!swapEncodedData) {
      return ThrowError(
        code.INTERNAL_SERVER_ERROR,
        "Internal server error(swap encoded data)."
      );
    }
    transactionRaw = swapEncodedData.swapTransaction;
  }
  if (!transactionRaw) {
    return ThrowError(
      code.INTERNAL_SERVER_ERROR,
      "Internal server error(transaction raw empty)."
    );
  }
  // ============================== make version serialized ===============================>
  const transaction = VersionedTransaction.deserialize(
    Buffer.from(transactionRaw, "base64")
  );
  //============================================= sign the transaction ===================================>
  transaction.sign([mainWallet]);
  // --- 🧠 NEW: Before sending transaction, simulate it first to check transaction is passed or not ---
  // const simulationResult = await connection.simulateTransaction(transaction);
  // if (simulationResult.value.err) {
  //   console.error("🚨 Simulation error:", simulationResult.value.err);
  //   return ThrowError(
  //     code.BAD_REQUEST,
  //     "Transaction simulation failed. Reason:- less priority fee, low LIQ, insufficient funds, slippage please check and try again."
  //   );
  // }
  // ======================================= get signature ======================================>
  // console.log("🚀 ~ solanaBuyJup ~ metaData:", metaData);
  const signature = await getSignature(transaction, connection);
  if (!signature) {
    return ThrowError(
      code.INTERNAL_SERVER_ERROR,
      "Internal server error(signature)."
    );
  }
  // waitForConfirmation and then saved in db asyncrounously
  waitForConfirmation(
    signature,
    connection,
    db,
    user,
    token,
    "So11111111111111111111111111111111111111112",
    token,
    101,
    Number(amount),
    Number(price),
    "buy",
    wallet?.wallet,
    Number(amountForFeeCharge),
    mainWallet,
    tokenPrice,
    Number(amount),
    price,
    metaData || {}
  );

  // send response
  return apiResponse(res, code.SUCCESS, "Transaction successfull.", {
    transaction: {
      fromToken: "So11111111111111111111111111111111111111112",
      toToken: token,
      amount: amount,
      recQty: metaData?.recAmoutnFromRoutes || null,
      tx: signature,
    },
  });
}

// solana sell
async function solanaSellJup(req, res) {
  const user = req.user;
  const wallet = await user?.walletAddressSOL?.find((item) => item?.primary);
  const {
    token,
    amount,
    slippage,
    priorityFee,
    decimal,
    price,
    programAddress,
    amountRecInsol,
    isSellFullAmount,
    metaData,
    solPrice,
  } = req.body;
  //======================== check validation ===============================>
  if (
    [
      token,
      amount,
      slippage,
      priorityFee,
      decimal,
      price,
      programAddress,
      amountRecInsol,
    ].some((item) => !item?.toString().trim())
  ) {
    return ThrowError(code.BAD_REQUEST, "All fileds are required.");
  }
  if (isSellFullAmount == null || isSellFullAmount == undefined) {
    return ThrowError(code.BAD_REQUEST, "All fileds are required.");
  }
  // =============================== get solana privateKey ======================>
  const privateKey = await getSolanaPkFromTurnkey(
    user?.solTurnkeyId,
    wallet?.wallet,
    wallet?.index
  );
  const numbersArray = privateKey.solana.pk.toString().split(",").map(Number);
  const PK = Uint8Array.from(numbersArray);
  const mainWallet = Keypair.fromSecretKey(PK);
  // ============= make connection to meme pool send transaction ====================>
  // const connection = new Connection(process.env.SOLANA_STAKE_RPC_URL, {
  //   commitment: "confirmed",
  // });
  let transactionRaw = null;
  let amountForFeeCharge = 0;
  let totalTradedAmountInsol = amountRecInsol;
  if (
    programAddress?.toString().toLowerCase() ==
    "6ef8rrecthr5dkzon8nwu78hrvfckubj14m5ubewf6p"
  ) {
    // console.log(
    //   "============================== pump ===========================>"
    // );
    const pupmRoutes = await solanaPumpSwapRoutes(
      wallet?.wallet,
      "sell",
      token,
      false,
      amount,
      slippage,
      priorityFee
    );
    transactionRaw = pupmRoutes;
    amountForFeeCharge = (Number(amountRecInsol) * user?.feePercentage) / 100;
  } else {
    // console.log(
    //   "============================== not pump ===========================>"
    // );
    //======================= convert amount into smallunits =================>
    const amountInSmalletDecimal = await ethers.utils.parseUnits(
      Number(amount)?.toString(),
      decimal
    );
    // ========================= get swap quotetion ======================>
    const swapQuotetion = await getSwapQuote(
      token.toString(),
      "So11111111111111111111111111111111111111112",
      amountInSmalletDecimal,
      slippage
    );
    if (!swapQuotetion) {
      return ThrowError(
        code.INTERNAL_SERVER_ERROR,
        "Internal server error(swap routes)."
      );
    }
    const smallAmountToDecimal =
      Number(swapQuotetion?.outAmount) / 1_000_000_000;
    amountForFeeCharge =
      (Number(smallAmountToDecimal) * user?.feePercentage) / 100;
    //========================= get swap encoded data ===========================>
    const priorityFeeInSmallUnit = priorityFee * 1_000_000_000;
    const swapEncodedData = await getEncodedDataWithPriorityFee(
      swapQuotetion,
      wallet?.wallet,
      priorityFeeInSmallUnit
    );
    if (!swapEncodedData) {
      return ThrowError(
        code.INTERNAL_SERVER_ERROR,
        "Internal server error(swap encoded data)."
      );
    }
    transactionRaw = swapEncodedData.swapTransaction;
  }
  if (!transactionRaw) {
    return ThrowError(
      code.INTERNAL_SERVER_ERROR,
      "Internal server error(transaction raw empty)."
    );
  }
  // =========================================== version deserialized ==========================>
  const transaction = VersionedTransaction.deserialize(
    Buffer.from(transactionRaw, "base64")
  );
  //======================== sign the transaction =====================>
  transaction.sign([mainWallet]);
  // --- 🧠 NEW: Before sending transaction, simulate it first to check transaction is passed or not ---
  // const simulationResult = await connection.simulateTransaction(transaction);
  // if (simulationResult.value.err) {
  //   console.error("🚨 Simulation error:", simulationResult.value.err);
  //   return ThrowError(
  //     code.BAD_REQUEST,
  //     "Transaction simulation failed. Reason:- less priority fee, low LIQ, insufficient funds, slippage please check and try again."
  //   );
  // }
  //========================== get signature ========================>
  const signature = await getSignature(transaction, connection);
  if (!signature) {
    return ThrowError(
      code.INTERNAL_SERVER_ERROR,
      "Internal server error(signature)."
    );
  }
  // waitForConfirmation and then saved in db asyncrounously
  waitForConfirmation(
    signature,
    connection,
    db,
    user,
    token,
    token,
    "So11111111111111111111111111111111111111112",
    101,
    Number(amount),
    Number(price),
    "sell",
    wallet?.wallet,
    Number(amountForFeeCharge),
    mainWallet,
    price,
    totalTradedAmountInsol,
    solPrice,
    metaData || null,
    isSellFullAmount
  );
  return apiResponse(res, code.SUCCESS, "Transaction successfull.", {
    transaction: {
      fromToken: token,
      toToken: "So11111111111111111111111111111111111111112",
      amount: amount,
      tx: signature,
    },
  });
}

// withraw sol for user
async function withrawSolHandlerForUser(req, res) {
  const user = req.user;
  const { toWallet, amount } = req.body;
  if ((!toWallet, !amount)) {
    return ThrowError(code.BAD_REQUEST, "All fields are required.");
  }
  // const connection = new Connection(process.env.SOLANA_STAKE_RPC_URL, {
  //   commitment: "confirmed",
  // });
  const wallet = await user?.walletAddressSOL?.find((item) => item?.primary);
  const privateKey = await getSolanaPkFromTurnkey(
    user?.solTurnkeyId,
    wallet?.wallet,
    wallet?.index
  );
  const numbersArray = privateKey.solana.pk.toString().split(",").map(Number);
  const PK = Uint8Array.from(numbersArray);
  const mainWallet = Keypair.fromSecretKey(PK);
  const fromPublicKey = new PublicKey(wallet?.wallet);
  const toPublicKey = new PublicKey(toWallet);
  const solImLamports = Math.floor(Number(amount) * solWeb3.LAMPORTS_PER_SOL);
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
    [mainWallet],
    {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    }
  );
  if (signature) {
    await db?.withrawUsermodel?.create({
      wallet: wallet?.wallet,
      toWallet: toWallet,
      userId: user?._id,
      chain: 101,
      amount: Number(Number(amount).toFixed(9)),
      tx: signature,
    });
    return apiResponse(res, code.SUCCESS, "Transaction successfull.", {
      transaction: {
        fromWallet: wallet?.wallet,
        destWallet: toWallet,
        amount: amount,
        tx: signature,
      },
    });
  }
}

// withraw sol
module.exports = {
  solanaBuyJup,
  solanaSellJup,
  withrawSolHandlerForUser,
};
