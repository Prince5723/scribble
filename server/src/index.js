const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// Read port from environment variable, fallback to 3000 for local development
const PORT = process.env.PORT || 3000;

// Create Express application instance
const app = express();

// Create HTTP server using Node's built-in http module
const server = http.createServer(app);

app.use(express.static('../client'));

// Attach Socket.IO to the HTTP server with CORS configuration
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST"], // Standard methods for WebSocket handshake
    credentials: false // No credentials needed for this application
  }
});


// Start the HTTP server and listen on the configured port
// Error handling ensures graceful failure with clear error messages
server.listen(PORT, (error) => {
  if (error) {
    console.error('[STARTUP ERROR] Failed to start server:', error.message);
    process.exit(1); // Exit with error code
  }
  
  console.log(`[SERVER] Backend server running on port ${PORT}`);
  console.log(`[SERVER] Socket.IO ready for connections`);
});


// Handle process termination signals for graceful shutdown
// This ensures connections are properly closed before the process exits
const gracefulShutdown = (signal) => {
  console.log(`\n[SHUTDOWN] Received ${signal}, closing server gracefully...`);
  
  server.close(() => {
    console.log('[SHUTDOWN] HTTP server closed');
    io.close(() => {
      console.log('[SHUTDOWN] Socket.IO server closed');
      process.exit(0);
    });
  });

  // Force shutdown after 10 seconds if graceful shutdown hangs
  setTimeout(() => {
    console.error('[SHUTDOWN] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));


// Catch unhandled promise rejections to prevent silent failures
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

// Catch uncaught exceptions as a last resort
process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT EXCEPTION]', error);
  process.exit(1);
});