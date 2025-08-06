const { PublicKey } = require("@solana/web3.js");
const { isSameDate, isSameWeek } = require("../basicFunction");
const { globalPnlFunction } = require("../PNL/globalPNLFunction");
const { withdrawSol } = require("./solTransfer");
const {
  getOrCreateAssociatedTokenAccount,
  getAccount,
  getMint,
} = require("@solana/spl-token");
const { redis } = require("../redis/redisConnect");
require("dotenv").config();
const swap_quote_api = process.env.JUP_SWAP_QUOTE_API;
const swap_encoded_api = process.env.JUP_SWAP_ENCODED_API;
const walletForFeeCollection = process.env.WALLET_FOR_FEECOLLECTION;

// increment in redis
async function incrementKeyInRedis(key, value) {
  try {
    if (!key || !value) {
      return 0;
    }
    await redis.incrbyfloat(key, value);
  } catch (error) {
    console.log("🚀 ~ incrementKeyInRedis ~ error:", error?.message);
  }
}

// get token balance
const getSoalanaTokenBalance = async (
  walletAddress,
  tokenMintAddress,
  connection
) => {
  // Create a connection to the Solana cluster
  try {
    if ((!walletAddress || !tokenMintAddress, !connection)) {
      return 0;
    }
    const walletPublicKey = new PublicKey(walletAddress);
    const tokenMintPublicKey = new PublicKey(tokenMintAddress);

    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      walletPublicKey,
      tokenMintPublicKey,
      walletPublicKey,
      false,
      "confirmed"
    );

    const accountInfo = await getAccount(
      connection,
      tokenAccount.address,
      "confirmed"
    );
    const mintInfo = await getMint(connection, tokenMintPublicKey, "processed");
    const balance = Number(accountInfo.amount) / 10 ** mintInfo.decimals;
    return balance || 0;
  } catch (error) {
    console.log("🚀 ~ getSoalanaTokenBalance ~ error:", error);
    return 0;
  }
};

// get swap quotation
async function getSwapQuote(inputMint, outputMint, amount, slippage) {
  try {
    const url = `${swap_quote_api}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${
      slippage * 100
    }`;
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Error fetching swap quote: ${response.statusText} - ${errorText}`
      );
    }
    const quoteResponse = await response.json();
    return quoteResponse;
  } catch (error) {
    console.log("🚀 ~ getSwapQuote ~ error:", error?.message);
    return 0;
  }
}

// get encoded data with priorityFee
async function getEncodedDataWithPriorityFee(
  quoteResponse,
  walletAddress,
  priorityFee
) {
  try {
    const swapResponse = await (
      await fetch(swap_encoded_api, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: walletAddress.toString(),
          prioritizationFeeLamports: {
            priorityLevelWithMaxLamports: {
              maxLamports: priorityFee,
              priorityLevel: "veryHigh",
            },
            // jitoTipLamports: priorityFee,
          },
        }),
      })
    ).json();
    return swapResponse;
  } catch (error) {
    console.log("🚀 ~ getEncodedData ~ error:", error?.message);
    return 0;
  }
}

// get encoded data with jito tips
async function getEncodedDataWithJito(
  quoteResponse,
  walletAddress,
  priorityFee
) {
  try {
    const swapResponse = await (
      await fetch(swap_encoded_api, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: walletAddress.toString(),
          prioritizationFeeLamports: {
            jitoTipLamports: priorityFee,
          },
        }),
      })
    ).json();
    return swapResponse;
  } catch (error) {
    console.log("🚀 ~ getEncodedData ~ error:", error?.message);
    return 0;
  }
}

// get signature
async function getSignature(transaction, connection) {
  const transactionBinary = await transaction.serialize();
  const signature = await connection.sendRawTransaction(transactionBinary, {
    skipPreflight: false,
    preflightCommitment: "processed",
  });
  return signature;
}

// pump fun routes
async function solanaPumpSwapRoutes(
  address,
  type,
  token,
  isSol,
  amount,
  slippage,
  priorityFee
) {
  try {
    const response = await fetch(`https://pumpportal.fun/api/trade-local`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        publicKey: address, // Your wallet public key
        action: type, // "buy" or "sell"
        mint: token, // contract address of the token you want to trade
        denominatedInSol: isSol ? "true" : "false", // "true" if amount is amount of SOL, "false" if amount is number of tokens
        amount: Number(amount), // amount of SOL or tokens
        slippage: slippage, // percent slippage allowed
        priorityFee: priorityFee, // priority fee
        pool: "pump", // exchange to trade on. "pump", "raydium", "pump-amm" or "auto"
      }),
    });
    const responseBuffer = await response.arrayBuffer();
    return responseBuffer;
  } catch (error) {
    console.log("🚀 ~ solanaPumpSwapRoutes ~ error:", error?.message);
    return 0;
  }
}

// wait for confirmation
async function waitForConfirmation(
  signature,
  connection,
  db,
  user,
  token,
  fromToken,
  toToken,
  chain,
  amount,
  price,
  type,
  address,
  feeAmount,
  PK,
  tokenPrice,
  totalTradedAmountInsol,
  solPrice,
  metaData,
  isSellFullAmount
) {
  try {
    // const confirmation = await connection.confirmTransaction(
    //   { signature },
    //   "confirmed"
    // );
    // if (confirmation.value.err) {
    //   throw new Error(
    //     `Transaction failed: ${JSON.stringify(
    //       confirmation.value.err
    //     )}\nhttps://solscan.io/tx/${signature}/`
    //   );
    // }
    // Step 1: Calculate trade value in USD
    const amountInDollar =
      type === "buy"
        ? Number(((amount - feeAmount) * price).toFixed(5))
        : Number((amount * price).toFixed(5));

    // store fifo holdings
    // Step 2: Log transaction + trigger PnL
    await Promise.allSettled([
      db?.transaction?.create({
        userId: user?._id,
        token,
        fromToken,
        toToken,
        chain,
        amount,
        amountInDollar,
        type,
        tx: signature,
        wallet: address,
        tokenPrice: Number(tokenPrice.toFixed(10)),
      }),
      globalPnlFunction(
        {
          user,
          token,
          amount,
          tokenPrice,
          amountInDollar,
          wallet: address,
          isSellFullAmount,
          solPrice: solPrice || 0,
          metaData: metaData || null,
        },
        type
      ).catch((err) => {}),
      incrementKeyInRedis(
        "totalVolume",
        +Number(amountInDollar).toFixed(6)
      ).catch((err) => {}),
    ]);

    // Step 3: Withdraw the fee before updating the DB
    const signatureForFee = await withdrawSol(
      address,
      walletForFeeCollection,
      feeAmount,
      PK,
      connection,
      db,
      user,
      type,
      signature
    );

    // Step 4: If fee transfer was successful, build atomic update
    if (signatureForFee) {
      const now = Date.now();
      // 10+ points on 3 trades every day once
      const isSameDay =
        user?.tradeDateInfo &&
        isSameDate(user?.tradeDateInfo?.time || null, now);
      const tradeDateInfo = isSameDay
        ? {
            time: user?.tradeDateInfo?.time,
            pointsAddedPerDay: user?.tradeDateInfo?.pointsAddedPerDay,
            totalTradePerDay: user?.tradeDateInfo?.totalTradePerDay + 1,
          }
        : {
            time: now,
            totalTradePerDay: 1,
            pointsAddedPerDay: false,
          };
      let dailyPointsToAdd = 0;
      // +10 points if 3+ trades today and not yet rewarded
      if (
        tradeDateInfo?.totalTradePerDay >= 3 &&
        !tradeDateInfo?.pointsAddedPerDay
      ) {
        dailyPointsToAdd += 10;
        tradeDateInfo.pointsAddedPerDay = true;
      }
      // +100 point if user make 10000USD trade in a week
      const isSameWeekRange =
        user?.weeklyTradeDateInfo &&
        isSameWeek(user?.weeklyTradeDateInfo?.time || null, now);
      const weeklyInfo = isSameWeekRange
        ? {
            time: user?.weeklyTradeDateInfo?.time,
            totalTradeAmount:
              user?.weeklyTradeDateInfo?.totalTradeAmount + amountInDollar,
            pointsAddedPerWeekTrade:
              user?.weeklyTradeDateInfo?.pointsAddedPerWeekTrade,
          }
        : {
            time: now,
            totalTradeAmount: amountInDollar,
            pointsAddedPerWeekTrade: false,
          };
      let weeklyPointsToAdd = 0;
      if (
        weeklyInfo?.totalTradeAmount >= 10000 &&
        !weeklyInfo?.pointsAddedPerWeekTrade
      ) {
        weeklyPointsToAdd += 100;
        weeklyInfo.pointsAddedPerWeekTrade = true;
      }
      // +1 point per $100
      let tradePointsToAdd = 0;
      let dailyTrade = user?.dailyTrade + amountInDollar;
      const pointReward = Math.floor(dailyTrade / 100);
      if (pointReward > 0) {
        tradePointsToAdd += pointReward;
        dailyTrade -= pointReward * 100;
      }

      // Prepare atomic update
      const updateUserQuery = {
        $inc: {
          buysTradeCount: type === "buy" ? 1 : 0,
          sellsTradeCount: type === "sell" ? 1 : 0,
          totalTrades: 1,
          feeCollected: Number(feeAmount.toFixed(9)),
          totalTradeAmountInUsd: amountInDollar,
          tradePoints: tradePointsToAdd,
          dailyPoints: dailyPointsToAdd,
          weeklyPoints: weeklyPointsToAdd,
          totalTradeAmount: totalTradedAmountInsol,
        },
        $set: {
          dailyTrade: dailyTrade,
          tradeDateInfo: tradeDateInfo,
          weeklyTradeDateInfo: weeklyInfo,
        },
      };

      // +50 add in refferedBy every 1000 usd
      if (user?.referredBy) {
        const newAmount = user?.tradeAmountForReferredBy + amountInDollar;
        const referralPointReward =
          newAmount >= 1000 ? Math.floor(newAmount / 1000) : 0;
        if (referralPointReward > 0) {
          await db.user.findByIdAndUpdate(user.referredBy, {
            $inc: { refferalPoints: referralPointReward * 50 },
          });
          const remainingAmount = newAmount % 1000;
          updateUserQuery.$inc.tradeAmountForReferredBy =
            remainingAmount - (user?.tradeAmountForReferredBy || 0);
        } else {
          updateUserQuery.$inc.tradeAmountForReferredBy = amountInDollar;
        }
      }
      await db.user.findByIdAndUpdate(user._id, updateUserQuery);
      await incrementKeyInRedis(
        "totalFee",
        +Number(feeAmount).toFixed(6)
      ).catch((err) => {});
    }
  } catch (error) {
    console.log("🚀 ~ error:", error?.message);
  }
}

module.exports = {
  getSwapQuote,
  getEncodedDataWithPriorityFee,
  getEncodedDataWithJito,
  getSignature,
  waitForConfirmation,
  solanaPumpSwapRoutes,
  getSoalanaTokenBalance,
};
