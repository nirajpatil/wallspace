/**
 * artwork.js - Artwork management for Wallspace
 *
 * Dependencies: utils.js, state.js, wall.js, framing.js
 *
 * This file handles artwork creation, selection, and manipulation:
 * - Image upload and placement on wall
 * - Artwork selection and event handling
 * - Artwork dimension controls and aspect ratio
 * - Artwork deletion
 *
 * Key functions:
 * - handleImageUpload(event) - Process uploaded artwork images
 * - addToWall(imageSrc) - Add single artwork to wall
 * - setupArtworkEvents(artwork) - Attach mouse event handlers
 * - selectArtwork(artwork) - Select and show dialog for artwork
 * - updateControlsFromArtwork(artwork) - Sync dialog controls with artwork state
 * - updateArtworkSize() - Handle dimension changes with aspect ratio lock
 * - deleteSelected() - Remove selected artwork from wall
 * - updateArtworkUnits() - Handle unit conversion for artwork measurements
 */

// Handle artwork unit conversion (inches <-> cm)
function updateArtworkUnits() {
    const newUnits = document.getElementById('sidebarArtworkUnits').value;
    const artworkWidth = parseFloat(document.getElementById('sidebarArtworkWidth').value);
    const artworkHeight = parseFloat(document.getElementById('sidebarArtworkHeight').value);

    if (currentArtworkUnits !== newUnits && !isNaN(artworkWidth) && !isNaN(artworkHeight)) {
        // Convert existing values
        if (newUnits === 'cm') {
            document.getElementById('sidebarArtworkWidth').value = inchesToCm(artworkWidth).toFixed(1);
            document.getElementById('sidebarArtworkHeight').value = inchesToCm(artworkHeight).toFixed(1);
        } else {
            document.getElementById('sidebarArtworkWidth').value = cmToInches(artworkWidth).toFixed(1);
            document.getElementById('sidebarArtworkHeight').value = cmToInches(artworkHeight).toFixed(1);
        }
        currentArtworkUnits = newUnits;
    }

    // Update unit labels for artwork
    document.getElementById('sidebarArtworkWidthUnit').textContent = newUnits;
    document.getElementById('sidebarArtworkHeightUnit').textContent = newUnits;
    document.getElementById('sidebarFrameUnit').textContent = newUnits;
    document.getElementById('sidebarMatteUnit').textContent = newUnits;

    // Update artwork if one is selected
    if (selectedArtwork) {
        updateSelectedArtwork();
    }
}

// Handle multiple image upload
function handleImageUpload(event) {
    const files = event.target.files;
    const wallContainer = document.getElementById('wallContainer');

    // Get current number of images in the wall
    const existingArtworks = document.querySelectorAll('.artwork').length;

    // Layout configuration: 3 columns
    const cols = 3;
    const imageWidth = 6; // inches
    const imageGap = 1; // inches between images
    const startX = 2; // inches from left
    const startY = 2; // inches from top

    Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const totalIndex = existingArtworks + index;
            const row = Math.floor(totalIndex / cols);
            const col = totalIndex % cols;

            // Calculate position in inches
            const xInches = startX + (col * (imageWidth + imageGap));
            const yInches = startY + (row * (imageWidth + imageGap));

            // Convert to pixels
            const xPixels = unitsToPixels(xInches, 'inches');
            const yPixels = unitsToPixels(yInches, 'inches');

            // Create artwork element
            const artwork = document.createElement('div');
            artwork.className = 'artwork';
            artwork.id = 'artwork-' + (++artworkCounter);

            // Create a temporary image to get natural dimensions
            const tempImg = new Image();
            tempImg.onload = function() {
                const aspectRatio = tempImg.naturalWidth / tempImg.naturalHeight;
                artworkAspectRatios.set(artwork.id, aspectRatio);

                // Set size maintaining aspect ratio
                const defaultHeight = imageWidth / aspectRatio;
                const defaultWidthPixels = unitsToPixels(imageWidth, 'inches');
                const defaultHeightPixels = unitsToPixels(defaultHeight, 'inches');

                artwork.style.width = defaultWidthPixels + 'px';
                artwork.style.height = defaultHeightPixels + 'px';
            };
            tempImg.src = e.target.result;

            artwork.innerHTML = `
                <div class="frame" style="display: none;">
                    <div class="matte" style="display: none;">
                        <div class="image-container">
                            <img src="${e.target.result}" alt="Artwork">
                        </div>
                    </div>
                </div>
                <img src="${e.target.result}" alt="Artwork" class="direct-img">
                <div class="resize-handle"></div>
            `;

            artwork.style.left = xPixels + 'px';
            artwork.style.top = yPixels + 'px';
            const defaultSizePixels = unitsToPixels(imageWidth, 'inches');
            artwork.style.width = defaultSizePixels + 'px';
            artwork.style.height = defaultSizePixels + 'px';

            wallContainer.appendChild(artwork);
            setupArtworkEvents(artwork);
        };
        reader.readAsDataURL(file);
    });
}

// Add single artwork to wall
function addToWall(imageSrc) {
    const wallContainer = document.getElementById('wallContainer');
    const artwork = document.createElement('div');
    artwork.className = 'artwork';
    artwork.id = 'artwork-' + (++artworkCounter);

    // Create a temporary image to get natural dimensions
    const tempImg = new Image();
    tempImg.onload = function() {
        const aspectRatio = tempImg.naturalWidth / tempImg.naturalHeight;
        artworkAspectRatios.set(artwork.id, aspectRatio);

        // Set default size maintaining aspect ratio
        const defaultWidth = 6; // inches
        const defaultHeight = defaultWidth / aspectRatio;
        const defaultWidthPixels = unitsToPixels(defaultWidth, 'inches');
        const defaultHeightPixels = unitsToPixels(defaultHeight, 'inches');

        artwork.style.width = defaultWidthPixels + 'px';
        artwork.style.height = defaultHeightPixels + 'px';
    };
    tempImg.src = imageSrc;

    artwork.innerHTML = `
        <div class="frame" style="display: none;">
            <div class="matte" style="display: none;">
                <div class="image-container">
                    <img src="${imageSrc}" alt="Artwork">
                </div>
            </div>
        </div>
        <img src="${imageSrc}" alt="Artwork" class="direct-img">
        <div class="resize-handle"></div>
    `;

    artwork.style.left = '20px';
    artwork.style.top = '20px';
    // Default size: 6 inches square (will be adjusted by image load)
    const defaultSizePixels = unitsToPixels(6, 'inches');
    artwork.style.width = defaultSizePixels + 'px';
    artwork.style.height = defaultSizePixels + 'px';

    wallContainer.appendChild(artwork);
    setupArtworkEvents(artwork);
}

// Setup mouse event handlers for artwork
function setupArtworkEvents(artwork) {
    artwork.addEventListener('mousedown', function(e) {
        // Prevent interactions in preview mode
        if (isPreviewMode) return;

        if (e.target.classList.contains('resize-handle')) {
            isResizing = true;
        } else {
            isDragging = true;
            const rect = artwork.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
        }

        selectArtwork(artwork);
        e.preventDefault();
    });
}

// Select artwork and show settings in sidebar
function selectArtwork(artwork) {
    // Remove selection from all artworks
    document.querySelectorAll('.artwork').forEach(art => {
        art.classList.remove('selected');
    });

    // Select the clicked artwork
    artwork.classList.add('selected');
    selectedArtwork = artwork;

    // Show sidebar artwork panel
    const artworkPanel = document.getElementById('artworkPanel');
    artworkPanel.style.display = 'block';

    // Update control values based on current artwork
    updateControlsFromArtwork(artwork);

    // Update distance guides
    updateDistanceGuides();
}

// Sync sidebar controls with current artwork state
function updateControlsFromArtwork(artwork) {
    const frame = artwork.querySelector('.frame');
    const matte = artwork.querySelector('.matte');

    document.getElementById('sidebarHasMatte').checked = matte.style.display !== 'none' && matte.style.backgroundColor !== 'transparent';
    document.getElementById('sidebarHasFrame').checked = frame.style.display !== 'none' && frame.style.backgroundColor !== 'transparent';

    // For artwork with frames/mattes, we need to calculate the actual image size
    // by subtracting the frame and matte dimensions
    const units = document.getElementById('sidebarArtworkUnits').value;
    let totalWidth = artwork.offsetWidth;
    let totalHeight = artwork.offsetHeight;

    // If there's framing, we need to get the image container size instead
    const imageContainer = artwork.querySelector('.image-container');
    if (imageContainer && imageContainer.style.width) {
        const widthInUnits = pixelsToUnits(parseFloat(imageContainer.style.width), units);
        const heightInUnits = pixelsToUnits(parseFloat(imageContainer.style.height), units);
        document.getElementById('sidebarArtworkWidth').value = widthInUnits.toFixed(1);
        document.getElementById('sidebarArtworkHeight').value = heightInUnits.toFixed(1);
    } else {
        // No framing, use total dimensions
        const widthInUnits = pixelsToUnits(totalWidth, units);
        const heightInUnits = pixelsToUnits(totalHeight, units);
        document.getElementById('sidebarArtworkWidth').value = widthInUnits.toFixed(1);
        document.getElementById('sidebarArtworkHeight').value = heightInUnits.toFixed(1);
    }
}

// Handle artwork dimension changes with aspect ratio lock
function updateArtworkSize() {
    if (!selectedArtwork) return;

    const maintainRatio = document.getElementById('sidebarMaintainRatio').checked;
    const units = document.getElementById('sidebarArtworkUnits').value;
    const width = parseFloat(document.getElementById('sidebarArtworkWidth').value);
    const height = parseFloat(document.getElementById('sidebarArtworkHeight').value);

    if (maintainRatio && artworkAspectRatios.has(selectedArtwork.id)) {
        const aspectRatio = artworkAspectRatios.get(selectedArtwork.id);
        const expectedHeight = width / aspectRatio;

        if (Math.abs(height - expectedHeight) > 0.1) {
            // Height was changed, adjust width
            const newWidth = height * aspectRatio;
            document.getElementById('sidebarArtworkWidth').value = newWidth.toFixed(1);
        }
    }

    // When updating artwork size, we need to recalculate the total dimensions
    // including frame and matte
    updateSelectedArtwork();
}

// Delete selected artwork from wall
function deleteSelected() {
    if (selectedArtwork) {
        selectedArtwork.remove();
        selectedArtwork = null;
        // Hide sidebar artwork panel
        document.getElementById('artworkPanel').style.display = 'none';

        // Clear distance guides when artwork is deleted
        updateDistanceGuides();
    }
}
