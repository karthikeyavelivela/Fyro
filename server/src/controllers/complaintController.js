const Booking = require("../models/Booking");
const Complaint = require("../models/Complaint");
const asyncHandler = require("../utils/asyncHandler");
const { ok, fail } = require("../utils/response");
const { generateComplaintId } = require("../utils/ids");
const { getIO } = require("../services/socket");

const createComplaint = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.body.bookingId);
  if (!booking) return fail(res, "Booking not found", 404);

  const complaint = await Complaint.create({
    complaintId: await generateComplaintId(),
    bookingId: booking._id,
    raisedBy: req.user._id,
    againstUser: booking.providerId,
    category: req.body.category,
    description: req.body.description,
    attachments: req.body.attachments || [],
  });

  booking.hasComplaint = true;
  await booking.save();

  return ok(res, { complaint }, "Complaint raised", 201);
});

const getMyComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find({ raisedBy: req.user._id }).populate("bookingId againstUser");
  return ok(res, { complaints }, "Complaint history");
});

const getComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id).populate("bookingId raisedBy againstUser");
  if (!complaint) return fail(res, "Complaint not found", 404);
  return ok(res, { complaint }, "Complaint detail");
});

const updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
      adminNote: req.body.adminNote,
      resolvedAt: ["resolved", "rejected"].includes(req.body.status) ? new Date() : undefined,
    },
    { new: true }
  );
  if (!complaint) return fail(res, "Complaint not found", 404);

  getIO().to(String(complaint.raisedBy)).emit("complaint:updated", { complaintId: complaint.complaintId, status: complaint.status });
  return ok(res, { complaint }, "Complaint updated");
});

module.exports = {
  createComplaint,
  getMyComplaints,
  getComplaint,
  updateComplaint,
};
