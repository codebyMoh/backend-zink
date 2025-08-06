const { Connection } = require("@solana/web3.js");
const { code } = require("../../constant/code");
const { db } = require("../model");
const { getPKInNumberFormate } = require("../services/generateSolWallet");
const {
  claimSolHandler,
} = require("../services/solanaTransactions/solTransfer");
const { apiResponse } = require("../utils/apiResponse");
const ThrowError = require("../utils/ThrowError");
const { default: axios } = require("axios");
const FEECOLLECTION_WALLET_PK = process.env.FEECOLLECTION_WALLET_PK;
const FEECOLLECTION_WALLET = process.env.WALLET_FOR_FEECOLLECTION;
const BQ_TOKEN = process.env.BITQUERY_API_KEY;

// leaderboard
async function leaderBoard(req, res) {
  const leaderBoardData = await db?.user
    .find({})
    .sort({ totalTradeAmount: -1 })
    .limit(50)
    .select("totalTradeAmount totalTrades email referralId createdAt");
  if (leaderBoardData?.length == 0) {
    return ThrowError(code.NOT_FOUND, "No records found.");
  }
  return apiResponse(res, code.SUCCESS, "Records found.", {
    leaderBoardData: leaderBoardData,
  });
}

// transaction history
async function transactionHistory(req, res) {
  const { page, limit } = req.params;
  if (!page || !limit) {
    return ThrowError(code.BAD_REQUEST, "Page ot Limit required.");
  }
  const user = req.user;
  const skip = (page - 1) * limit;
  const wallet = await user?.walletAddressSOL?.find((item) => item?.primary);
  const [transactionHistory, totalCount] = await Promise.all([
    db.transaction
      .find({
        userId: user._id,
        wallet: wallet.wallet,
      })
      .skip(skip)
      .limit(Number(limit))
      .select("-userId"),

    db.transaction.countDocuments({
      userId: user._id,
      wallet: wallet.wallet,
    }),
  ]);
  if (transactionHistory.length == 0) {
    return ThrowError(code.NOT_FOUND, "No records found.");
  }
  return apiResponse(res, code.SUCCESS, "Transaction fetched.", {
    transaction: transactionHistory,
    totalPage: Math.floor(totalCount / limit),
  });
}

// getSingleTokenlastAction
async function getSingleTokenlastAction(req, res) {
  const user = req.user;
  const { token, walletAddress } = req.params;
  if (!token || !walletAddress) {
    return ThrowError(
      code.BAD_REQUEST,
      "Token and wallet address is required."
    );
  }
  const documents = await db?.holdingsHistory
    ?.find({ userId: user?._id, token: token, wallet: walletAddress })
    .sort({ _id: -1 })
    .limit(1)
    .select("-_id -userId");

  if (documents?.length == 0) {
    return ThrowError(code.NOT_FOUND, "No last action found.");
  }
  return apiResponse(res, code.SUCCESS, "Last action found.", {
    lastAction: documents[0],
  });
}

// claim sol withraw handler
async function claimRewardsSolana(req, res) {
  const { address, amount } = req.body;
  if (!address || !amount) {
    return ThrowError(code.BAD_REQUEST, "All fields are required.");
  }
  const user = req.user;
  const mainWallet = getPKInNumberFormate(FEECOLLECTION_WALLET_PK.toString());
  // RPC connection
  const connection = new Connection(process.env.SOLANA_STAKE_RPC_URL, {
    commitment: "confirmed",
  });
  const signature = await claimSolHandler(
    connection,
    FEECOLLECTION_WALLET,
    address,
    amount,
    mainWallet
  );
  user.totalClaimed = Number(Number(user.totalClaimed + amount).toFixed(9));
  await user.save();
  await db?.claimSolana?.create({
    destWallet: address,
    userId: user?._id,
    chain: 101,
    amount: amount,
    tx: signature,
  });
  return apiResponse(res, code.SUCCESS, "Transaction successfull.", {
    tx: signature,
    amount: amount,
    address: address,
  });
}

// PNL
async function PNLSolana(req, res) {
  const { address } = req.params;
  if (!address) {
    return ThrowError(code.BAD_REQUEST, "Address is required.");
  }
  // moralis api call
  const rawHoldings = await axios.post(
    "https://streaming.bitquery.io/eap",
    {
      query: `query MyQuery {
  Solana {
    BalanceUpdates(
      orderBy: {descendingByField: "BalanceUpdate_Balance_maximum"}
     where: {BalanceUpdate: {Account: {Owner: {is: "${address}"}}, Currency: {MintAddress: {notIn: ["11111111111111111111111111111111","So11111111111111111111111111111111111111112"]}}}}
    ) {
      BalanceUpdate {
        Balance: PostBalance(maximum: Block_Slot)
        Currency {
          Name
          Symbol
          MintAddress
          Decimals
        }
        Account {
          Owner
        }
      }
    }
  }
}`,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BQ_TOKEN}`,
      },
    }
  );
  const direactHoldingsData = rawHoldings?.data?.data?.Solana?.BalanceUpdates;
  if (direactHoldingsData?.length == 0) {
    return ThrowError(code.NOT_FOUND, "No holdings found");
  }
  const holdings = await direactHoldingsData?.map(
    (item) => item?.BalanceUpdate?.Currency?.MintAddress
  );
  const transactions = await db?.fifoHoldings
    ?.find({
      token: {
        $in: holdings,
      },
      wallet: address,
    })
    .sort({ _id: -1 })
    .select("-_id -userId -wallet");
  if (transactions?.length == 0) {
    return ThrowError(code.NOT_FOUND, "No holdings found");
  }

  const holdedPnlToken = await transactions?.map((item) => `"${item?.token}"`);
  // call BQ api to get current_price
  const responseFromBq = await axios.post(
    "https://streaming.bitquery.io/eap",
    {
      query: `query {
    Solana {
      DEXTradeByTokens(
        where: {Trade: { Currency: { MintAddress: { in:[${holdedPnlToken}] } }}}
        orderBy: {descending: Block_Time}
        limitBy: {by: Trade_Currency_MintAddress, count: 1}
      ) {
        Trade {
          Currency {
            Symbol
            Name
            MintAddress
          }
          PriceInUSD
          Dex {
          	ProtocolName
            ProgramAddress
        	}
        }
      }
    }
  }`,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BQ_TOKEN}`,
      },
    }
  );
  const tokenPricesFromBq =
    responseFromBq?.data?.data?.Solana?.DEXTradeByTokens;
  let newPnlArray = [];
  // merge price and pnl object
  for (const element of transactions) {
    const findToken = tokenPricesFromBq.find(
      (item) => item?.Trade?.Currency?.MintAddress == element?.token
    );
    const tokenMetaData = direactHoldingsData.find(
      (item) => element?.token == item?.BalanceUpdate?.Currency?.MintAddress
    );
    if (findToken) {
      const newItemsObj = {
        ...element.toObject(),
        current_price: findToken?.Trade?.PriceInUSD || 0,
        chainBalance: Number(tokenMetaData?.BalanceUpdate?.Balance),
        decimals: tokenMetaData?.BalanceUpdate?.Currency?.Decimals,
        programAddress: findToken?.Trade?.Dex?.ProgramAddress,
      };
      newPnlArray = [...newPnlArray, newItemsObj];
    }
  }
  return apiResponse(res, code.SUCCESS, "Records found.", {
    pnl: newPnlArray,
  });
}

// PNL history
async function PNLHistory(req, res) {
  const { address } = req.params;
  if (!address) {
    return ThrowError(code.BAD_REQUEST, "Address is required.");
  }

  const PNLHistory = await db?.holdingsHistory
    ?.find({ wallet: address })
    .sort({
      _id: -1,
    })
    .limit(100)
    .select("-_id -userId -wallet -updatedAt");
  if (PNLHistory?.length == 0) {
    return ThrowError(code.NOT_FOUND, "No records found.");
  }
  return apiResponse(res, code.SUCCESS, "Records found.", {
    pnlHistory: PNLHistory,
  });
}
// PNLHistoryTop
async function PNLHistoryTop(req, res) {
  const { address } = req.params;
  if (!address) {
    return ThrowError(code.BAD_REQUEST, "Address is required.");
  }

  const PNLHistory = await db?.holdingsHistory
    ?.find({ wallet: address })
    .sort({
      pnlPercentage: -1,
    })
    .limit(100)
    .select("-_id -userId -wallet -updatedAt");
  if (PNLHistory?.length == 0) {
    return ThrowError(code.NOT_FOUND, "No records found.");
  }
  return apiResponse(res, code.SUCCESS, "Records found.", {
    pnlHistory: PNLHistory,
  });
}

// pnl for particuler token
async function getPnlForParticulerUserForSingleToken(req, res) {
  const user = req.user;
  const { token, walletAddress } = req.params;
  if (!token || !walletAddress) {
    return ThrowError(
      code.BAD_REQUEST,
      "Token and wallet address is required."
    );
  }
  const singleTokenPnl = await db?.fifoHoldings
    ?.findOne({
      userId: user?._id,
      token: token,
      wallet: walletAddress,
    })
    .select("-lots");
  if (!singleTokenPnl) {
    return ThrowError(code.NOT_FOUND, "Token PNL not found.");
  }
  return apiResponse(res, code.SUCCESS, "Token PNL.", {
    token: singleTokenPnl,
  });
}

// PNLPerformance handler
async function PNLPerformance(req, res) {
  const { address } = req.params;
  if (!address) {
    return ThrowError(code.BAD_REQUEST, "Wallet address is required.");
  }
  const user = await db?.user?.findOne({
    walletAddressSOL: {
      $elemMatch: {
        wallet: address,
      },
    },
  });
  if (!user) {
    return ThrowError(code.BAD_REQUEST, "user not found.");
  }
  const promiseResult = await Promise.all([
    db?.realizedPnlHistory
      ?.find({
        userId: user?._id,
        wallet: address,
      })
      .select("-updatedAt -_id -userId"),
    db?.holdingsHistory?.aggregate([
      {
        $match: { wallet: address },
      },
      {
        $bucket: {
          groupBy: "$pnlPercentage",
          boundaries: [-Infinity, -50, 0, 200, 500, Infinity],
          default: "Other",
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ]),
  ]);
  return apiResponse(res, code.SUCCESS, "Performance fetch", {
    performance: {
      totalPNL: user?.realizedPnl,
      buys: user?.buysTradeCount,
      sells: user?.sellsTradeCount,
      chartPnlHistory: promiseResult?.[0]?.length > 0 ? promiseResult?.[0] : [],
      performance: promiseResult?.[1],
    },
  });
}
module.exports = {
  leaderBoard,
  transactionHistory,
  claimRewardsSolana,
  PNLSolana,
  PNLHistory,
  PNLHistoryTop,
  PNLPerformance,
  getPnlForParticulerUserForSingleToken,
  getSingleTokenlastAction,
};
