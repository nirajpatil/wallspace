/**
 * wall.js - Wall configuration for Wallspace
 *
 * Dependencies: utils.js, state.js
 *
 * This file handles all wall-related functionality including:
 * - Wall dimension updates and scaling
 * - Wall unit conversions (inches/cm)
 * - Wall background image management
 *
 * Key functions:
 * - updateWall() - Recalculate and apply wall dimensions and appearance
 * - updateWallUnits() - Handle unit conversion for wall measurements
 * - handleWallImageUpload(event) - Process uploaded background image
 * - removeWallImage() - Clear the wall background image
 */

// Update wall display based on current settings
function updateWall() {
    const wallContainer = document.getElementById('wallContainer');
    const units = document.getElementById('wallUnits').value;
    const width = parseFloat(document.getElementById('wallWidth').value);
    const height = parseFloat(document.getElementById('wallHeight').value);
    const color = document.getElementById('wallColor').value;

    const widthInches = units === 'cm' ? cmToInches(width) : width;
    const heightInches = units === 'cm' ? cmToInches(height) : height;

    // wallScale is fixed at 20px/inch — visual zoom handled by pan/zoom transform
    const wallW = (widthInches  * wallScale) + 'px';
    const wallH = (heightInches * wallScale) + 'px';
    wallContainer.style.width  = wallW;
    wallContainer.style.height = wallH;
    // Size the pan/zoom wrapper to match so percentage children resolve correctly
    const wrapper = document.getElementById('panZoomWrapper');
    if (wrapper) { wrapper.style.width = wallW; wrapper.style.height = wallH; }
    wallContainer.style.backgroundColor = color;

    if (wallBackgroundImage) {
        wallContainer.style.backgroundImage = `url(${wallBackgroundImage})`;
        wallContainer.style.backgroundSize = 'cover';
        wallContainer.style.backgroundPosition = 'center';
        wallContainer.style.backgroundRepeat = 'no-repeat';
    } else {
        wallContainer.style.backgroundImage = 'none';
    }

    if (typeof saveWallSettings === 'function') saveWallSettings();
    if (typeof updateDistanceGuides === 'function') updateDistanceGuides();
}

// Handle wall unit conversion (inches <-> cm)
function updateWallUnits() {
    const newUnits = document.getElementById('wallUnits').value;
    const wallWidth = parseFloat(document.getElementById('wallWidth').value);
    const wallHeight = parseFloat(document.getElementById('wallHeight').value);

    if (currentUnits !== newUnits) {
        // Convert existing values
        if (newUnits === 'cm') {
            document.getElementById('wallWidth').value = inchesToCm(wallWidth).toFixed(1);
            document.getElementById('wallHeight').value = inchesToCm(wallHeight).toFixed(1);
        } else {
            document.getElementById('wallWidth').value = cmToInches(wallWidth).toFixed(1);
            document.getElementById('wallHeight').value = cmToInches(wallHeight).toFixed(1);
        }
        currentUnits = newUnits;
    }

    // Update unit labels
    document.getElementById('wallWidthUnit').textContent = newUnits;
    document.getElementById('wallHeightUnit').textContent = newUnits;
    if (typeof saveWallSettings === 'function') saveWallSettings();
}

// Handle wall background image upload
function handleWallImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            wallBackgroundImage = e.target.result;
            updateWall();
        };
        reader.readAsDataURL(file);
    }
}

// Remove wall background image
function removeWallImage() {
    wallBackgroundImage = null;
    document.getElementById('wallImageUpload').value = '';
    updateWall();
}
