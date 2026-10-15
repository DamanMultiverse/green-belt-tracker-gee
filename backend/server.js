// ==============================================================================
// CORE SERVER SETUP
// Description: Main entry point for the Node.js/Express backend API
// ==============================================================================

// Import required modules
const express = require('express');
const cors = require('cors');

// Initialize the Express application
const app = express();

// Apply middleware
app.use(cors()); // Allow cross-origin requests from the React frontend
app.use(express.json()); // Parse incoming JSON payloads

// Define a basic health-check route to verify server status
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Green Belt Tracker API is running smoothly. 🌍'
    });
});

// Configure the server port
const PORT = process.env.PORT || 5000;

// Start the server and listen for incoming requests
app.listen(PORT, () => {
    console.log(`Server is successfully running on port ${PORT}`);
});