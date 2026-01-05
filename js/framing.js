/**
 * framing.js - Frame and matte logic for Wallspace
 *
 * Dependencies: utils.js, state.js
 *
 * This file handles frame and matte styling for artwork:
 * - Frame color and width application
 * - Matte color and width application
 * - Total artwork dimension calculations including frame/matte
 *
 * Key functions:
 * - updateSelectedArtwork() - Apply frame/matte settings to selected artwork
 */

// Apply frame and matte settings to selected artwork
function updateSelectedArtwork() {
    if (!selectedArtwork) return;

    const hasFrame = document.getElementById('sidebarHasFrame').checked;
    const hasMatte = document.getElementById('sidebarHasMatte').checked;
    const frameColor = document.getElementById('sidebarFrameColor').value;
    const frameSize = parseFloat(document.getElementById('sidebarFrameSize').value);
    const matteColor = document.getElementById('sidebarMatteColor').value;
    const matteSize = parseFloat(document.getElementById('sidebarMatteSize').value);
    const units = document.getElementById('sidebarArtworkUnits').value;

    const frame = selectedArtwork.querySelector('.frame');
    const matte = selectedArtwork.querySelector('.matte');
    const directImg = selectedArtwork.querySelector('.direct-img');
    const imageContainer = selectedArtwork.querySelector('.image-container');

    // Get the artwork's current dimensions (this is the image size)
    const artworkWidth = parseFloat(document.getElementById('sidebarArtworkWidth').value);
    const artworkHeight = parseFloat(document.getElementById('sidebarArtworkHeight').value);
    const artworkWidthPixels = unitsToPixels(artworkWidth, units);
    const artworkHeightPixels = unitsToPixels(artworkHeight, units);

    // Convert frame/matte sizes to pixels
    const frameSizePixels = unitsToPixels(frameSize, units);
    const matteSizePixels = unitsToPixels(matteSize, units);

    if (hasFrame || hasMatte) {
        directImg.style.display = 'none';
        frame.style.display = 'flex';

        // Calculate total dimensions
        let totalWidth = artworkWidthPixels;
        let totalHeight = artworkHeightPixels;

        if (hasMatte) {
            matte.style.display = 'flex';
            matte.style.backgroundColor = matteColor;
            totalWidth += matteSizePixels * 2; // Add matte on both sides
            totalHeight += matteSizePixels * 2;
        } else {
            matte.style.display = 'flex';
            matte.style.backgroundColor = 'transparent';
        }

        if (hasFrame) {
            frame.style.backgroundColor = frameColor;
            totalWidth += frameSizePixels * 2; // Add frame on both sides
            totalHeight += frameSizePixels * 2;
        } else {
            frame.style.backgroundColor = 'transparent';
        }

        // Set the total artwork container size
        selectedArtwork.style.width = totalWidth + 'px';
        selectedArtwork.style.height = totalHeight + 'px';

        // Set frame padding
        frame.style.padding = hasFrame ? frameSizePixels + 'px' : '0';

        // Set matte padding
        matte.style.padding = hasMatte ? matteSizePixels + 'px' : '0';

        // Set image container size to exact artwork dimensions
        if (imageContainer) {
            imageContainer.style.width = artworkWidthPixels + 'px';
            imageContainer.style.height = artworkHeightPixels + 'px';
            imageContainer.style.flexShrink = '0'; // Don't allow shrinking
        }

    } else {
        // No frame, no matte - just show direct image
        frame.style.display = 'none';
        matte.style.display = 'none';
        directImg.style.display = 'block';

        // Reset to artwork dimensions only
        selectedArtwork.style.width = artworkWidthPixels + 'px';
        selectedArtwork.style.height = artworkHeightPixels + 'px';
    }

    // Update distance guides when artwork dimensions change
    updateDistanceGuides();
}
