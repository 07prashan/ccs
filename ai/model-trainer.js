const natural = require("natural");
const trainingData = require("./training-data");
const preprocessText = require("./text-preprocessor");

const tfidf = new natural.TfIdf();
trainingData.forEach(({ text }) => tfidf.addDocument(preprocessText(text).join(" ")));

// Function to predict urgency based on similarity
function predictUrgency(complaintText) {
    let processedComplaint = preprocessText(complaintText).join(" ");
    let maxScore = 0;
    let predictedUrgency = "low";

    trainingData.forEach(({ text, urgency }, index) => {
        let score = tfidf.tfidf(processedComplaint, index);
        if (score > maxScore) {
            maxScore = score;
            predictedUrgency = urgency;
        }
    });

    return predictedUrgency;
}

module.exports = predictUrgency;
