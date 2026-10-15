// ==============================================================================
// CORE SERVER SETUP & GEE INTEGRATION
// Description: Node.js/Express backend API with Google Earth Engine authentication
//              and spatial analysis endpoints.
// ==============================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const ee = require('@google/earthengine');
const privateKey = require(process.env.GEE_PRIVATE_KEY_PATH);

const app = express();

app.use(cors());
app.use(express.json());

// ==============================================================================
// GOOGLE EARTH ENGINE AUTHENTICATION
// ==============================================================================
console.log('Authenticating with Google Earth Engine...');

ee.data.authenticateViaPrivateKey(
    privateKey,
    () => {
        console.log('Authentication successful. Initializing Earth Engine...');
        ee.initialize(
            null, null,
            () => console.log('Google Earth Engine API initialized successfully.'),
            (err) => console.error('Earth Engine initialization failed:', err)
        );
    },
    (err) => console.error('Earth Engine authentication failed:', err)
);

// ==============================================================================
// HELPER FUNCTION: ASYNC GEE EVALUATION
// Description: Wraps Earth Engine's evaluate method in a Promise for async/await
// ==============================================================================
const evaluateEE = (eeObject) => {
    return new Promise((resolve, reject) => {
        eeObject.evaluate((result, error) => {
            if (error) reject(error);
            else resolve(result);
        });
    });
};

// ==============================================================================
// API ROUTES
// ==============================================================================

// Health Check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'API is running smoothly.' });
});

// Primary Spatial Analysis Endpoint
app.post('/api/analyze', async (req, res) => {
    try {
        const { lat, lng, startYear, endYear, bufferRadius } = req.body;

        // Input validation
        if (!lat || !lng || !startYear || !endYear) {
            return res.status(400).json({ error: 'Missing required parameters.' });
        }

        console.log(`Processing request for Coordinates: [${lat}, ${lng}], Year: ${startYear}-${endYear}`);

        // Define Region of Interest (ROI)
        const point = ee.Geometry.Point([parseFloat(lng), parseFloat(lat)]);
        const roi = point.buffer(parseInt(bufferRadius) || 5000);

        // Define time range
        const startDate = ee.Date.fromYMD(parseInt(startYear), 1, 1);
        const endDate = ee.Date.fromYMD(parseInt(endYear), 12, 31);

        // Fetch Sentinel-2 Harmonized Data
        const collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
            .filterBounds(roi)
            .filterDate(startDate, endDate)
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20));

        // Function to compute NDVI for a single image
        const computeNDVI = (image) => {
            const ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
            return image.addBands(ndvi);
        };

        const processedCollection = collection.map(computeNDVI);

        // Calculate annual mean NDVI to generate the time-series trend
        const years = ee.List.sequence(parseInt(startYear), parseInt(endYear));
        
        const annualTrend = years.map((year) => {
            const start = ee.Date.fromYMD(year, 1, 1);
            const end = ee.Date.fromYMD(year, 12, 31);
            
            const yearlyData = processedCollection.filterDate(start, end);
            
            // Calculate mean NDVI for the region in that specific year
            const meanImage = yearlyData.select('NDVI').mean();
            const meanValue = meanImage.reduceRegion({
                reducer: ee.Reducer.mean(),
                geometry: roi,
                scale: 100, // Adjusted scale for performance optimization
                maxPixels: 1e9
            });
            
            return ee.Feature(null, {
                year: ee.Number(year).format('%04d'),
                ndvi: meanValue.get('NDVI')
            });
        });

        const featureCollection = ee.FeatureCollection(annualTrend);
        
        // Extract the computed data to Node.js environment
        const extractedData = await evaluateEE(featureCollection);
        
        // Format the raw GEE output for the frontend chart component
        const formattedChartData = extractedData.features.map(f => ({
            year: f.properties.year,
            ndvi: f.properties.ndvi ? Number(f.properties.ndvi.toFixed(3)) : 0
        }));

        res.status(200).json({
            status: 'success',
            data: formattedChartData
        });

    } catch (error) {
        console.error('Error during GEE spatial analysis:', error);
        res.status(500).json({ error: 'Failed to process spatial analysis request.' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is successfully running on port ${PORT}`));