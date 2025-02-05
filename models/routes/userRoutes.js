// routes/userRoutes.js
const { findNearestDepartment } = require('../utils/geospatial');

router.post('/submit-complaint', upload.single('file'), async (req, res) => {
  const { category, description, longitude, latitude } = req.body;

  try {
    // Find the nearest department
    const nearestDepartment = await findNearestDepartment(category, parseFloat(longitude), parseFloat(latitude));

    if (!nearestDepartment) {
      throw new Error('No department found for the given category and location');
    }

    // Save the complaint with the assigned department
    const newComplaint = new Complaint({
      category,
      description,
      location: { type: 'Point', coordinates: [longitude, latitude] },
      assignedDepartment: nearestDepartment._id, // Assign the nearest department
      status: 'Pending',
    });

    await newComplaint.save();

    req.flash('success', 'Complaint submitted successfully!');
    res.redirect('/user/dashboard');
  } catch (error) {
    console.error('Error submitting complaint:', error);
    req.flash('error', 'Error submitting complaint. Please try again.');
    res.redirect('/post-complaint');
  }
});