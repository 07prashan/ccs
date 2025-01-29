const tf = require('@tensorflow/tfjs-node');
const natural = require('natural');
const { preprocessText } = require('./text-preprocessor');

let model;
let tfidf;

async function loadModel() {
  model = await tf.loadLayersModel('file://./ai/model/model.json');
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
  
  return ['High', 'Medium', 'Low'][urgencyIndex];
}

module.exports = { predictUrgency };