const { predictUrgency } = require('./predict-urgency');

(async () => {
  const testComplaint = "Water pipe burst flooding streets";
  const urgency = await predictUrgency(testComplaint);
  console.log(`Predicted Urgency: ${urgency}`);
})();