/**
 * app.js - Application initialization for Wallspace
 *
 * Dependencies: All other modules (utils, state, wall, artwork, framing,
 *               distance-guides, room-view, storage, ui)
 *
 * This file initializes the application on page load:
 * - Sets up the wall display
 * - Initializes unit displays
 * - Loads saved layouts
 * - Sets up UI event handlers
 *
 * This must be the last script loaded.
 */

// Initialize the application
function initApp() {
    // Set up the wall display
    updateWall();

    // Initialize unit displays
    updateWallUnits();
    updateArtworkUnits();

    // Load any saved layouts from localStorage
    loadSavedLayouts();

    // Set up all UI event handlers
    initUIEventHandlers();

    // Initialize collapsible sections
    initCollapsibleSections();
}

// Run initialization when DOM is ready
initApp();
