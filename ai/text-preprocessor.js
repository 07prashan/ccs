const natural = require('natural');
const tokenizer = new natural.WordTokenizer();

// Text cleaning and tokenization
function preprocessText(text) {
  return tokenizer.tokenize(text)
    .map(token => natural.PorterStemmer.stem(token.toLowerCase()))
    .join(' ');
}

module.exports = { preprocessText };