/**
 * room-view.js - Room environment and time-of-day lighting for Wallspace
 *
 * Dependencies: state.js
 *
 * The room is always visible (no preview mode toggle).
 * Time-of-day presets adjust ceiling, floor, and lighting overlay.
 *
 * Key functions:
 * - initRoomEnvironment() - Initialize the always-on room view
 * - setTimeOfDay(time) - Switch between 'morning', 'afternoon', 'night'
 */

// Initialize the room environment (always on, no preview toggle)
function initRoomEnvironment() {
    isPreviewMode = false;
    applyTimeOfDay(timeOfDay);
}

// Set time of day and update lighting
function setTimeOfDay(time) {
    timeOfDay = time;
    applyTimeOfDay(time);

    // Update active state on time buttons
    ['morning', 'afternoon', 'night'].forEach(t => {
        const btn = document.getElementById('time-btn-' + t);
        if (btn) btn.classList.toggle('time-btn-active', t === time);
    });
}

// Apply a time-of-day preset to the workspace
function applyTimeOfDay(time) {
    const workspace = document.getElementById('workspace');
    if (!workspace) return;
    workspace.classList.remove('time-morning', 'time-afternoon', 'time-night');
    workspace.classList.add('time-' + time);
}
