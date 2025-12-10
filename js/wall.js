/**
 * wall.js - Wall configuration for Wallspace
 *
 * Dependencies: utils.js, state.js
 *
 * This file handles all wall-related functionality including:
 * - Wall dimension updates and scaling
 * - Wall unit conversions (inches/cm/mm)
 * - Wall background image management
 *
 * Key functions:
 * - updateWall() - Recalculate and apply wall dimensions and appearance
 * - updateWallUnits() - Handle unit conversion for wall measurements
 * - cycleWallUnits() - Cycle through unit options (IN -> CM -> MM)
 * - onWallDimensionChange() - Track dimension changes for refresh button state
 * - handleWallImageUpload(event) - Process uploaded background image
 * - removeWallImage() - Clear the wall background image
 */

// Track the last applied dimensions to detect changes
let lastAppliedWidth = 80;
let lastAppliedHeight = 80;
let lastAppliedUnits = 'inches';

// Convert any unit to inches
function toInches(value, units) {
    if (units === 'cm') {
        return cmToInches(value);
    } else if (units === 'mm') {
        return mmToInches(value);
    }
    return value;
}

// Update wall display based on current settings
function updateWall() {
    const wallContainer = document.getElementById('wallContainer');
    const units = document.getElementById('wallUnits').value;
    const width = parseFloat(document.getElementById('wallWidth').value);
    const height = parseFloat(document.getElementById('wallHeight').value);
    const color = document.getElementById('wallColor').value;

    // Convert to inches for calculation
    const widthInches = toInches(width, units);
    const heightInches = toInches(height, units);

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

    // Update last applied values and reset refresh button state
    lastAppliedWidth = width;
    lastAppliedHeight = height;
    lastAppliedUnits = units;
    updateRefreshButtonState();
}

// Handle wall unit conversion (inches <-> cm <-> mm)
function updateWallUnits() {
    const newUnits = document.getElementById('wallUnits').value;
    const wallWidth = parseFloat(document.getElementById('wallWidth').value);
    const wallHeight = parseFloat(document.getElementById('wallHeight').value);

    if (currentUnits !== newUnits) {
        // Convert existing values: first convert to inches, then to new units
        const widthInches = toInches(wallWidth, currentUnits);
        const heightInches = toInches(wallHeight, currentUnits);

        if (newUnits === 'cm') {
            document.getElementById('wallWidth').value = inchesToCm(widthInches).toFixed(1);
            document.getElementById('wallHeight').value = inchesToCm(heightInches).toFixed(1);
        } else if (newUnits === 'mm') {
            document.getElementById('wallWidth').value = inchesToMm(widthInches).toFixed(0);
            document.getElementById('wallHeight').value = inchesToMm(heightInches).toFixed(0);
        } else {
            document.getElementById('wallWidth').value = widthInches.toFixed(1);
            document.getElementById('wallHeight').value = heightInches.toFixed(1);
        }
        currentUnits = newUnits;
    }

    // Update unit labels (hidden elements for compatibility)
    document.getElementById('wallWidthUnit').textContent = newUnits;
    document.getElementById('wallHeightUnit').textContent = newUnits;

    // Update visible unit display
    updateUnitDisplay();

    // Check if refresh button state needs updating
    updateRefreshButtonState();
}

// Cycle through wall units: IN -> CM -> MM -> IN
function cycleWallUnits() {
    const unitsSelect = document.getElementById('wallUnits');
    const currentValue = unitsSelect.value;

    if (currentValue === 'inches') {
        unitsSelect.value = 'cm';
    } else if (currentValue === 'cm') {
        unitsSelect.value = 'mm';
    } else {
        unitsSelect.value = 'inches';
    }

    updateWallUnits();
}

// Update the unit display text
function updateUnitDisplay() {
    const units = document.getElementById('wallUnits').value;
    const display = document.getElementById('wallUnitDisplay');
    if (display) {
        if (units === 'inches') {
            display.textContent = 'IN';
        } else if (units === 'cm') {
            display.textContent = 'CM';
        } else {
            display.textContent = 'MM';
        }
    }
}

// Called when wall dimension inputs change
function onWallDimensionChange() {
    updateRefreshButtonState();
}

// Update refresh button state based on whether there are unapplied changes
function updateRefreshButtonState() {
    const refreshBtn = document.getElementById('refreshWallBtn');
    if (!refreshBtn) return;

    const units = document.getElementById('wallUnits').value;
    const width = parseFloat(document.getElementById('wallWidth').value);
    const height = parseFloat(document.getElementById('wallHeight').value);

    // Check if current values differ from last applied values
    const hasChanges = (
        width !== lastAppliedWidth ||
        height !== lastAppliedHeight ||
        units !== lastAppliedUnits
    );

    if (hasChanges) {
        refreshBtn.classList.add('has-changes');
    } else {
        refreshBtn.classList.remove('has-changes');
    }
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
