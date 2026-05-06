const express = require('express');
const mongoose = require('mongoose');

// Initialize Express App
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/authRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const profileRoutes = require('./routes/profileRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', profileRoutes);

// Optional: Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

require('dotenv').config();

// Connect to MongoDB using the URI from .env
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected to Atlas via Node.js'))
    .catch(err => console.error('MongoDB Connection Error:', err));
} else {
  console.warn('⚠️ No MONGO_URI provided in .env, skipping MongoDB connection.');
}

const START_PORT = Number(process.env.PORT || 5000);
const MAX_PORT_RETRIES = 5;

function startServer(port, retriesLeft = MAX_PORT_RETRIES) {
  const server = app.listen(port, () => {
    console.log(`Node.js Backend is running on port ${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && retriesLeft > 0) {
      const nextPort = port + 1;
      console.warn(`Port ${port} is in use. Retrying on ${nextPort}...`);
      startServer(nextPort, retriesLeft - 1);
      return;
    }

    console.error('Server startup failed:', err);
    process.exit(1);
  });
}

startServer(START_PORT);

module.exports = app;
