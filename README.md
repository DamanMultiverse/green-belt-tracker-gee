# Satellite-Based Green Belt Tracker 🌍📡

## Overview
This project is a spatio-temporal tracking system designed to monitor the development and health of green belts in surface mining areas. Using satellite imagery, the system performs automated data extraction and vegetation analysis to ensure environmental compliance and ecological restoration.

## Tech Stack
* **Google Earth Engine (GEE):** Cloud-based geospatial processing
* **Sentinel-2 Harmonized Dataset:** High-resolution multi-spectral satellite imagery
* **JavaScript:** GEE Code Editor scripting and API interaction

## Core Features
* **Automated AOI Extraction:** Dynamically clips satellite data to specific regional boundaries (e.g., Dhanbad district).
* **NDVI Calculation:** Computes the Normalized Difference Vegetation Index to distinguish between active mining pits, barren land, and healthy vegetation.
* **Temporal Trend Analysis:** Generates 5-year time-series charts (2019-2024) to track long-term green cover progression.
* **Visual Classification:** Implements custom color-coded map layers and UI legends for clear environmental data visualization.