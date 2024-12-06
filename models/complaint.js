const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  complaintNumber: String,
  category: String,
  description: String,
  location: String,
  file: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  regDate: { type: Date, default: Date.now },
  status: { type: String, default: null },
});

const Complaint = mongoose.model("Complaint", complaintSchema);

module.exports = Complaint;
