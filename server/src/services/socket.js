const Message = require("../models/Message");

let io;

function initSocket(server) {
  const { Server } = require("socket.io");
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    // Auto-join user's personal room for direct notifications
    const userId = socket.handshake.query.userId;
    if (userId) {
      socket.join(userId);
    }

    // Customer + Driver both join booking room for real-time updates
    socket.on("join:booking", ({ bookingId }) => {
      if (bookingId) socket.join(bookingId);
    });

    // Join personal user room (called explicitly from client)
    socket.on("join:user", ({ userId: uid }) => {
      if (uid) socket.join(uid);
    });

    // Driver emits location — broadcast to booking room EXCEPT sender
    socket.on("driver:location_update", ({ bookingId, lat, lng }) => {
      if (!bookingId) return;
      socket.to(bookingId).emit("driver:location", { lat, lng, bookingId });
    });

    // Chat message — save to DB then broadcast to whole room
    socket.on("message:send", async ({ bookingId, senderId, content }) => {
      if (!bookingId || !senderId || !content) return;
      try {
        const msg = await Message.create({
          bookingId,
          senderId,
          content,
          type: "text",
        });
        io.to(bookingId).emit("message:new", { message: msg });
      } catch (err) {
        console.error("Socket message:send error:", err.message);
      }
    });

    socket.on("disconnect", () => {});
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket server not initialized");
  }
  return io;
}

module.exports = {
  initSocket,
  getIO,
};
