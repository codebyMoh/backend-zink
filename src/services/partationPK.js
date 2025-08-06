function splitIntoThreeParts(str) {
  const len = str.length;
  const baseLen = Math.floor(len / 3);
  const remainder = len % 3;

  const part1Len = baseLen + (remainder > 0 ? 1 : 0);
  const part2Len = baseLen + (remainder > 1 ? 1 : 0);

  const part1 = str.slice(0, part1Len);
  const part2 = str.slice(part1Len, part1Len + part2Len);
  const part3 = str.slice(part1Len + part2Len);

  return [part1, part2, part3];
}

module.exports = { splitIntoThreeParts };
