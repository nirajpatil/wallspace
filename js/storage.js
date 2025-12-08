/**
 * storage.js - Save/load functionality for Wallspace
 *
 * Dependencies: state.js, wall.js, artwork.js
 *
 * This file handles all data persistence operations:
 * - Save/load layouts to/from localStorage
 * - Export/import layouts as JSON files
 * - Clear wall functionality
 *
 * Key functions:
 * - loadSavedLayouts() - Load and display saved layouts from localStorage
 * - saveLayoutsToStorage() - Persist layouts array to localStorage
 * - saveLayout() - Save current wall configuration as a new layout
 * - loadLayout(index) - Restore a saved layout to the wall
 * - deleteLayout(index) - Remove a saved layout
 * - clearWall() - Remove all artwork from the wall
 * - exportLayouts() - Download layouts as JSON file
 * - importLayouts(event) - Load layouts from JSON file
 */

// Load saved layouts from localStorage and render the list
function loadSavedLayouts() {
    try {
        const stored = localStorage.getItem('wallArtLayouts');
        savedLayouts = stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading layouts:', error);
        savedLayouts = [];
    }

    const container = document.getElementById('savedLayouts');
    container.innerHTML = '';

    if (savedLayouts.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; grid-column: 1/-1;">No saved layouts yet. Create your first gallery layout!</p>';
        return;
    }

    savedLayouts.forEach((layout, index) => {
        const layoutDiv = document.createElement('div');
        layoutDiv.className = 'layout-item';
        layoutDiv.innerHTML = `
            <div class="layout-preview">Gallery ${index + 1}</div>
            <p><span>${layout.name}</span></p>
            <p style="font-size: 12px; color: #666;">${layout.artworks.length} artworks</p>
            <p style="font-size: 11px; color: #999;">${layout.date}</p>
            <button onclick="loadLayout(${index})" style="margin: 5px 5px 0 0;">Load</button>
            <button onclick="deleteLayout(${index})" style="background: #e74c3c;">Delete</button>
        `;
        container.appendChild(layoutDiv);
    });
}

// Save layouts array to localStorage
function saveLayoutsToStorage() {
    try {
        localStorage.setItem('wallArtLayouts', JSON.stringify(savedLayouts));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        alert('Unable to save layout. Your browser storage might be full.');
        return false;
    }
}

// Save current wall configuration as a new layout
function saveLayout() {
    const name = `Gallery ${savedLayouts.length + 1}`;
    const wallSettings = {
        width: document.getElementById('wallWidthInches').value,
        height: document.getElementById('wallHeightInches').value,
        color: document.getElementById('wallColor').value,
        backgroundImage: wallBackgroundImage
    };

    const artworks = [];
    document.querySelectorAll('.artwork').forEach(artwork => {
        const style = window.getComputedStyle(artwork);
        const img = artwork.querySelector('img');
        const frame = artwork.querySelector('.frame');
        const matte = artwork.querySelector('.matte');

        // Get frame and matte settings
        const hasFrame = frame.style.display !== 'none' && frame.style.backgroundColor !== 'transparent';
        const hasMatte = matte.style.display !== 'none' && matte.style.backgroundColor !== 'transparent';

        artworks.push({
            src: img.src,
            left: style.left,
            top: style.top,
            width: style.width,
            height: style.height,
            hasFrame: hasFrame,
            hasMatte: hasMatte,
            frameColor: frame.style.backgroundColor,
            matteColor: matte.style.backgroundColor,
            aspectRatio: artworkAspectRatios.get(artwork.id) || 1
        });
    });

    const newLayout = {
        name: name,
        wallSettings: wallSettings,
        artworks: artworks,
        date: new Date().toLocaleDateString(),
        id: Date.now() // Unique ID
    };

    savedLayouts.push(newLayout);

    if (saveLayoutsToStorage()) {
        loadSavedLayouts();

        // Show success message
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = '✅ Saved!';
        button.style.background = '#27ae60';
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 2000);
    }
}

// Load a saved layout by index
function loadLayout(index) {
    const layout = savedLayouts[index];

    // Set wall settings (values are stored in inches)
    const widthInches = parseFloat(layout.wallSettings.width);
    const heightInches = parseFloat(layout.wallSettings.height);

    document.getElementById('wallWidthInches').value = widthInches;
    document.getElementById('wallWidthCm').value = inchesToCm(widthInches).toFixed(1);
    document.getElementById('wallHeightInches').value = heightInches;
    document.getElementById('wallHeightCm').value = inchesToCm(heightInches).toFixed(1);
    document.getElementById('wallColor').value = layout.wallSettings.color;

    // Set wall background image if saved
    if (layout.wallSettings.backgroundImage) {
        wallBackgroundImage = layout.wallSettings.backgroundImage;
    } else {
        wallBackgroundImage = null;
    }

    updateWall();

    // Clear existing artworks (without confirmation)
    clearArtworks();

    // Add artworks
    layout.artworks.forEach(artworkData => {
        const wallContainer = document.getElementById('wallContainer');
        const artwork = document.createElement('div');
        artwork.className = 'artwork';
        artwork.id = 'artwork-' + (++artworkCounter);

        // Store aspect ratio if available
        if (artworkData.aspectRatio) {
            artworkAspectRatios.set(artwork.id, artworkData.aspectRatio);
        }

        artwork.innerHTML = `
            <div class="frame" style="display: ${artworkData.hasFrame ? 'flex' : 'none'}; background-color: ${artworkData.frameColor || 'transparent'};">
                <div class="matte" style="display: ${artworkData.hasMatte ? 'flex' : 'none'}; background-color: ${artworkData.matteColor || 'transparent'};">
                    <div class="image-container">
                        <img src="${artworkData.src}" alt="Artwork">
                    </div>
                </div>
            </div>
            <img src="${artworkData.src}" alt="Artwork" class="direct-img" style="display: ${artworkData.hasFrame || artworkData.hasMatte ? 'none' : 'block'};">
            <div class="resize-handle"></div>
        `;

        artwork.style.left = artworkData.left;
        artwork.style.top = artworkData.top;
        artwork.style.width = artworkData.width;
        artwork.style.height = artworkData.height;

        wallContainer.appendChild(artwork);
        setupArtworkEvents(artwork);
    });

    // Show success message
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '✅ Loaded!';
    button.style.background = '#27ae60';
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
    }, 1500);
}

// Delete a saved layout by index
function deleteLayout(index) {
    if (confirm(`Are you sure you want to delete "${savedLayouts[index].name}"?`)) {
        savedLayouts.splice(index, 1);
        saveLayoutsToStorage();
        loadSavedLayouts();

        // Show success message briefly
        const container = document.getElementById('savedLayouts');
        const message = document.createElement('div');
        message.style.cssText = 'grid-column: 1/-1; text-align: center; color: #e74c3c; font-weight: normal; padding: 10px;';
        message.textContent = '🗑️ Layout deleted successfully';
        container.prepend(message);
        setTimeout(() => message.remove(), 2000);
    }
}

// Clear all artwork from the wall
function clearWall() {
    if (document.querySelectorAll('.artwork').length > 0) {
        if (confirm('Are you sure you want to clear all artwork from the wall?')) {
            // Only remove artwork elements, not the buttons or other UI
            document.querySelectorAll('.artwork').forEach(artwork => artwork.remove());
            selectedArtwork = null;
            document.getElementById('artworkDialog').classList.remove('active');
        }
    }
}

// Internal function to clear artworks without confirmation (used by loadLayout)
function clearArtworks() {
    document.querySelectorAll('.artwork').forEach(artwork => artwork.remove());
    selectedArtwork = null;
    document.getElementById('artworkDialog').classList.remove('active');
}

// Export all layouts as a JSON file
function exportLayouts() {
    try {
        const dataStr = JSON.stringify(savedLayouts, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `wall-art-layouts-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);

        alert('✅ Layouts exported successfully! You can import this file on any device.');
    } catch (error) {
        alert('❌ Error exporting layouts: ' + error.message);
    }
}

// Import layouts from a JSON file
function importLayouts(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedLayouts = JSON.parse(e.target.result);

            if (!Array.isArray(importedLayouts)) {
                throw new Error('Invalid file format');
            }

            const confirmMsg = `Import ${importedLayouts.length} layouts? This will add to your existing layouts (won't replace them).`;
            if (confirm(confirmMsg)) {
                // Add imported layouts to existing ones
                savedLayouts.push(...importedLayouts);
                saveLayoutsToStorage();
                loadSavedLayouts();
                alert(`✅ Successfully imported ${importedLayouts.length} layouts!`);
            }
        } catch (error) {
            alert('❌ Error importing file: Invalid format or corrupted file');
        }
    };
    reader.readAsText(file);

    // Clear the input
    event.target.value = '';
}
