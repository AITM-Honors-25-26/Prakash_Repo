import app from "./src/config/express.config.js";
import http from "http";
import { Server } from "socket.io";

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://192.168.1.64:5173",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Share io instance with Express so controllers can emit events via req.app.get('io')
app.set("io", io);

// Socket connection handlers
io.on("connection", (socket) => {
  console.log("A client connected via WebSocket. ID:", socket.id);

  // Staff/kitchen clients join a shared room to receive all order events
  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected. ID:", socket.id);
  });
});

// Start server last
httpServer.listen(9005, "0.0.0.0", (err) => {
  if (!err) {
    console.log("Server is running on port: 9005");
    console.log("Press CTRL + C to stop the server.");
  }
});