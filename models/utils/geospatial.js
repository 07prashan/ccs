// utils/geospatial.js
const Department = require('../models/Department');
const geohash = require('geohash');

async function findNearestDepartment(category, longitude, latitude) {
  const precision = 6; // Geohash precision (adjust based on your needs)
  const hash = geohash.encode(latitude, longitude, precision); // Generate geohash for the complaint location

  // Find departments with the same geohash prefix
  const nearestDepartment = await Department.aggregate([
    {
      $match: {
        category: category, // Filter by category
        geohash: { $regex: `^${hash}` }, // Match geohash prefix
      },
    },
    {
      $addFields: {
        distance: {
          $sqrt: {
            $add: [
              { $pow: [{ $subtract: ['$location.coordinates[0]', longitude] }, 2] },
              { $pow: [{ $subtract: ['$location.coordinates[1]', latitude] }, 2] },
            ],
          },
        },
      },
    },
    { $sort: { distance: 1 } }, // Sort by distance
    { $limit: 1 }, // Limit to the nearest department
  ]);

  return nearestDepartment[0]; // Return the nearest department
}

module.exports = { findNearestDepartment };