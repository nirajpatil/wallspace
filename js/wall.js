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

    // Convert to inches for calculation
    const widthInches = units === 'cm' ? cmToInches(width) : width;
    const heightInches = units === 'cm' ? cmToInches(height) : height;

    // Get the workspace container width to scale appropriately
    // Use the workspace div, not the immediate parent which is now room-container
    const workspace = document.querySelector('.workspace');
    const maxWidth = workspace.offsetWidth - 40; // Account for padding
    const maxHeight = window.innerHeight - 60; // Use browser window height minus padding for controls

    // Calculate scale to fit within available space
    wallScale = Math.min(maxWidth / widthInches, maxHeight / heightInches);
    const displayWidth = widthInches * wallScale;
    const displayHeight = heightInches * wallScale;

    wallContainer.style.width = displayWidth + 'px';
    wallContainer.style.height = displayHeight + 'px';
    wallContainer.style.backgroundColor = color;

    // Set background image if available
    if (wallBackgroundImage) {
        wallContainer.style.backgroundImage = `url(${wallBackgroundImage})`;
        wallContainer.style.backgroundSize = 'cover';
        wallContainer.style.backgroundPosition = 'center';
        wallContainer.style.backgroundRepeat = 'no-repeat';
    } else {
        wallContainer.style.backgroundImage = 'none';
    }
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
