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

// ─── PAN / ZOOM ──────────────────────────────────────────────────────────────

function applyViewTransform() {
    const wrapper = document.getElementById('panZoomWrapper');
    if (wrapper) {
        wrapper.style.transform = `translate(${viewPanX}px, ${viewPanY}px) scale(${viewZoom})`;
    }
}

function initViewTransform() {
    const wallContainer = document.getElementById('wallContainer');
    const workspace = document.querySelector('.workspace');
    if (!wallContainer || !workspace) return;
    const vw = workspace.offsetWidth;
    const vh = workspace.offsetHeight;
    const ww = parseFloat(wallContainer.style.width)  || wallContainer.offsetWidth;
    const wh = parseFloat(wallContainer.style.height) || wallContainer.offsetHeight;
    // Start at 1.0 zoom (20px/inch), wall centered in viewport
    viewZoom = 1.0;
    viewPanX = (vw - ww) / 2;
    viewPanY = (vh - wh) / 2;
    applyViewTransform();
}

function fitWallToScreen() {
    const wallContainer = document.getElementById('wallContainer');
    const workspace = document.querySelector('.workspace');
    if (!wallContainer || !workspace) return;
    const vw = workspace.offsetWidth;
    const vh = workspace.offsetHeight;
    const ww = parseFloat(wallContainer.style.width)  || wallContainer.offsetWidth;
    const wh = parseFloat(wallContainer.style.height) || wallContainer.offsetHeight;
    if (!ww || !wh) return;
    viewZoom = Math.min((vw - 40) / ww, (vh - 40) / wh);
    viewPanX = (vw - ww * viewZoom) / 2;
    viewPanY = (vh - wh * viewZoom) / 2;
    applyViewTransform();
}

function initPanZoom() {
    const workspace = document.querySelector('.workspace');
    const wallContainer = document.getElementById('wallContainer');

    // Mouse wheel — zoom centred on cursor
    workspace.addEventListener('wheel', function(e) {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
        const newZoom = Math.max(0.05, Math.min(5, viewZoom * factor));
        const rect = workspace.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        viewPanX = mx - (mx - viewPanX) * (newZoom / viewZoom);
        viewPanY = my - (my - viewPanY) * (newZoom / viewZoom);
        viewZoom = newZoom;
        applyViewTransform();
    }, { passive: false });

    // Mousedown on wall background — start pan
    wallContainer.addEventListener('mousedown', function(e) {
        if (e.target.closest('.artwork')) return;
        if (isPreviewMode) return;
        isPanning = true;
        panStartX = e.clientX - viewPanX;
        panStartY = e.clientY - viewPanY;
        document.body.style.cursor = 'grabbing';
        e.preventDefault();
    });
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

// Toggle sidebar open/closed
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
}

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

    // Open catalog by default
    const catalogContent = document.getElementById('catalogContent');
    const catalogChevron = document.getElementById('catalogChevron');
    if (catalogContent && catalogChevron) {
        catalogContent.classList.add('open');
        catalogChevron.classList.add('open');
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
        // Handle panning
        if (isPanning) {
            viewPanX = e.clientX - panStartX;
            viewPanY = e.clientY - panStartY;
            applyViewTransform();
            return;
        }

        // Prevent all interactions in preview mode
        if (isPreviewMode) {
            isDragging = false;
            isResizing = false;
            return;
        }

        if (isDragging && selectedArtwork) {
            // Move custom animated cursor with the mouse
            const cursor = document.getElementById('custom-drag-cursor');
            if (cursor) {
                cursor.style.left = e.clientX + 'px';
                cursor.style.top = e.clientY + 'px';
            }

            const wallContainer = document.getElementById('wallContainer');
            const wallRect = wallContainer.getBoundingClientRect();

            // Divide by viewZoom to convert from screen pixels to wall pixels
            let newX = (e.clientX - wallRect.left) / viewZoom - dragOffset.x;
            let newY = (e.clientY - wallRect.top) / viewZoom - dragOffset.y;

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

    // Mouse up - end drag/resize/pan operations
    document.addEventListener('mouseup', function() {
        if (isPanning) {
            isPanning = false;
            document.body.style.cursor = '';
        }
        if (!isPreviewMode) {
            isDragging = false;
            isResizing = false;
            const cursor = document.getElementById('custom-drag-cursor');
            if (cursor) cursor.classList.remove('active');
            document.body.classList.remove('dragging-artwork');
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

    initPanZoom();
}
