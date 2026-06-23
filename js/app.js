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
    // Restore saved wall dimensions before updateWall() reads them
    restoreWallSettings();

    // Sync currentUnits with the restored value before updateWall() reads inputs
    updateWallUnits();
    updateArtworkUnits();

    // Set up the wall display
    updateWall();

    // Load any saved layouts from localStorage
    loadSavedLayouts();

    // Set up all UI event handlers
    initUIEventHandlers();

    // Initialize collapsible sections
    initCollapsibleSections();

    // Initialize artwork catalog (replaces collection)
    initCatalog();

    // Restore saved API key into the field
    const savedKey = localStorage.getItem('anthropicApiKey');
    if (savedKey) {
        const keyField = document.getElementById('anthropicApiKey');
        if (keyField) keyField.value = savedKey;
    }
}

// Run initialization when DOM is ready
initApp();
