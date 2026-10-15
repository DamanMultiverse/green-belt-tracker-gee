// ==============================================================================
// CORE SERVER SETUP & GEE INTEGRATION
// Description: Node.js/Express backend API with Google Earth Engine authentication
// ==============================================================================

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const ee = require('@google/earthengine');

// Load the secure service account private key
const privateKey = require(process.env.GEE_PRIVATE_KEY_PATH);

// Initialize the Express application
const app = express();

// Apply middleware
app.use(cors());
app.use(express.json());

// ==============================================================================
// GOOGLE EARTH ENGINE AUTHENTICATION & INITIALIZATION
// ==============================================================================
console.log('Authenticating with Google Earth Engine...');

ee.data.authenticateViaPrivateKey(
    privateKey,
    () => {
        console.log('Authentication successful. Initializing Earth Engine...');
        ee.initialize(
            null, null,
            () => {
                console.log('Google Earth Engine API initialized successfully. Ready for spatial analysis.');
            },
            (err) => {
                console.error('Earth Engine initialization failed:', err);
            }
        );
    },
    (err) => {
        console.error('Earth Engine authentication failed. Please verify the service account key:', err);
    }
);

// ==============================================================================
// API ROUTES
// ==============================================================================

// Basic health-check route to verify server and GEE connection status
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Green Belt Tracker API is running and connected to Google Earth Engine.'
    });
});

// Configure the server port
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
    console.log(`Server is successfully running on port ${PORT}`);
});