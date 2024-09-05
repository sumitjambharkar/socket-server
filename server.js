const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');
const http = require('http');

// Initialize Express app
const app = express();

// Use CORS middleware to allow cross-origin requests
app.use(cors());

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.IO to the server
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173","https://onehealthassist.com"],
    methods: ["GET", "POST"],
  }
});

// Setup a basic route
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

const emailToSocketMapping = new Map()
const socketIdToEmailMapping = new Map()

// Setup Socket.IO connection event
io.on('connection', (socket) => {   
  console.log('A user connected');
    socket.on("join-room", (data) => {
      const {email,userId}  = data;
      console.log(email + userId);
      emailToSocketMapping.set(email, socket.id);
      socketIdToEmailMapping.set(socket.id, email);
      
      io.to(userId).emit("userJoinedRoom",{email,id:socket.id})
      socket.join(userId)
      io.to(socket.id).emit("join-room",data)
      
    })

    socket.on("userCalled",({to,offer})=>{
      io.to(to).emit("incomingsCall",{from:socket.id,offer})
    })
    socket.on("callAccepted",({to,ans})=>{
        io.to(to).emit("callAccepted",{from:socket.id,ans})
    })

    socket.on("peer-negotiation-need",({to,offer})=>{
        io.to(to).emit("peer-negotiation-need",{from:socket.id,offer})
    })

    socket.on("negotiationneeded-done",({to,ans})=>{
        io.to(to).emit("negotiationneeded-final",{from:socket.id,ans})
    })
  // Handle disconnection
  socket.on('disconnect', () => {
    const email = socketIdToEmailMapping.get(socket.id);
    emailToSocketMapping.delete(email);
    socketIdToEmailMapping.delete(socket.id);
    console.log('A user disconnected');
  });
  
});

// Listen on a port
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
