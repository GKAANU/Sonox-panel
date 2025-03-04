import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://sonox.kaanuzun.com'
      : 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a room
  socket.on('join_room', (roomId: string) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Handle messages
  socket.on('send_message', (data: { room: string; message: any }) => {
    socket.to(data.room).emit('receive_message', data);
  });

  // Handle video calls
  socket.on('start_call', ({ to, offer }: { to: string; offer: any }) => {
    io.to(to).emit('call_received', { from: socket.id, offer });
  });

  socket.on('call_accepted', ({ to, answer }: { to: string; answer: any }) => {
    io.to(to).emit('call_accepted', { from: socket.id, answer });
  });

  socket.on('ice_candidate', ({ to, candidate }: { to: string; candidate: any }) => {
    io.to(to).emit('ice_candidate', { from: socket.id, candidate });
  });

  socket.on('end_call', ({ to }: { to: string }) => {
    io.to(to).emit('call_ended', { from: socket.id });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 