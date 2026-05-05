require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join_personal_room', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their personal room: user_${userId}`);
    }
  });

  socket.on('send_message', (payload) => {
    const { senderId, receiverId, text } = payload;
    const message = {
      senderId: senderId || null,
      receiverId: receiverId || null,
      text: text || '',
      sentAt: new Date().toISOString()
    };

    if (receiverId) {
      // Send to receiver's room
      io.to(`user_${receiverId}`).emit('receive_message', message);
      // Also send back to sender for their UI
      socket.emit('receive_message', message);
    } else {
      // Fallback: broadcast to everyone if no specific receiver
      io.emit('receive_message', message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
