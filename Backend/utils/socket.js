const http = require('http');
const socketIo = require('socket.io');
function setupSocket(server) {
    const io = socketIo(server, {
        pingTimeout: 60000,
        cors: {
            origin: process.env.CLIENT_URL,
        },
    });

    io.on('connection', (socket) => {
        console.log('🟢 user is connected');
        // Handle notifications here, emit to the client
        socket.on('notification', (data) => {
            try {
                // Your notification handling logic here
                io.emit('notification', data);
            } catch (error) {
                console.error('Error handling notification:', error);
            }
        });
        socket.on('comment', (data) => {
            try {
                // Your messages handling logic here
                io.emit('comment', data);
            } catch (error) {
                console.error('Error handling comments:', error);
            }
        });
        socket.on('disconnect', () => {
            console.log('🔴 User disconnected');
        });
    });
    // Handle any server-level errors
    io.on('error', (error) => {
        console.error('WebSocket server error:', error);
    });
    return io;
}

module.exports = { setupSocket };