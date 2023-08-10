const http = require("http");
const express = require("express");
const socketIO = require("socket.io");
const cors = require("cors");

const app = express();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3001;

const roomViewers = {}; // Object to store room viewer counts

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("joinRoom", (roomName) => {
    console.log(roomName);
    socket.join(roomName);

    // Increment the viewer count for the joined room
    roomViewers[roomName] = (roomViewers[roomName] || 0) + 1;

    // Emit the updated viewer count to all clients in the room
    io.to(roomName).emit("viewerCountUpdate", roomViewers[roomName]);
  });

  socket.on("disconnecting", () => {
    // Decrement the viewer count for each room the user is disconnecting from
    for (const roomName of socket.rooms) {
      if (roomName !== socket.id) {
        roomViewers[roomName] = Math.max((roomViewers[roomName] || 0) - 1, 0);

        // Emit the updated viewer count to all clients in the room
        io.to(roomName).emit("viewerCountUpdate", roomViewers[roomName]);
      }
    }
  });

  socket.on("message", (data) => {
    console.log("Message received:", data);
    io.to(data.room).emit("message", data);
  });

  socket.on("editorChange", (data) => {
    // Broadcast the content change to all connected clients in the room
    socket.to(data.room).emit("editorChange", data.content);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// io.on("connection", (socket) => {
//   console.log("A user connected");

//   socket.on("message", (data) => {
//     console.log("Message received:", data);
//     io.emit("message", data);
//   });

//   socket.on("editorChange", (content) => {
//     // Broadcast the content change to all connected clients except the sender
//     socket.broadcast.emit("editorChange", content);
//   });

//   socket.on("disconnect", () => {
//     console.log("A user disconnected");
//   });
// });

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
