const Booking = require("../models/Booking");
const { getIO } = require("./socket");

function startBookingExpiryJob() {
  setInterval(async () => {
    const threshold = new Date(Date.now() - 5 * 60 * 1000);
    const staleBookings = await Booking.find({
      status: "pending",
      createdAt: { $lte: threshold },
    });

    if (!staleBookings.length) return;

    for (const booking of staleBookings) {
      booking.status = "cancelled";
      await booking.save();
      getIO().to(String(booking.customerId)).emit("booking:status_update", {
        bookingId: booking.bookingId,
        status: "cancelled",
      });
    }
  }, 60 * 1000);
}

module.exports = startBookingExpiryJob;
