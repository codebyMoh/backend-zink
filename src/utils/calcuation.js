function convertToDecimal(rawAmount, decimals) {
  if (rawAmount <= 0 || !decimals) return 0;
  const qty = rawAmount / Math.pow(10, decimals);
  return Number(qty);
}

module.exports = { convertToDecimal };
