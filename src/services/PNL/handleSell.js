const { db } = require("../../model");
const { getPercentageDifference } = require("../basicFunction");

async function handleSellInFifo(txDetails) {
  try {
    // information to calculate fifo PNL
    const {
      user,
      token,
      amount,
      tokenPrice,
      wallet,
      isSellFullAmount,
      metaData,
      solPrice,
    } = txDetails;
    //   find holdings
    const holdings = await db?.fifoHoldings?.findOne({
      userId: user?._id,
      token,
      wallet,
    });
    //   return if there is no holdings
    if (!holdings) return false;
    // qty to sell
    let qtyToSell = Number(amount);
    // realizedProfit
    let realizedProfit = 0;

    while (qtyToSell > 0 && holdings?.lots?.length > 0) {
      // pick first lot to minus qty
      const lot = holdings?.lots[0];
      // pick qty from lots one by one
      const sellQty = Math.min(qtyToSell, lot.qty);
      // calculate cost basis like if qty is not fullfill from 1 lot and calculate first lot cost
      const costBasis = sellQty * lot.price;
      // calculate revenue
      const revenue = sellQty * Number(tokenPrice);
      // calculate realized profts
      realizedProfit += revenue - costBasis;
      // minus qty from lot
      lot.qty -= sellQty;
      // minus qty from sellTokens
      qtyToSell -= sellQty;
      // remove If first  lot is emety
      if (lot.qty <= 0) {
        holdings.lots.shift();
      }
    }
    // add sell count
    const sellCount = holdings.sellCount || 0;
    const previousAvgSol = holdings.averageSolSellPrice || 0;
    // calculate solana averagePrice
    const newSolanaAveragePrice =
      (previousAvgSol * sellCount + Number(solPrice)) / (sellCount + 1);

    const previousQtySold = holdings.quantitySold || 0;
    const previousSellAvg = holdings.averageHistoricalSellPrice || 0;
    // old qty * old price
    const oldQtyCal = previousQtySold * previousSellAvg;
    // new qty * new price
    const newQtyCal = Number(amount) * Number(tokenPrice);
    // new and old total qty
    const qtyTotal = previousQtySold + Number(amount);
    // new average sell price
    const newAverageSellPrice = (oldQtyCal + newQtyCal) / qtyTotal;

    // update qty sold
    const updatedQuantitySold = Number(
      (Number(amount) - qtyToSell).toFixed(10)
    );
    // update realized profit
    const updatedRealizedProfit = Number(realizedProfit.toFixed(10));

    // update total buy amount
    const updatedTotalBuyAmount = Number(
      holdings?.lots?.reduce((sum, item) => sum + item?.qty * item?.price, 0)
    );
    // update average buy price
    const totalQty = holdings?.lots?.reduce((sum, lot) => sum + lot?.qty, 0);
    const updatedAverageBuyPrice =
      totalQty > 0 ? Number((updatedTotalBuyAmount / totalQty).toFixed(10)) : 0;
    // check if there is a fullsellamount then it will go to the active to history
    if (isSellFullAmount) {
      const totalRealizedPnl =
        Number(user?.realizedPnl || 0) +
        Number(holdings.realizedProfit || 0) +
        updatedRealizedProfit;

      await Promise.allSettled([
        db?.holdingsHistory?.create({
          userId: user?._id,
          wallet,
          token,
          realizedProfit: holdings.realizedProfit + updatedRealizedProfit,
          qty: previousQtySold + updatedQuantitySold,
          buyPrice: holdings.averageBuyPrice,
          sellPrice: newAverageSellPrice,
          solAvgPriceSell: newSolanaAveragePrice,
          solAvgPriceBuy: holdings?.averageSolBuyPrice,
          name: metaData?.name || null,
          symbol: metaData?.symbol || null,
          img: metaData?.img || null,
          pnlPercentage:
            getPercentageDifference(
              holdings.averageBuyPrice,
              newAverageSellPrice
            ) || 0,
        }),
        db?.realizedPnlHistory?.create({
          userId: user?._id,
          wallet,
          value: +totalRealizedPnl.toFixed(10),
        }),
        db?.user?.findByIdAndUpdate(user?._id, {
          $set: { realizedPnl: +totalRealizedPnl.toFixed(10) },
        }),
        holdings.deleteOne(),
      ]);
    } else {
      await db.fifoHoldings.findByIdAndUpdate(holdings._id, {
        $inc: {
          sellCount: 1,
          realizedProfit: updatedRealizedProfit,
          quantitySold: updatedQuantitySold,
        },
        $set: {
          lots: holdings.lots,
          totalBuyAmount: updatedTotalBuyAmount,
          averageBuyPrice: updatedAverageBuyPrice,
          averageHistoricalSellPrice: Number(newAverageSellPrice.toFixed(10)),
          averageSolSellPrice: Number(newSolanaAveragePrice.toFixed(10)),
        },
      });
    }
  } catch (error) {
    console.log("🚀 ~ handleSellInFifo ~ error:", error?.message);
  }
}

module.exports = { handleSellInFifo };
