import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

interface CallData {
  userToCall: string;
  signalData: any;
  from: string;
  isVideo: boolean;
}

interface AnswerCallData {
  signal: any;
  to: string;
}

interface RejectCallData {
  from: string;
}

const app = express();
const httpServer = createServer(app);

const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://sonox.kaanuzun.com'] 
  : ['http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  credentials: true
}));

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket']
});

io.on("connection", (socket: Socket) => {
  console.log('User connected:', socket.id);
  
  socket.emit("me", socket.id);

  socket.on("disconnect", () => {
    console.log('User disconnected:', socket.id);
    socket.broadcast.emit("callEnded");
  });

  socket.on("callUser", ({ userToCall, signalData, from, isVideo }: CallData) => {
    console.log(`Call request from ${from} to ${userToCall}`);
    io.to(userToCall).emit("callUser", { signal: signalData, from, isVideo });
  });

  socket.on("answerCall", (data: AnswerCallData) => {
    console.log(`Call answered by ${data.to}`);
    io.to(data.to).emit("callAccepted", data.signal);
  });

  socket.on("rejectCall", (data: RejectCallData) => {
    console.log(`Call rejected by ${data.from}`);
    io.to(data.from).emit("callRejected");
  });

  socket.on("error", (error: Error) => {
    console.error('Socket error:', error);
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 