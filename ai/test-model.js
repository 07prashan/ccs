const fetch = require('node-fetch');
global.fetch = fetch;
// const tf = require('@tensorflow/tfjs');
const { predictUrgency } = require('./predict-urgency');

(async () => {
  try {
    const testComplaint = "Water pipe burst flooding streets";
    const urgency = await predictUrgency(testComplaint);
    console.log(`Predicted Urgency: ${urgency}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
})();