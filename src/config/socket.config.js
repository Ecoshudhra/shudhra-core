const { Server } = require("socket.io");
const http = require("http");

let io;

const setupSocket = (app) => {
    const server = http.createServer(app);
    const allowedOrigins = [
        process.env.CLIENT_URL_ADMIN,
        process.env.CLIENT_URL_MUNICIPALITY,
        "http://localhost:5173",
        // todo : add for mobile app
    ].filter(Boolean);

    io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log("🟢 Client connected:", socket.id);

        socket.on("joinRoom", (room) => {
            socket.join(room);
            console.log(`⛪Socket ${socket.id} joined room: ${room}`);
        });

        socket.on("disconnect", () => {
            console.log("🔴 Client disconnected:", socket.id);
        });
    });


    app.set("io", io);
    app.set("server", server);
};

module.exports = setupSocket;
