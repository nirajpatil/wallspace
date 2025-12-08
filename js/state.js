/**
 * state.js - Application state for Wallspace
 *
 * Dependencies: None
 *
 * This file declares all global state variables used throughout the application.
 * These variables are accessed and modified by other modules.
 *
 * State categories:
 * - Artwork tracking: artworkCounter, selectedArtwork, artworkAspectRatios
 * - Interaction state: isDragging, isResizing, dragOffset, isPreviewMode
 * - Persistence: savedLayouts
 * - Units/scale: currentUnits, currentArtworkUnits, wallScale
 * - Wall appearance: wallBackgroundImage
 */

// Artwork tracking
let artworkCounter = 0;           // Counter for generating unique artwork IDs
let selectedArtwork = null;       // Currently selected artwork element
let artworkAspectRatios = new Map(); // Store original aspect ratios by artwork ID

// Interaction state
let isDragging = false;           // True when artwork is being dragged
let isResizing = false;           // True when artwork is being resized
let dragOffset = { x: 0, y: 0 };  // Offset from mouse to artwork corner during drag
let isPreviewMode = false;        // True when in room preview/zoom-out mode

// Persistence
let savedLayouts = [];            // Array of saved layout configurations

// Units and scale
let currentUnits = 'inches';      // Current wall measurement units ('inches' or 'cm')
let currentArtworkUnits = 'inches'; // Current artwork measurement units ('inches' or 'cm')
let wallScale = 1;                // Pixels per inch for current wall display

// Wall appearance
let wallBackgroundImage = null;   // Data URL of uploaded wall background image
