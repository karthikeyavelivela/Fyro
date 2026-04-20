import { Server, Socket } from 'socket.io';
import logger from './utils/logger';

const readRoomValue = (value: unknown, key: 'userId' | 'bookingId') => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && typeof (value as Record<string, unknown>)[key] === 'string') {
    return String((value as Record<string, unknown>)[key]);
  }
  return '';
};

const setupSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join:user', (payload: string | { userId?: string }) => {
      const userId = readRoomValue(payload, 'userId');
      if (!userId) return;
      socket.join(`user:${userId}`);
      socket.join(userId);
      logger.info(`User ${userId} joined personal rooms`);
    });

    socket.on('join:booking', (payload: string | { bookingId?: string }) => {
      const bookingId = readRoomValue(payload, 'bookingId');
      if (!bookingId) return;
      socket.join(`booking:${bookingId}`);
      socket.join(bookingId);
      logger.info(`Joined booking rooms for ${bookingId}`);
    });

    socket.on('driver:location_update', (data: { bookingId: string, lat: number, lng: number }) => {
      if (!data?.bookingId) return;
      socket.to(`booking:${data.bookingId}`).emit('driver:location', data);
      socket.to(data.bookingId).emit('driver:location', data);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};

export default setupSocket;
