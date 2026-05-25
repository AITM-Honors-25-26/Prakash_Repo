import app from "./src/config/express.config.js";
import http from "http";
import { Server } from "socket.io"; 

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000", 
    methods: ["GET", "POST"]
  }
});

// 2. Set up all your Socket listeners
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

// 3. Start listening LAST
httpServer.listen(9005, "0.0.0.0", (err) => {
    if(!err){
        console.log("Server is running on port: ", 9005);
        console.log("Press CTRL + C to discontinue the code......");
    }
});