const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true }, // e.g., 'police', 'municipality'
  location: {
    type: { type: String, enum: ['Point'], required: true, default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  }
});

// Create a geospatial index
DepartmentSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Department', DepartmentSchema);
