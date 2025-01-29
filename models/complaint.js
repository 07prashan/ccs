const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  complaintNumber: { type: String, required: true },
  ComplainantName: { type: String, required: true },
  category: { type: String, required: true },
  urgency: { type: String, required: true, default: 'Medium' },
  description: { type: String, required: true },
  location: { type: String, required: true }, // Name of the location
  latitude: { type: Number, required: true }, // Latitude of the location
  longitude: { type: Number, required: true }, // Longitude of the location
  mapLink: { type: String, required: true }, // Direct map link
  file: { type: String },
  regDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["Not Processed Yet", "In Process", "Closed Complaint"],
    default: "Not Processed Yet",
  },
});

const Complaint = mongoose.model("Complaint", complaintSchema);

module.exports = Complaint;
