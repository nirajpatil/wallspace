/**
 * room-view.js - 3D room preview for Wallspace
 *
 * Dependencies: state.js
 *
 * This file handles the room preview/zoom-out mode:
 * - Toggle between normal editing and 3D room preview
 * - Disable interactions while in preview mode
 * - Manage preview mode state
 *
 * Key functions:
 * - toggleRoomView() - Toggle between edit mode and room preview mode
 */

// Toggle room preview mode
function toggleRoomView() {
    const roomPerspective = document.getElementById('roomPerspective');
    const roomContainer = document.getElementById('roomContainer');
    const controlPanel = document.querySelector('.column-1');
    const artworkDialog = document.getElementById('artworkDialog');

    // Toggle the zoomed class
    roomPerspective.classList.toggle('zoomed');
    roomContainer.classList.toggle('zoomed');
    isPreviewMode = !isPreviewMode;

    if (isPreviewMode) {
        // Entering preview mode - disable all editing
        controlPanel.style.pointerEvents = 'none';
        controlPanel.style.opacity = '0.5';

        // Hide and deselect artwork dialog
        artworkDialog.classList.remove('active');
        if (selectedArtwork) {
            selectedArtwork.classList.remove('selected');
        }

        // Clear any ongoing drag/resize operations
        isDragging = false;
        isResizing = false;
    } else {
        // Exiting preview mode - re-enable all editing
        controlPanel.style.pointerEvents = 'auto';
        controlPanel.style.opacity = '1';
    }
}
