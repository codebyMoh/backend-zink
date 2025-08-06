//  minus hours function
const getDateMinus24Hours = (hours) => {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
};

// minus min function
const getDateMinusMinutes = async (minutes) => {
  const date = new Date();
  await date.setMinutes(date.getMinutes() - minutes);
  return await date.toISOString();
};

// check is the date, month and year is same or not
function isSameDate(timestamp1, timestamp2) {
  if (!timestamp1) {
    return false;
  }
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

// check is the same week or not like monday to monday or not
function isSameWeek(timestamp1, timestamp2) {
  if (!timestamp1) return false;

  const startOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  return startOfWeek(timestamp1) == startOfWeek(timestamp2);
}

// difference between two values
function getPercentageDifference(oldValue, newValue) {
  if (oldValue === 0) return 0; // prevent division by zero
  const difference =
    ((Number(newValue) - Number(oldValue)) / Number(oldValue)) * 100;
  return Number(difference.toFixed(5));
}

module.exports = {
  getDateMinus24Hours,
  getDateMinusMinutes,
  isSameDate,
  isSameWeek,
  getPercentageDifference,
};
