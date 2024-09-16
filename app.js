const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ filePath: `/uploads/${req.file.filename}` });
});

app.get('/chat', (req, res) => {
  const { username, room } = req.query;
  res.render('chat', { username, room });
});

// Socket.io setup
io.on('connection', (socket) => {
  console.log('New user connected');

  socket.on('joinRoom', ({ username, room }) => {
    socket.join(room);
    socket.broadcast.to(room).emit('joinNotification', `${username} has joined the chat`);

    socket.on('chatMessage', (data) => {
      io.to(room).emit('message', data);
    });

    socket.on('typing', (username) => {
      socket.broadcast.to(room).emit('typing', username);
    });

    socket.on('stopTyping', () => {
      socket.broadcast.to(room).emit('stopTyping');
    });

    socket.on('disconnect', () => {
      io.to(room).emit('message', { username: 'System', message: `${username} has left the chat` });
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));