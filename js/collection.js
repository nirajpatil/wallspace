/**
 * collection.js - Collection management for Wallspace
 *
 * Dependencies: utils.js, state.js, artwork.js
 *
 * This file handles the collection feature:
 * - Upload images to collection (not directly to wall)
 * - Display collection items with thumbnails
 * - Drag collection items to wall
 * - Delete items from collection
 * - Persist collection to localStorage
 *
 * Key functions:
 * - handleCollectionUpload(event) - Process uploaded collection images
 * - renderCollectionList() - Display collection items in sidebar
 * - handleCollectionDragStart/End(event) - Drag event handlers
 * - deleteFromCollection(itemId) - Remove item from collection
 * - saveCollection() / loadCollection() - Persistence
 * - initCollectionDropZone() - Set up wall as drop target
 * - createArtworkFromCollection(item, x, y) - Add collection item to wall
 */

// Handle file upload to collection
function handleCollectionUpload(event) {
    const files = event.target.files;

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const item = {
                id: 'collection-' + (++collectionCounter),
                src: e.target.result,
                name: file.name,
                dateAdded: Date.now()
            };
            collectionItems.push(item);
            renderCollectionList();
            saveCollection();
        };
        reader.readAsDataURL(file);
    });

    // Reset input so same file can be uploaded again
    event.target.value = '';
}

// Render the collection list in sidebar
function renderCollectionList() {
    const list = document.getElementById('collectionList');

    if (collectionItems.length === 0) {
        list.innerHTML = '<div style="color: #999; font-size: 13px; padding: 10px 0;">No images in collection. Upload images above.</div>';
        return;
    }

    list.innerHTML = collectionItems.map(item => `
        <div class="collection-item"
             draggable="true"
             data-collection-id="${item.id}">
            <img class="collection-item-thumbnail" src="${item.src}" alt="${item.name}">
            <span class="collection-item-name" title="${item.name}">${item.name}</span>
            <span class="collection-item-delete" onclick="deleteFromCollection('${item.id}')" title="Remove from collection">&times;</span>
        </div>
    `).join('');

    // Add drag event listeners to each item
    list.querySelectorAll('.collection-item').forEach(item => {
        item.addEventListener('dragstart', handleCollectionDragStart);
        item.addEventListener('dragend', handleCollectionDragEnd);
    });
}

// Drag start - store the collection item ID
function handleCollectionDragStart(event) {
    event.target.classList.add('dragging');
    event.dataTransfer.setData('text/plain', event.target.dataset.collectionId);
    event.dataTransfer.effectAllowed = 'copy';
}

// Drag end - remove visual feedback
function handleCollectionDragEnd(event) {
    event.target.classList.remove('dragging');
}

// Delete item from collection
function deleteFromCollection(itemId) {
    collectionItems = collectionItems.filter(item => item.id !== itemId);
    renderCollectionList();
    saveCollection();
}

// Save collection to localStorage
function saveCollection() {
    try {
        localStorage.setItem('wallspace_collection', JSON.stringify({
            items: collectionItems,
            counter: collectionCounter
        }));
    } catch (e) {
        console.warn('Failed to save collection to localStorage:', e);
        if (e.name === 'QuotaExceededError') {
            alert('Storage limit reached. Consider removing some images from your collection.');
        }
    }
}

// Load collection from localStorage
function loadCollection() {
    try {
        const saved = localStorage.getItem('wallspace_collection');
        if (saved) {
            const data = JSON.parse(saved);
            collectionItems = data.items || [];
            collectionCounter = data.counter || 0;
        }
    } catch (e) {
        console.warn('Failed to load collection from localStorage:', e);
    }
    // Always render the list (shows empty state if no items)
    renderCollectionList();
}

// Initialize drop zone on wall container
function initCollectionDropZone() {
    const wallContainer = document.getElementById('wallContainer');

    wallContainer.addEventListener('dragover', function(e) {
        // Only handle collection item drags
        if (e.dataTransfer.types.includes('text/plain')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            wallContainer.classList.add('drag-over');
        }
    });

    wallContainer.addEventListener('dragleave', function(e) {
        // Only remove class if leaving the container (not entering a child)
        if (!wallContainer.contains(e.relatedTarget)) {
            wallContainer.classList.remove('drag-over');
        }
    });

    wallContainer.addEventListener('drop', function(e) {
        e.preventDefault();
        wallContainer.classList.remove('drag-over');

        const collectionId = e.dataTransfer.getData('text/plain');
        if (!collectionId || !collectionId.startsWith('collection-')) return;

        const item = collectionItems.find(i => i.id === collectionId);
        if (!item) return;

        // Calculate drop position relative to wall
        const rect = wallContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Create artwork at drop position
        createArtworkFromCollection(item, x, y);
    });
}

// Create artwork on wall from collection item
function createArtworkFromCollection(item, x, y) {
    const wallContainer = document.getElementById('wallContainer');

    const artwork = document.createElement('div');
    artwork.className = 'artwork';
    artwork.id = 'artwork-' + (++artworkCounter);

    // Default size: 11 inches height with proportionate width
    const defaultHeight = 11;
    const defaultHeightPixels = unitsToPixels(defaultHeight, 'inches');

    // Create a temporary image to get natural dimensions
    const tempImg = new Image();
    tempImg.onload = function() {
        const aspectRatio = tempImg.naturalWidth / tempImg.naturalHeight;
        artworkAspectRatios.set(artwork.id, aspectRatio);

        // Set size maintaining aspect ratio
        const defaultWidth = defaultHeight * aspectRatio;
        const defaultWidthPixels = unitsToPixels(defaultWidth, 'inches');

        artwork.style.width = defaultWidthPixels + 'px';
        artwork.style.height = defaultHeightPixels + 'px';

        // Center the artwork on drop position
        const centeredX = Math.max(0, x - defaultWidthPixels / 2);
        const centeredY = Math.max(0, y - defaultHeightPixels / 2);

        // Keep within wall bounds
        const maxX = wallContainer.offsetWidth - defaultWidthPixels;
        const maxY = wallContainer.offsetHeight - defaultHeightPixels;

        artwork.style.left = Math.min(centeredX, maxX) + 'px';
        artwork.style.top = Math.min(centeredY, maxY) + 'px';
    };
    tempImg.src = item.src;

    artwork.innerHTML = `
        <div class="frame" style="display: none;">
            <div class="matte" style="display: none;">
                <div class="image-container">
                    <img src="${item.src}" alt="Artwork">
                </div>
            </div>
        </div>
        <img src="${item.src}" alt="Artwork" class="direct-img">
        <div class="resize-handle"></div>
    `;

    // Initial position (will be adjusted when image loads)
    artwork.style.left = Math.max(0, x - defaultHeightPixels / 2) + 'px';
    artwork.style.top = y + 'px';
    artwork.style.width = defaultHeightPixels + 'px'; // Placeholder, will be updated
    artwork.style.height = defaultHeightPixels + 'px';

    wallContainer.appendChild(artwork);
    setupArtworkEvents(artwork);

    // Select the newly added artwork
    selectArtwork(artwork);
}

// Initialize collection module
function initCollection() {
    // Set up file input listener
    const fileInput = document.getElementById('collectionFileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleCollectionUpload);
    }

    // Load saved collection
    loadCollection();

    // Set up drop zone
    initCollectionDropZone();
}
