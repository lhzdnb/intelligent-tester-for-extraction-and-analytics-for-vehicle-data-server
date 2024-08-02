const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const socketIo = require('socket.io');

const io = new socketIo.Server(server, {
  cors: {
    origin: "*",
  }
});

let index = 0;
let data = [];
let jsonData = [];
let currentFile = 'ok_output.json';

const loadData = (file) => {
  const filePath = path.join(__dirname, 'public', file);
  fs.readFile(filePath, 'utf8', (err, fileData) => {
    if (err) {
      console.error(err);
      return;
    }
    try {
      jsonData = JSON.parse(fileData);
      console.log(`Loaded ${file}`);
    } catch (err) {
      console.error(err);
    }
  });
};

loadData(currentFile);

io.on('connection', (socket) => {
  console.log('connected');

  const sendData = () => {
    if (index >= jsonData.length) {
      index = 0;
    }
    if (data.length === 0) {
      data = jsonData[index].slice(-jsonData[index].length / 4);
      index++;
    }
    socket.emit('data', data.shift());
  };

  let interval = setInterval(() => {
    if (!socket.isPaused) {
      sendData();
    }
  }, 1000);

  socket.on('pause', () => {
    socket.isPaused = true;
  });

  socket.on('resume', () => {
    socket.isPaused = false;
  });

  socket.on('changeDataType', (type) => {
    if (type === 'ok') {
      currentFile = 'ok_output.json';
    } else if (type === 'nok') {
      currentFile = 'nok_output.json';
    }
    loadData(currentFile);
    index = 0;
    data = [];
  });

  socket.on('disconnect', () => {
    console.log('disconnected');
    clearInterval(interval);
    index = 0;
  });
});

const port = 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
