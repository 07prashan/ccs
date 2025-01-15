// models/Category.js
const mongoose = require('mongoose');

// Define the Category Schema
const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },         // Name of the category (e.g., Waste Issue, Electricity Issue)
    description: { type: String, required: true },  // Description of the category
}, { timestamps: true });  // Automatically adds createdAt and updatedAt fields

// Create the model
const Category = mongoose.model('Category', categorySchema);

// Export the model
module.exports = Category;
