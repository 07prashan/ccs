const tf = require('@tensorflow/tfjs-node');
const natural = require('natural');
const trainingData = require('./training-data');
const { preprocessText } = require('./text-preprocessor');

// Convert text to TF-IDF vectors
const tfidf = new natural.TfIdf();
const documents = trainingData.map(item => preprocessText(item.text));
documents.forEach(doc => tfidf.addDocument(doc));

// Convert labels to numerical values
const urgencyLevels = { High: 0, Medium: 1, Low: 2 };
const labels = trainingData.map(item => urgencyLevels[item.urgency]);

// Convert to TensorFlow tensors
const features = documents.map(doc => {
  const vector = new Array(100).fill(0); // Adjust size based on vocabulary
  tfidf.listTerms(documents.indexOf(doc)).forEach(term => {
    vector[term.termIndex] = term.tfidf;
  });
  return vector;
});

const model = tf.sequential({
  layers: [
    tf.layers.dense({ inputShape: [100], units: 32, activation: 'relu' }),
    tf.layers.dense({ units: 3, activation: 'softmax' })
  ]
});

model.compile({
  optimizer: 'adam',
  loss: 'sparseCategoricalCrossentropy',
  metrics: ['accuracy']
});

// Train model
async function trainModel() {
  await model.fit(
    tf.tensor2d(features),
    tf.tensor1d(labels, 'int32'),
    {
      epochs: 50,
      validationSplit: 0.2
    }
  );
  await model.save('file://./ai/model');
}

trainModel();