const app = require('./app');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

// Tạo HTTP server
const server = http.createServer(app);

// Khởi tạo Socket.IO server
const io = new Server(server, {
  cors: { origin: '*' }, // Điều chỉnh theo frontend của bạn
});

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('MongoDB connected');

  // Lắng nghe kết nối socket
  io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // Người dùng join vào phòng riêng theo userId
  socket.on('joinRoom', (userId) => {
    socket.join(userId)
    console.log(`Socket ${socket.id} joined room ${userId}`)
  })

  // Gửi tin nhắn real-time
  socket.on('send-message', (msg) => {
    // msg: { senderId, recipientId, content }
    io.to(msg.recipientId).emit('receive-message', msg)
  })

  // >>> Thêm mới: đang nhập tin nhắn
  socket.on('typing', ({ senderId, recipientId }) => {
    io.to(recipientId).emit('typing', { from: senderId })
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})


  // Gắn io vào app để dùng ở các route
  app.set('io', io);

  // Bắt đầu server
  server.listen(3000, () => {
    console.log('Server on port 3000');
  });
});
