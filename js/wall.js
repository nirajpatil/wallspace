/**
 * wall.js - Wall configuration for Wallspace
 *
 * Dependencies: utils.js, state.js
 *
 * This file handles all wall-related functionality including:
 * - Wall dimension updates and scaling
 * - Wall unit conversions (inches/cm)
 *
 * Key functions:
 * - updateWall() - Recalculate and apply wall dimensions and appearance
 * - updateWallUnits() - Handle unit conversion for wall measurements
 */

// Update wall display based on current settings
function updateWall() {
    const wallContainer = document.getElementById('wallContainer');
    const width = parseFloat(document.getElementById('wallWidthInches').value);
    const height = parseFloat(document.getElementById('wallHeightInches').value);
    const color = document.getElementById('wallColor').value;

    // Width and height are already in inches
    const widthInches = width;
    const heightInches = height;

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
}

// Update wall width from inches input
function updateWallWidthFromInches() {
    const inchesValue = parseFloat(document.getElementById('wallWidthInches').value);
    if (!isNaN(inchesValue)) {
        const cmValue = inchesToCm(inchesValue);
        document.getElementById('wallWidthCm').value = cmValue.toFixed(1);
    }
}

// Update wall width from cm input
function updateWallWidthFromCm() {
    const cmValue = parseFloat(document.getElementById('wallWidthCm').value);
    if (!isNaN(cmValue)) {
        const inchesValue = cmToInches(cmValue);
        document.getElementById('wallWidthInches').value = inchesValue.toFixed(1);
    }
}

// Update wall height from inches input
function updateWallHeightFromInches() {
    const inchesValue = parseFloat(document.getElementById('wallHeightInches').value);
    if (!isNaN(inchesValue)) {
        const cmValue = inchesToCm(inchesValue);
        document.getElementById('wallHeightCm').value = cmValue.toFixed(1);
    }
}

// Update wall height from cm input
function updateWallHeightFromCm() {
    const cmValue = parseFloat(document.getElementById('wallHeightCm').value);
    if (!isNaN(cmValue)) {
        const inchesValue = cmToInches(cmValue);
        document.getElementById('wallHeightInches').value = inchesValue.toFixed(1);
    }
}
