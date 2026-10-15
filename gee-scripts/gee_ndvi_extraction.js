// ==============================================================================
// SATELLITE-BASED GREEN BELT TRACKER
// Description: Spatio-temporal NDVI analysis for surface mines using Sentinel-2
// ==============================================================================

// 1. Define Area of Interest (AOI) - Extracting boundary for Dhanbad district
var dhanbad = ee.FeatureCollection("FAO/GAUL/2015/level2")
    .filter(ee.Filter.eq('ADM2_NAME', 'Dhanbad'));
Map.centerObject(dhanbad, 11);

// 2. Fetch Sentinel-2 Harmonized Dataset (Filtered by location, date, and cloud cover)
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(dhanbad)
    .filterDate('2023-01-01', '2023-12-31')
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20));

// 3. Calculate Normalized Difference Vegetation Index (NDVI)
var image = s2.median();
var ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');

// 4. Clip the NDVI data to the exact district boundary
var ndviClipped = ndvi.clip(dhanbad);

// 5. Define visualization parameters for the map overlay
var ndviParams = {
    min: 0.1,
    max: 0.6,
    palette: ['red', 'yellow', '#2ca02c', '#006400']
};

// 6. Overlay the styled boundary and clipped NDVI data on the map
Map.addLayer(dhanbad.style({color: 'black', fillColor: '00000000'}), {}, 'Dhanbad Boundary');
Map.addLayer(ndviClipped, ndviParams, 'Jharia/Dhanbad Green Belt 2023');
print('Spatial extraction complete: Dhanbad district is now visible.');

// ==============================================================================
// ADDING PROFESSIONAL MAP LEGEND
// ==============================================================================

// Create a UI panel for the legend in the bottom-left corner
var legend = ui.Panel({
    style: { position: 'bottom-left', padding: '8px 15px', backgroundColor: 'white' }
});

// Add title to the legend
var legendTitle = ui.Label({
    value: 'NDVI Index (Green Belt)',
    style: { fontWeight: 'bold', fontSize: '16px', margin: '0 0 4px 0', color: 'black' }
});
legend.add(legendTitle);

// Helper function to create color boxes and labels for the legend
var makeRow = function(color, name) {
    var colorBox = ui.Label({
        style: { backgroundColor: color, padding: '8px', margin: '0 0 4px 0' }
    });
    var description = ui.Label({
        value: name,
        style: { margin: '0 0 4px 6px', fontSize: '13px', color: 'black' }
    });
    return ui.Panel({
        widgets: [colorBox, description],
        layout: ui.Panel.Layout.Flow('horizontal')
    });
};

// Populate legend with specific categories
legend.add(makeRow('#006400', 'Dense Forest / Green Belt'));
legend.add(makeRow('#2ca02c', 'Light Vegetation / Shrubs'));
legend.add(makeRow('yellow', 'Barren Land / Overburden Dump'));
legend.add(makeRow('red', 'Active Mining Pit / Water'));
Map.add(legend);

// ==============================================================================
// TIME-SERIES CHART GENERATION (2019-2024 TREND)
// ==============================================================================

print('Generating Time-Series Chart... Please wait.');

// Helper function to calculate and append NDVI band to each image
var addNDVI = function(image) {
    var ndviBand = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
    return image.addBands(ndviBand);
};

// Fetch 5-year trend data
var s2_trend = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(dhanbad)
    .filterDate('2019-01-01', '2024-01-01')
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
    .map(addNDVI);

// Generate line chart for the NDVI temporal trend
var ndviChart = ui.Chart.image.series({
    imageCollection: s2_trend.select('NDVI'),
    region: dhanbad,
    reducer: ee.Reducer.mean(),
    scale: 500, 
    xProperty: 'system:time_start'
}).setOptions({
    title: 'Average NDVI Trend in Dhanbad (2019-2024)',
    vAxis: { title: 'Average NDVI (Greenness)' },
    hAxis: { title: 'Year' },
    lineWidth: 2,
    pointSize: 4,
    colors: ['#006400'] 
});

// Render chart in the console
print(ndviChart);