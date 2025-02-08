const express = require('express');
const { exec } = require('child_process');
const http = require('http');
const { Server } = require('socket.io'); // Import socket.io
const ACTIONS = require('./src/Action'); // Your ACTION constants
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors()); // Allow cross-origin requests

const server = http.createServer(app);
const io = new Server(server); // Create a new instance of socket.io

const userSocketMap = {}; // Maps socket IDs to usernames

// Get all connected clients in a specific room
function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
        return {
            socketId,
            username: userSocketMap[socketId],
        };
    });
}

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Handle user joining a room
    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        if (!username) {
            console.error('Username is required to join a room');
            return;
        }

        userSocketMap[socket.id] = username; // Map username to the socket ID
        socket.join(roomId); // Join the specified room
        const clients = getAllConnectedClients(roomId);

        // Notify all clients in the room about the new connection
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });

    // Handle code changes
    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    // Handle code synchronization
    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    // Handle disconnection
    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });

        delete userSocketMap[socket.id]; // Remove user from mapping
    });

    // Ensure the user leaves all rooms on disconnection
    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
    });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
