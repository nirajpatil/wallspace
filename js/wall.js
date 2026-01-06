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

    // Store old wallScale before changing it
    const oldWallScale = wallScale;

    // Calculate scale to fit within available space
    wallScale = Math.min(maxWidth / widthInches, maxHeight / heightInches);
    const displayWidth = widthInches * wallScale;
    const displayHeight = heightInches * wallScale;

    wallContainer.style.width = displayWidth + 'px';
    wallContainer.style.height = displayHeight + 'px';
    wallContainer.style.backgroundColor = color;

    // If wallScale changed, rescale all artworks to maintain their physical dimensions
    if (oldWallScale !== wallScale && oldWallScale !== 1) {
        const scaleRatio = wallScale / oldWallScale;
        const artworks = document.querySelectorAll('.artwork');

        artworks.forEach(artwork => {
            // Scale the artwork dimensions
            const currentWidth = parseFloat(artwork.style.width);
            const currentHeight = parseFloat(artwork.style.height);

            artwork.style.width = (currentWidth * scaleRatio) + 'px';
            artwork.style.height = (currentHeight * scaleRatio) + 'px';

            // Scale the position
            const currentLeft = parseFloat(artwork.style.left);
            const currentTop = parseFloat(artwork.style.top);

            artwork.style.left = (currentLeft * scaleRatio) + 'px';
            artwork.style.top = (currentTop * scaleRatio) + 'px';

            // If this artwork has frame/matte, we need to update the image container size too
            const imageContainer = artwork.querySelector('.image-container');
            if (imageContainer && imageContainer.style.width) {
                const containerWidth = parseFloat(imageContainer.style.width);
                const containerHeight = parseFloat(imageContainer.style.height);

                imageContainer.style.width = (containerWidth * scaleRatio) + 'px';
                imageContainer.style.height = (containerHeight * scaleRatio) + 'px';
            }

            // Update frame padding if it exists
            const frame = artwork.querySelector('.frame');
            if (frame && frame.style.padding && frame.style.padding !== '0' && frame.style.padding !== '0px') {
                const currentPadding = parseFloat(frame.style.padding);
                frame.style.padding = (currentPadding * scaleRatio) + 'px';
            }

            // Update matte padding if it exists
            const matte = artwork.querySelector('.matte');
            if (matte && matte.style.padding && matte.style.padding !== '0' && matte.style.padding !== '0px') {
                const currentPadding = parseFloat(matte.style.padding);
                matte.style.padding = (currentPadding * scaleRatio) + 'px';
            }
        });

        // Update selected artwork controls to show the same physical dimensions
        if (selectedArtwork) {
            updateControlsFromArtwork(selectedArtwork);
        }

        // Update distance guides since positions changed
        if (typeof updateDistanceGuides === 'function') {
            updateDistanceGuides();
        }
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
