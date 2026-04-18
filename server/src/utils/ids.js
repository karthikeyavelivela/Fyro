const Booking = require("../models/Booking");
const Complaint = require("../models/Complaint");

async function nextSequentialId(prefix, model, field) {
  const year = new Date().getFullYear();
  const regex = new RegExp(`^${prefix}-${year}-`);
  const latest = await model.findOne({ [field]: regex }).sort({ createdAt: -1 });
  const current = latest?.[field]?.split("-").pop();
  const nextValue = String((Number(current || 0) + 1)).padStart(4, "0");
  return `${prefix}-${year}-${nextValue}`;
}

async function generateBookingId() {
  return nextSequentialId("FY", Booking, "bookingId");
}

async function generateComplaintId() {
  return nextSequentialId("CMP", Complaint, "complaintId");
}

module.exports = {
  generateBookingId,
  generateComplaintId,
};
