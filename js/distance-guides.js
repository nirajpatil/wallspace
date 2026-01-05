/**
 * distance-guides.js - Distance measurement guides for Wallspace
 *
 * Dependencies: utils.js, state.js
 *
 * This file handles distance measurement guides that show spacing:
 * - Between selected artwork and walls
 * - Between selected artwork and other artworks
 * - Real-time updates during drag/resize
 *
 * Key functions:
 * - toggleDistanceGuides() - Enable/disable distance guides display
 * - updateDistanceGuides() - Recalculate and draw all guide lines
 * - drawGuide() - Draw a single guide line with distance label
 */

// Toggle distance guides on/off
function toggleDistanceGuides() {
    const enabled = document.getElementById('showDistanceGuides').checked;
    const svg = document.getElementById('distanceGuidesSVG');

    if (enabled && selectedArtwork) {
        updateDistanceGuides();
    } else {
        svg.innerHTML = ''; // Clear guides
    }
}

// Update all distance guides for selected artwork
function updateDistanceGuides() {
    const svg = document.getElementById('distanceGuidesSVG');
    const enabled = document.getElementById('showDistanceGuides').checked;

    // Clear existing guides
    svg.innerHTML = '';

    // Only show guides if enabled and artwork is selected
    if (!enabled || !selectedArtwork) {
        return;
    }

    const wallContainer = document.getElementById('wallContainer');
    const wallWidth = wallContainer.offsetWidth;
    const wallHeight = wallContainer.offsetHeight;

    // Get artwork bounds (includes frame and matte if present)
    const artworkRect = selectedArtwork.getBoundingClientRect();
    const wallRect = wallContainer.getBoundingClientRect();

    // Calculate artwork position relative to wall
    const artworkLeft = artworkRect.left - wallRect.left;
    const artworkTop = artworkRect.top - wallRect.top;
    const artworkRight = artworkLeft + artworkRect.width;
    const artworkBottom = artworkTop + artworkRect.height;

    // Calculate center points of each side
    const centerX = artworkLeft + (artworkRect.width / 2);
    const centerY = artworkTop + (artworkRect.height / 2);
    const leftCenterX = artworkLeft;
    const leftCenterY = centerY;
    const rightCenterX = artworkRight;
    const rightCenterY = centerY;
    const topCenterX = centerX;
    const topCenterY = artworkTop;
    const bottomCenterX = centerX;
    const bottomCenterY = artworkBottom;

    // Find nearest artworks in each direction
    const otherArtworks = Array.from(document.querySelectorAll('.artwork')).filter(art => art !== selectedArtwork);
    let nearestLeft = null, nearestRight = null, nearestTop = null, nearestBottom = null;
    let nearestLeftDist = Infinity, nearestRightDist = Infinity, nearestTopDist = Infinity, nearestBottomDist = Infinity;

    otherArtworks.forEach(otherArt => {
        const otherRect = otherArt.getBoundingClientRect();
        const otherLeft = otherRect.left - wallRect.left;
        const otherTop = otherRect.top - wallRect.top;
        const otherRight = otherLeft + otherRect.width;
        const otherBottom = otherTop + otherRect.height;

        // Check if artwork is to the left (with vertical overlap)
        if (otherRight <= artworkLeft) {
            const dist = artworkLeft - otherRight;
            const verticalOverlap = Math.max(0, Math.min(artworkBottom, otherBottom) - Math.max(artworkTop, otherTop));
            if (verticalOverlap > 0 && dist < nearestLeftDist) {
                nearestLeftDist = dist;
                nearestLeft = { otherArt, otherRect, otherLeft, otherTop, otherRight, otherBottom };
            }
        }

        // Check if artwork is to the right (with vertical overlap)
        if (otherLeft >= artworkRight) {
            const dist = otherLeft - artworkRight;
            const verticalOverlap = Math.max(0, Math.min(artworkBottom, otherBottom) - Math.max(artworkTop, otherTop));
            if (verticalOverlap > 0 && dist < nearestRightDist) {
                nearestRightDist = dist;
                nearestRight = { otherArt, otherRect, otherLeft, otherTop, otherRight, otherBottom };
            }
        }

        // Check if artwork is above (with horizontal overlap)
        if (otherBottom <= artworkTop) {
            const dist = artworkTop - otherBottom;
            const horizontalOverlap = Math.max(0, Math.min(artworkRight, otherRight) - Math.max(artworkLeft, otherLeft));
            if (horizontalOverlap > 0 && dist < nearestTopDist) {
                nearestTopDist = dist;
                nearestTop = { otherArt, otherRect, otherLeft, otherTop, otherRight, otherBottom };
            }
        }

        // Check if artwork is below (with horizontal overlap)
        if (otherTop >= artworkBottom) {
            const dist = otherTop - artworkBottom;
            const horizontalOverlap = Math.max(0, Math.min(artworkRight, otherRight) - Math.max(artworkLeft, otherLeft));
            if (horizontalOverlap > 0 && dist < nearestBottomDist) {
                nearestBottomDist = dist;
                nearestBottom = { otherArt, otherRect, otherLeft, otherTop, otherRight, otherBottom };
            }
        }
    });

    // Draw guides to nearest artworks or walls
    // Left side
    if (nearestLeft) {
        const distInches = pixelsToUnits(nearestLeftDist, 'inches');
        const distCm = pixelsToUnits(nearestLeftDist, 'cm');
        const otherCenterY = nearestLeft.otherTop + (nearestLeft.otherRect.height / 2);
        const guideY = (centerY + otherCenterY) / 2; // Use midpoint of both centers
        drawGuide(svg, nearestLeft.otherRight, guideY, leftCenterX, guideY,
                 distInches, distCm, 'horizontal');
    } else if (artworkLeft > 0) {
        const distInches = pixelsToUnits(artworkLeft, 'inches');
        const distCm = pixelsToUnits(artworkLeft, 'cm');
        drawGuide(svg, 0, leftCenterY, leftCenterX, leftCenterY,
                 distInches, distCm, 'horizontal');
    }

    // Right side
    if (nearestRight) {
        const distInches = pixelsToUnits(nearestRightDist, 'inches');
        const distCm = pixelsToUnits(nearestRightDist, 'cm');
        const otherCenterY = nearestRight.otherTop + (nearestRight.otherRect.height / 2);
        const guideY = (centerY + otherCenterY) / 2;
        drawGuide(svg, rightCenterX, guideY, nearestRight.otherLeft, guideY,
                 distInches, distCm, 'horizontal');
    } else if (artworkRight < wallWidth) {
        const distInches = pixelsToUnits(wallWidth - artworkRight, 'inches');
        const distCm = pixelsToUnits(wallWidth - artworkRight, 'cm');
        drawGuide(svg, rightCenterX, rightCenterY, wallWidth, rightCenterY,
                 distInches, distCm, 'horizontal');
    }

    // Top side
    if (nearestTop) {
        const distInches = pixelsToUnits(nearestTopDist, 'inches');
        const distCm = pixelsToUnits(nearestTopDist, 'cm');
        const otherCenterX = nearestTop.otherLeft + (nearestTop.otherRect.width / 2);
        const guideX = (centerX + otherCenterX) / 2;
        drawGuide(svg, guideX, nearestTop.otherBottom, guideX, topCenterY,
                 distInches, distCm, 'vertical');
    } else if (artworkTop > 0) {
        const distInches = pixelsToUnits(artworkTop, 'inches');
        const distCm = pixelsToUnits(artworkTop, 'cm');
        drawGuide(svg, topCenterX, 0, topCenterX, topCenterY,
                 distInches, distCm, 'vertical');
    }

    // Bottom side
    if (nearestBottom) {
        const distInches = pixelsToUnits(nearestBottomDist, 'inches');
        const distCm = pixelsToUnits(nearestBottomDist, 'cm');
        const otherCenterX = nearestBottom.otherLeft + (nearestBottom.otherRect.width / 2);
        const guideX = (centerX + otherCenterX) / 2;
        drawGuide(svg, guideX, bottomCenterY, guideX, nearestBottom.otherTop,
                 distInches, distCm, 'vertical');
    } else if (artworkBottom < wallHeight) {
        const distInches = pixelsToUnits(wallHeight - artworkBottom, 'inches');
        const distCm = pixelsToUnits(wallHeight - artworkBottom, 'cm');
        drawGuide(svg, bottomCenterX, bottomCenterY, bottomCenterX, wallHeight,
                 distInches, distCm, 'vertical');
    }
}

// Draw a single guide line with distance label
function drawGuide(svg, x1, y1, x2, y2, distanceInches, distanceCm, orientation) {
    // Create line element
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    svg.appendChild(line);

    // Calculate midpoint for text label
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    // Format distance text (show both inches and cm)
    const distanceText = `${Math.round(distanceInches)}" / ${Math.round(distanceCm)}cm`;

    // Create text element
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', midX);
    text.setAttribute('y', midY);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.textContent = distanceText;

    // Adjust text position to avoid overlapping with line
    if (orientation === 'horizontal') {
        text.setAttribute('y', midY - 10); // Position text above the line
    } else {
        text.setAttribute('x', midX + 30); // Position text to the right of the line
    }

    svg.appendChild(text);
}
