const mongoose = require("mongoose");

// Complaint Schema
const complaintSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  complaintNumber: { type: String, required: true, unique: true },
  complainantName: { type: String, required: true },
  category: { type: String, required: true },
  urgency: {
    type: String,
    enum: ["critical", "high", "medium", "low"],
    default: "medium"
  },
  urgencyDetails: {
    priority: Number,
    responseTime: String,
    description: String
  },
  description: { type: String, required: true },
  location: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  mapLink: { type: String, required: true },
  file: { type: String },
  regDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["Not Processed Yet", "In Process", "Closed Complaint"],
    default: "Not Processed Yet"
  }
  
});

// Pre-save hook to auto-generate complaint number and compute urgency
complaintSchema.pre("save", async function (next) {
  const doc = this;

  // Auto-generate Complaint Number (CMP1, CMP2, CMP3...)
  if (!doc.complaintNumber) {
    const lastComplaint = await Complaint.findOne().sort({ regDate: -1 }).select("complaintNumber");

    let newComplaintNumber = 1;
    if (lastComplaint && lastComplaint.complaintNumber) {
      const lastNumber = parseInt(lastComplaint.complaintNumber.replace("CMP", ""), 10);
      if (!isNaN(lastNumber)) {
        newComplaintNumber = lastNumber + 1;
      }
    }

    doc.complaintNumber = `CMP${newComplaintNumber}`;
  }

  // Ensure Complainant Name is Assigned
  if (!doc.complainantName && doc.userId) {
    const user = await mongoose.model("User").findById(doc.userId);
    if (user && user.first_name && user.last_name) {
      doc.complainantName = `${user.first_name} ${user.last_name}`;
    } else {
      doc.complainantName = "Unknown User";
    }
  }

  // Compute Urgency Based on Description
  if (doc.description) {
    doc.urgency = computeUrgency(doc.description);
    doc.urgencyDetails = getUrgencyDetails(doc.urgency);
  }

  next();
});

// Function to compute urgency based on description
function computeUrgency(description) {
  if (!description || typeof description !== "string") return "medium";

  const text = description.toLowerCase();

  const criticalKeywords = ["life-threatening", "catastrophic", "critical failure", "severe disaster"];
  const highKeywords = ["emergency", "danger", "urgent", "immediate", "severe", "unsafe", "electrocution", "explosion"];
  const mediumKeywords = ["problem", "issue", "broken", "damaged", "not working", 
    "water", "electricity", "leak", "power outage", "blackout", "flooded"];
  const lowKeywords = ["minor", "small", "slight", "cosmetic", "inconvenience"];

  if (criticalKeywords.some(keyword => text.includes(keyword))) return "critical";
  if (highKeywords.some(keyword => text.includes(keyword))) return "high";
  if (mediumKeywords.some(keyword => text.includes(keyword))) return "medium";
  if (lowKeywords.some(keyword => text.includes(keyword))) return "low";

  return "medium"; // Default urgency
}

// Function to generate urgency details based on urgency level
function getUrgencyDetails(urgency) {
  const urgencyLevels = {
    critical: { priority: 1, responseTime: "Immediate", description: "Requires urgent action due to severe consequences." },
    high: { priority: 2, responseTime: "Within hour", description: "High priority, should be addressed quickly." },
    medium: { priority: 3, responseTime: "Within 3 days", description: "Moderate priority, requires attention soon." },
    low: { priority: 4, responseTime: "Within a week", description: "Minor issue, can be addressed later." }
  };

  return urgencyLevels[urgency] || urgencyLevels["medium"];
}

// Indexing for better query performance
complaintSchema.index({ latitude: 1, longitude: 1 });
complaintSchema.index({ "urgencyDetails.priority": 1 });

// Create the Complaint model
const Complaint = mongoose.model("Complaint", complaintSchema);

// Export the Complaint model
module.exports = { Complaint };
