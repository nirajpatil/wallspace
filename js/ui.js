/**
 * ui.js - UI interactions and dialog management for Wallspace
 *
 * Dependencies: state.js, wall.js, artwork.js, distance-guides.js
 *
 * Handles:
 * - Floating icon bar show/hide
 * - Settings dialogs open/close/toggle
 * - Artwork dialog positioning near selected artwork
 * - Global mouse event handlers for drag/resize
 * - Click-outside dialog dismissal
 * - Window resize handling
 *
 * Key functions:
 * - toggleIconBar() - Slide icon bar in/out
 * - openDialog(dialogId) - Open a dialog, close others
 * - toggleDialog(dialogId) - Toggle a dialog (used by icon buttons)
 * - closeAllDialogs() - Close all settings dialogs
 * - positionArtworkDialog(artwork) - Position artwork dialog near artwork
 * - initUIEventHandlers() - Set up all global event listeners
 */

const DIALOG_IDS = ['dialog-wall', 'dialog-artwork', 'dialog-time', 'dialog-library'];

// Slide icon bar off/on screen
function toggleIconBar() {
    const iconBar = document.getElementById('icon-bar');
    const showBtn = document.getElementById('icon-bar-show');
    iconBar.classList.toggle('hidden');
    if (showBtn) {
        showBtn.style.display = iconBar.classList.contains('hidden') ? 'block' : 'none';
    }
}

// Open a specific dialog and close all others
function openDialog(dialogId) {
    closeAllDialogs();
    const dialog = document.getElementById(dialogId);
    if (dialog) {
        dialog.style.display = 'block';
        // Mark matching icon button as active
        const iconMap = {
            'dialog-wall': 'icon-wall',
            'dialog-artwork': 'icon-artwork',
            'dialog-time': 'icon-time',
            'dialog-library': 'icon-library'
        };
        const btnId = iconMap[dialogId];
        if (btnId) {
            const btn = document.getElementById(btnId);
            if (btn) btn.classList.add('active');
        }
        // For artwork dialog: if an artwork is selected, position near it
        if (dialogId === 'dialog-artwork' && selectedArtwork) {
            positionArtworkDialog(selectedArtwork);
        }
    }
}

// Toggle a dialog open/closed (used by icon bar buttons)
function toggleDialog(dialogId) {
    const dialog = document.getElementById(dialogId);
    if (!dialog) return;
    const isOpen = dialog.style.display === 'block';
    closeAllDialogs();
    if (!isOpen) {
        openDialog(dialogId);
    }
}

// Close all settings dialogs
function closeAllDialogs() {
    DIALOG_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    // Remove active state from all icon buttons
    document.querySelectorAll('.icon-btn').forEach(btn => btn.classList.remove('active'));
}

// Position the artwork dialog near the selected artwork element
function positionArtworkDialog(artwork) {
    const dialog = document.getElementById('dialog-artwork');
    if (!dialog || dialog.style.display === 'none') return;

    const artworkRect = artwork.getBoundingClientRect();
    const dialogWidth = 320;
    const iconBarClearance = 100; // keep above icon bar

    // Prefer right side of artwork, fall back to left
    let left = artworkRect.right + 12;
    if (left + dialogWidth > window.innerWidth - 10) {
        left = artworkRect.left - dialogWidth - 12;
    }
    left = Math.max(10, Math.min(left, window.innerWidth - dialogWidth - 10));

    // Align top with artwork, clamp so dialog doesn't go below icon bar
    let top = artworkRect.top;
    const maxBottom = window.innerHeight - iconBarClearance;
    // We don't know dialog height before layout, so use a generous estimate
    const estimatedHeight = 420;
    if (top + estimatedHeight > maxBottom) {
        top = Math.max(10, maxBottom - estimatedHeight);
    }

    dialog.style.left = left + 'px';
    dialog.style.top = top + 'px';
    dialog.style.bottom = 'auto';
    dialog.style.right = 'auto';
    dialog.style.transform = 'none';
}

// Initialize all UI event handlers
function initUIEventHandlers() {
    // Global mouse events for dragging
    document.addEventListener('mousemove', function(e) {
        if (isDragging && selectedArtwork) {
            const cursor = document.getElementById('custom-drag-cursor');
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';

            const wallContainer = document.getElementById('wallContainer');
            const wallRect = wallContainer.getBoundingClientRect();

            let newX = e.clientX - wallRect.left - dragOffset.x;
            let newY = e.clientY - wallRect.top - dragOffset.y;

            newX = Math.max(0, Math.min(newX, wallContainer.offsetWidth - selectedArtwork.offsetWidth));
            newY = Math.max(0, Math.min(newY, wallContainer.offsetHeight - selectedArtwork.offsetHeight));

            selectedArtwork.style.left = newX + 'px';
            selectedArtwork.style.top = newY + 'px';

            updateDistanceGuides();

            // Keep artwork dialog roughly positioned during drag
            positionArtworkDialog(selectedArtwork);
        }
    });

    // Mouse up — end drag
    document.addEventListener('mouseup', function() {
        isDragging = false;
        isResizing = false;

        const cursor = document.getElementById('custom-drag-cursor');
        cursor.classList.remove('active');
        document.body.classList.remove('dragging-artwork');
    });

    // Click outside dialogs and artwork → deselect / close dialogs
    document.addEventListener('click', function(e) {
        const wallContainer = document.getElementById('wallContainer');

        // Deselect artwork when clicking on wall (not on artwork or any dialog)
        const clickedInsideDialog = DIALOG_IDS.some(id => {
            const el = document.getElementById(id);
            return el && el.contains(e.target);
        });
        const clickedIconBar = document.getElementById('icon-bar').contains(e.target);

        if (selectedArtwork &&
            wallContainer.contains(e.target) &&
            !e.target.closest('.artwork') &&
            !clickedInsideDialog) {
            closeAllDialogs();
            selectedArtwork.classList.remove('selected');
            selectedArtwork = null;
            updateDistanceGuides();
        }

        // Close non-artwork dialogs when clicking outside them and outside the icon bar
        if (!clickedInsideDialog && !clickedIconBar && !e.target.closest('.artwork')) {
            // Only close if click was not on icon bar or a dialog
            ['dialog-wall', 'dialog-time', 'dialog-library'].forEach(id => {
                const el = document.getElementById(id);
                if (el && el.style.display === 'block') {
                    const iconMap = {
                        'dialog-wall': 'icon-wall',
                        'dialog-time': 'icon-time',
                        'dialog-library': 'icon-library'
                    };
                    el.style.display = 'none';
                    const btnId = iconMap[id];
                    if (btnId) document.getElementById(btnId).classList.remove('active');
                }
            });
        }
    });

    // Recompute wall scale on window resize
    window.addEventListener('resize', function() {
        updateWall();
    });
}
