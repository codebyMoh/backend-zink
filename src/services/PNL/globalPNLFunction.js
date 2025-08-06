const { handleBuyInFifo } = require("./handleBuy");
const { handleSellInFifo } = require("./handleSell");

async function globalPnlFunction(txDetails, type) {
  if (type == "buy") {
    await handleBuyInFifo(txDetails);
  } else {
    await handleSellInFifo(txDetails);
  }
}
module.exports = { globalPnlFunction };
