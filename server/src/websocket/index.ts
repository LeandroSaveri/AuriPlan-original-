// ============================================
// WEBSOCKET SERVER - Colaboração em Tempo Real
// ============================================

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface CursorPosition {
  x: number;
  y: number;
}

interface User {
  id: string;
  name: string;
  color: string;
}

const userColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

export function setupWebSocket(io: Server) {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true },
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as User;
    console.log(`User connected: ${user.name} (${socket.id})`);

    // Join project room
    socket.on('join-project', async (projectId: string) => {
      // Check permission
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { ownerId: user.id },
            { collaborators: { some: { userId: user.id } } },
          ],
        },
      });

      if (!project) {
        socket.emit('error', { message: 'Project not found or no permission' });
        return;
      }

      socket.join(projectId);

      const color = userColors[Math.floor(Math.random() * userColors.length)];
      socket.data.color = color;

      // Notify others
      socket.to(projectId).emit('user-joined', {
        userId: user.id,
        name: user.name,
        color,
        socketId: socket.id,
      });

      // Send current users in room
      const room = io.sockets.adapter.rooms.get(projectId);
      const usersInRoom: Array<{ socketId: string; name: string; color: string }> = [];

      room?.forEach((socketId) => {
        const clientSocket = io.sockets.sockets.get(socketId);
        if (clientSocket && socketId !== socket.id) {
          usersInRoom.push({
            socketId,
            name: clientSocket.data.user.name,
            color: clientSocket.data.color,
          });
        }
      });

      socket.emit('users-in-room', usersInRoom);
    });

    // Leave project room
    socket.on('leave-project', (projectId: string) => {
      socket.leave(projectId);
      socket.to(projectId).emit('user-left', {
        userId: user.id,
        socketId: socket.id,
      });
    });

    // Cursor position update
    socket.on('cursor-move', (data: { projectId: string; position: CursorPosition }) => {
      socket.to(data.projectId).emit('cursor-update', {
        userId: user.id,
        name: user.name,
        color: socket.data.color,
        position: data.position,
      });
    });

    // Entity updates
    socket.on('entity-update', (data: { 
      projectId: string; 
      type: 'wall' | 'room' | 'furniture';
      action: 'create' | 'update' | 'delete';
      data: any;
    }) => {
      socket.to(data.projectId).emit('entity-updated', {
        userId: user.id,
        name: user.name,
        ...data,
      });
    });

    // Selection updates
    socket.on('selection-change', (data: {
      projectId: string;
      selectedIds: string[];
    }) => {
      socket.to(data.projectId).emit('selection-updated', {
        userId: user.id,
        name: user.name,
        selectedIds: data.selectedIds,
      });
    });

    // Chat messages
    socket.on('chat-message', (data: {
      projectId: string;
      message: string;
    }) => {
      io.to(data.projectId).emit('chat-message', {
        userId: user.id,
        name: user.name,
        message: data.message,
        timestamp: new Date().toISOString(),
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.name} (${socket.id})`);

      // Notify all rooms
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.to(room).emit('user-left', {
            userId: user.id,
            socketId: socket.id,
          });
        }
      });
    });
  });
}
