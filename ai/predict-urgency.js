// const tf = require('@tensorflow/tfjs-node')
const natural = require('natural');
const path = require('path');
const { preprocessText } = require('./text-preprocessor');

let model;
let tfidf;

async function loadModel() {
  const modelPath = path.resolve(__dirname, 'ai/model/model.json'); // ✅ Absolute path
  console.log("Loading model from:", `file://${modelPath}`); // Debugging line

  model = await tf.loadLayersModel(`file://${modelPath}`); // ✅ Correct file path format

  // Initialize TF-IDF with training data vocabulary
  const trainingData = require('./training-data');
  tfidf = new natural.TfIdf();
  trainingData.forEach(item => tfidf.addDocument(preprocessText(item.text)));
}

function textToVector(text) {
  const processedText = preprocessText(text);
  const vector = new Array(100).fill(0);
  tfidf.tfidfs(processedText, (i, measure) => {
    vector[i] = measure;
  });
  return vector;
}

async function predictUrgency(complaintText) {
  if (!model) await loadModel();
  
  const vector = textToVector(complaintText);
  const prediction = model.predict(tf.tensor2d([vector]));
  const values = await prediction.data();
  const urgencyIndex = values.indexOf(Math.max(...values));
  
  return ['Critical','High', 'Medium', 'Low'][urgencyIndex];
}

module.exports = { predictUrgency };
