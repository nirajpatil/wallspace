/**
 * ui.js - UI interactions and dialog management for Wallspace
 *
 * Dependencies: state.js, wall.js, artwork.js, distance-guides.js
 *
 * This file handles all UI interactions:
 * - Dialog positioning and management
 * - Collapsible section toggles
 * - Global mouse event handlers for drag/resize
 * - Click outside dialog handling
 * - Window resize handling
 *
 * Key functions:
 * - toggleSection(sectionId) - Toggle collapsible section visibility
 * - positionDialog(artwork, dialog) - Position dialog next to selected artwork
 * - initUIEventHandlers() - Set up all global event listeners
 */

// Toggle collapsible section visibility
function toggleSection(sectionId) {
    const content = document.getElementById(sectionId + 'Content');
    const chevron = document.getElementById(sectionId + 'Chevron');

    if (content && chevron) {
        content.classList.toggle('open');
        chevron.classList.toggle('open');
    }
}

// Initialize sections to be open by default
function initCollapsibleSections() {
    // Open wall settings by default
    const wallContent = document.getElementById('wallSettingsContent');
    const wallChevron = document.getElementById('wallSettingsChevron');
    if (wallContent && wallChevron) {
        wallContent.classList.add('open');
        wallChevron.classList.add('open');
    }

    // Open artwork settings by default
    const artworkContent = document.getElementById('artworkSettingsContent');
    const artworkChevron = document.getElementById('artworkSettingsChevron');
    if (artworkContent && artworkChevron) {
        artworkContent.classList.add('open');
        artworkChevron.classList.add('open');
    }
}

// Position the artwork settings dialog next to the selected artwork
// NOTE: This function is disabled - artwork settings now appear in the sidebar
function positionDialog(artwork, dialog) {
    // Disabled: Dialog functionality moved to sidebar
    // Keeping function for potential future use
    return;
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

            // Update distance guides while dragging
            updateDistanceGuides();
        } else if (isResizing && selectedArtwork) {
            // Resize functionality disabled - use sidebar dimension inputs instead
            // const wallContainer = document.getElementById('wallContainer');
            // const wallRect = wallContainer.getBoundingClientRect();
            // const artworkRect = selectedArtwork.getBoundingClientRect();

            // let newWidth = e.clientX - artworkRect.left;
            // let newHeight = e.clientY - artworkRect.top;

            // // Maintain aspect ratio
            // const aspectRatio = selectedArtwork.offsetWidth / selectedArtwork.offsetHeight;
            // if (newWidth / newHeight > aspectRatio) {
            //     newWidth = newHeight * aspectRatio;
            // } else {
            //     newHeight = newWidth / aspectRatio;
            // }

            // // Minimum size
            // newWidth = Math.max(50, newWidth);
            // newHeight = Math.max(50, newHeight);

            // selectedArtwork.style.width = newWidth + 'px';
            // selectedArtwork.style.height = newHeight + 'px';

            // // Update distance guides while resizing
            // updateDistanceGuides();
        }
    });

    // Mouse up - end drag/resize operations
    document.addEventListener('mouseup', function() {
        if (!isPreviewMode) {
            isDragging = false;
            isResizing = false;
        }
    });

    // Deselect artwork when clicking outside (on the wall or workspace)
    document.addEventListener('click', function(e) {
        // Don't process clicks in preview mode
        if (isPreviewMode) return;

        const artworkPanel = document.getElementById('artworkPanel');
        const artwork = selectedArtwork;
        const wallContainer = document.getElementById('wallContainer');

        // Check if click is on the wall container but not on any artwork or sidebar
        if (artwork &&
            wallContainer.contains(e.target) &&
            !e.target.closest('.artwork') &&
            !artworkPanel.contains(e.target)) {
            // Hide sidebar artwork panel
            artworkPanel.style.display = 'none';
            artwork.classList.remove('selected');
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
