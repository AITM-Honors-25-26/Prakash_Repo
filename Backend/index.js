import app from "./src/config/express.config.js";
import http from "http";
import { Server } from "socket.io";
import "./src/queues/email.worker.js"


const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://192.168.1.64:5173",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("A client connected via WebSocket. ID:", socket.id);

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