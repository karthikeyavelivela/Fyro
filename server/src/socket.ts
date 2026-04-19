import { Server, Socket } from 'socket.io';
import logger from './utils/logger';

const setupSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
      logger.info(`User ${userId} joined room user:${userId}`);
    });

    socket.on('join:booking', (bookingId: string) => {
      socket.join(`booking:${bookingId}`);
      logger.info(`Joined booking room booking:${bookingId}`);
    });

    socket.on('driver:location_update', (data: { bookingId: string, lat: number, lng: number }) => {
      // Rebroadcast to booking room
      socket.to(`booking:${data.bookingId}`).emit('driver:location', data);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};

export default setupSocket;
