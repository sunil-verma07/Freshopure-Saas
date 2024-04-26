// socket.js

const socketIo = require('socket.io');

let io;

const initWebSocket = (server) => {
  io = socketIo(server);

  io.on('connection', (socket) => {
    console.log('Expo app client connected');

    socket.on('disconnect', () => {
      console.log('Expo app client disconnected');
    });
  });
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = {
  initWebSocket,
  getIo,
};
