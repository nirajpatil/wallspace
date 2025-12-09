/**
 * ui.js - UI interactions and dialog management for Wallspace
 *
 * Dependencies: state.js, wall.js, artwork.js, distance-guides.js
 *
 * This file handles all UI interactions:
 * - Dialog positioning and management
 * - Global mouse event handlers for drag/resize
 * - Click outside dialog handling
 * - Window resize handling
 * - Left panel toggle functionality
 *
 * Key functions:
 * - positionDialog(artwork, dialog) - Position dialog next to selected artwork
 * - initUIEventHandlers() - Set up all global event listeners
 * - toggleLeftPanel() - Toggle the visibility of the left control panel
 */

// Position the artwork settings dialog next to the selected artwork
function positionDialog(artwork, dialog) {
    const artworkRect = artwork.getBoundingClientRect();
    const dialogWidth = 320;
    const dialogPadding = 20;

    // Try to position to the right of the artwork
    let left = artworkRect.right + dialogPadding;
    let top = artworkRect.top;

    // Check if dialog would go off screen on the right
    if (left + dialogWidth > window.innerWidth) {
        // Position to the left of the artwork
        left = artworkRect.left - dialogWidth - dialogPadding;
    }

    // If still off screen, position to the left of the artwork within the wall container
    if (left < 0) {
        left = artworkRect.left - dialogWidth - dialogPadding;
        if (left < 0) {
            // Just position at a fixed offset if no room
            left = artworkRect.right + 10;
        }
    }

    // Keep within vertical bounds
    const maxTop = window.innerHeight - dialog.offsetHeight - 20;
    top = Math.max(20, Math.min(top, maxTop));

    dialog.style.left = left + 'px';
    dialog.style.top = top + 'px';
}

// Initialize all UI event handlers
function initUIEventHandlers() {
    // Global mouse events for dragging and resizing
    document.addEventListener('mousemove', function(e) {
        // Prevent all interactions in preview mode
        if (isPreviewMode) {
            isDragging = false;
            isResizing = false;
            return;
        }

        if (isDragging && selectedArtwork) {
            const wallContainer = document.getElementById('wallContainer');
            const wallRect = wallContainer.getBoundingClientRect();

            let newX = e.clientX - wallRect.left - dragOffset.x;
            let newY = e.clientY - wallRect.top - dragOffset.y;

            // Keep within bounds
            newX = Math.max(0, Math.min(newX, wallContainer.offsetWidth - selectedArtwork.offsetWidth));
            newY = Math.max(0, Math.min(newY, wallContainer.offsetHeight - selectedArtwork.offsetHeight));

            selectedArtwork.style.left = newX + 'px';
            selectedArtwork.style.top = newY + 'px';

            // Reposition dialog while dragging
            const dialog = document.getElementById('artworkDialog');
            if (dialog.classList.contains('active')) {
                positionDialog(selectedArtwork, dialog);
            }

            // Update distance guides while dragging
            updateDistanceGuides();
        } else if (isResizing && selectedArtwork) {
            const wallContainer = document.getElementById('wallContainer');
            const wallRect = wallContainer.getBoundingClientRect();
            const artworkRect = selectedArtwork.getBoundingClientRect();

            let newWidth = e.clientX - artworkRect.left;
            let newHeight = e.clientY - artworkRect.top;

            // Maintain aspect ratio
            const aspectRatio = selectedArtwork.offsetWidth / selectedArtwork.offsetHeight;
            if (newWidth / newHeight > aspectRatio) {
                newWidth = newHeight * aspectRatio;
            } else {
                newHeight = newWidth / aspectRatio;
            }

            // Minimum size
            newWidth = Math.max(50, newWidth);
            newHeight = Math.max(50, newHeight);

            selectedArtwork.style.width = newWidth + 'px';
            selectedArtwork.style.height = newHeight + 'px';

            // Reposition dialog while resizing
            const dialog = document.getElementById('artworkDialog');
            if (dialog.classList.contains('active')) {
                positionDialog(selectedArtwork, dialog);
            }

            // Update distance guides while resizing
            updateDistanceGuides();
        }
    });

    // Mouse up - end drag/resize operations
    document.addEventListener('mouseup', function() {
        if (!isPreviewMode) {
            isDragging = false;
            isResizing = false;
        }
    });

    // Close dialog when clicking outside
    document.addEventListener('click', function(e) {
        // Don't process clicks in preview mode
        if (isPreviewMode) return;

        const dialog = document.getElementById('artworkDialog');
        const artwork = selectedArtwork;

        // Check if click is outside dialog and artwork
        if (dialog.classList.contains('active') &&
            !dialog.contains(e.target) &&
            (!artwork || !artwork.contains(e.target))) {
            dialog.classList.remove('active');
            if (artwork) {
                artwork.classList.remove('selected');
            }
            selectedArtwork = null;

            // Clear distance guides when deselecting
            updateDistanceGuides();
        }
    });

    // Update wall scaling when window is resized
    window.addEventListener('resize', function() {
        updateWall();
    });
}

// Toggle the visibility of the left control panel
function toggleLeftPanel() {
    const leftPanel = document.querySelector('.column-1');
    const toggleButton = document.querySelector('.panel-toggle-icon');

    leftPanel.classList.toggle('collapsed');
    toggleButton.classList.toggle('panel-collapsed');
}
