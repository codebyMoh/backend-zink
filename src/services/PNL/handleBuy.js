const { db } = require("../../model");

async function handleBuyInFifo(txDetails) {
  try {
    const {
      user,
      token,
      amount,
      tokenPrice,
      amountInDollar,
      wallet,
      solPrice,
      metaData,
    } = txDetails;
    const rawQtyFromChain = metaData?.recAmoutnFromRoutes;
    const amountInToken = Number(amountInDollar) / Number(tokenPrice || 0);
    const formattedQty =
      rawQtyFromChain || Number(Number(amountInToken || 0).toFixed(10));
    const formattedPrice = Number(Number(tokenPrice || 0).toFixed(10));
    const formattedDollar = Number(Number(amountInDollar || 0).toFixed(10));
    const solanaPrice = Number(solPrice || 0);

    // define new lot
    const newLot = {
      qty: formattedQty,
      price: formattedPrice,
      solPrice: solanaPrice,
    };

    // try finding holdings
    const holdings = await db?.fifoHoldings?.findOne({
      userId: user?._id,
      token,
      wallet,
    });

    if (!holdings) {
      // create new holding
      await db?.fifoHoldings?.create({
        userId: user?._id,
        token,
        wallet,
        lots: [newLot],
        activeQtyHeld: formattedQty,
        totalBuyAmount: formattedDollar,
        averageBuyPrice: formattedPrice,
        averageSolBuyPrice: solanaPrice,
        name: metaData?.name || null,
        symbol: metaData?.symbol || null,
        img: metaData?.img || null,
      });
    } else {
      // calculate totalQty, weightedBuyAmount, and weightedSolBuyAmount from updated lots
      const updatedLots = [...holdings.lots, newLot];
      let totalQty = 0;
      let weightedBuyAmount = 0;
      let weightedSolBuyAmount = 0;

      for (const item of updatedLots) {
        totalQty += item.qty;
        weightedBuyAmount += item?.qty * item?.price || 0;
        weightedSolBuyAmount += item?.solPrice;
      }

      const avgBuyPrice =
        totalQty > 0 ? Number((weightedBuyAmount / totalQty).toFixed(10)) : 0;
      const avgSolBuyPrice =
        updatedLots.length > 0
          ? Number((weightedSolBuyAmount / updatedLots.length).toFixed(10))
          : 0;

      // perform atomic update
      await db?.fifoHoldings?.findByIdAndUpdate(holdings._id, {
        $push: { lots: newLot },
        $set: {
          averageBuyPrice: avgBuyPrice,
          averageSolBuyPrice: avgSolBuyPrice,
          totalBuyAmount: Number(weightedBuyAmount.toFixed(10)),
        },
        $inc: {
          activeQtyHeld: formattedQty,
        },
      });
    }
  } catch (error) {
    console.log("🚀 ~ handleBuyInFifo ~ error:", error?.message);
  }
}

module.exports = { handleBuyInFifo };
