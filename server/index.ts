const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST"],
  credentials: true
}));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

io.on("connection", (socket) => {
  console.log('User connected:', socket.id);
  
  socket.emit("me", socket.id);

  socket.on("disconnect", () => {
    console.log('User disconnected:', socket.id);
    socket.broadcast.emit("callEnded");
  });

  socket.on("callUser", ({ userToCall, signalData, from, isVideo }) => {
    console.log(`Call request from ${from} to ${userToCall}`);
    io.to(userToCall).emit("callUser", { signal: signalData, from, isVideo });
  });

  socket.on("answerCall", (data) => {
    console.log(`Call answered by ${data.to}`);
    io.to(data.to).emit("callAccepted", data.signal);
  });

  socket.on("rejectCall", (data) => {
    console.log(`Call rejected by ${data.from}`);
    io.to(data.from).emit("callRejected");
  });

  socket.on("error", (error) => {
    console.error('Socket error:', error);
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 