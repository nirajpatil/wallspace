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

    // Scale wall to fit room viewport (wall takes max 70% width, 55% height)
    const maxWallWidth = window.innerWidth * 0.70;
    const maxWallHeight = window.innerHeight * 0.55;

    // Store old wallScale before changing it
    const oldWallScale = wallScale;

    // Calculate scale so wall fits within the room view proportionally
    wallScale = Math.min(maxWallWidth / widthInches, maxWallHeight / heightInches);
    const displayWidth = widthInches * wallScale;
    const displayHeight = heightInches * wallScale;

    wallContainer.style.width = displayWidth + 'px';
    wallContainer.style.height = displayHeight + 'px';
    wallContainer.style.backgroundColor = color;

    // Set workspace background to match wall color so room side-walls blend in
    const workspace = document.getElementById('workspace');
    if (workspace) workspace.style.backgroundColor = color;

    // Set background image if available
    if (wallBackgroundImage) {
        wallContainer.style.backgroundImage = `url(${wallBackgroundImage})`;
        wallContainer.style.backgroundSize = 'cover';
        wallContainer.style.backgroundPosition = 'center';
        wallContainer.style.backgroundRepeat = 'no-repeat';
    } else {
        wallContainer.style.backgroundImage = 'none';
    }

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
