/**
 * catalog.js - Artwork catalog for Wallspace
 *
 * Dependencies: utils.js, state.js, wall.js, framing.js, artwork.js
 *
 * Manages a persistent catalog of physical artwork with dimensions and metadata.
 * Users import a CSV file once and point to their image folder. Catalog items
 * can be dragged onto the wall and are placed at their correct physical dimensions.
 *
 * CSV format (header row required):
 *   name,width_mm,height_mm,has_frame,is_art
 *   colorful batman,728,528,yes,yes
 *
 * Key functions:
 * - initCatalog() - wire event listeners and load from storage
 * - handleCSVImport(event) - parse and merge a CSV file
 * - handleCSVReplace() - clear catalog then import fresh CSV
 * - selectImageFolder() - File System Access API folder picker (Chrome/Edge)
 * - createArtworkFromCatalog(item, x, y) - place artwork on wall
 */

// ─── CSV PARSING ─────────────────────────────────────────────────────────────

function parseCatalogCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    return lines.slice(1).map(line => {
        const parts = line.split(',').map(s => s.trim());
        const [name, widthMm, heightMm, hasFrame, isArt] = parts;
        if (!name || !widthMm || !heightMm) return null;
        const w = parseFloat(widthMm);
        const h = parseFloat(heightMm);
        if (isNaN(w) || isNaN(h)) return null;
        return {
            name,
            widthMm:  w,
            heightMm: h,
            hasFrame: hasFrame?.toLowerCase() === 'yes',
            isArt:    isArt?.toLowerCase()    !== 'no',
            src:      null,
        };
    }).filter(Boolean);
}

// ─── FILENAME NORMALIZATION ───────────────────────────────────────────────────

function normalizeName(str) {
    return str
        .toLowerCase()
        .replace(/\.[^/.]+$/, '')    // strip extension
        .replace(/[_\-.]+/g, ' ')   // underscores/hyphens/dots → space
        .replace(/\s+/g, ' ')
        .trim();
}

// ─── IMAGE FOLDER PICKER ─────────────────────────────────────────────────────

async function selectImageFolder() {
    if (!window.showDirectoryPicker) {
        setCatalogStatus('Folder picker requires Chrome or Edge.');
        return;
    }
    let dirHandle;
    try {
        dirHandle = await window.showDirectoryPicker();
    } catch (e) {
        return; // user cancelled
    }

    let matched = 0;
    const unmatched = [];

    for await (const [filename, fileHandle] of dirHandle.entries()) {
        if (fileHandle.kind !== 'file') continue;
        const file = await fileHandle.getFile();
        console.log('[Catalog] Folder file:', filename, file.type);
        if (!file.type.startsWith('image/')) continue;

        const normFile = normalizeName(filename);
        const item = catalogItems.find(i => normalizeName(i.name) === normFile)
                  || catalogItems.find(i => {
                         const n = normalizeName(i.name);
                         return n.length >= 5 && normFile.includes(n);
                     });

        if (item) {
            compressAndAssign(file, item);
            matched++;
        } else {
            unmatched.push(filename);
        }
    }

    const msg = `${matched} image${matched !== 1 ? 's' : ''} matched.` +
        (unmatched.length ? ` Unmatched: ${unmatched.join(', ')}` : '');
    setCatalogStatus(msg);
}

// ─── IMAGE COMPRESSION + ASSIGNMENT ─────────────────────────────────────────

function compressAndAssign(file, catalogItem) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const MAX = 600;
            const scale = Math.min(1, MAX / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width  = Math.round(img.width  * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            catalogItem.src = canvas.toDataURL('image/jpeg', 0.75);
            try {
                saveCatalog();
            } catch (e) {
                setCatalogStatus('Storage full — delete saved layouts or collection images to free space.');
            }
            renderCatalogList();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ─── DIMENSION CONVERSION ────────────────────────────────────────────────────

function mmToPixels(mm) {
    return unitsToPixels(mm / 25.4, 'inches');
}

// ─── PLACE ARTWORK ON WALL ───────────────────────────────────────────────────

function createArtworkFromCatalog(item, x, y) {
    const wallContainer = document.getElementById('wallContainer');

    let imgWidthPx, imgHeightPx;
    if (item.widthMm && item.heightMm) {
        imgWidthPx  = mmToPixels(item.widthMm);
        imgHeightPx = mmToPixels(item.heightMm);
    } else {
        // Manual upload — start square at 11", correct aspect ratio once image loads
        imgHeightPx = unitsToPixels(11, 'inches');
        imgWidthPx  = imgHeightPx;
    }

    const artwork = document.createElement('div');
    artwork.className = 'artwork';
    artwork.id = 'artwork-' + (++artworkCounter);
    artwork.dataset.catalogId = item.id;

    if (item.widthMm && item.heightMm) {
        artworkAspectRatios.set(artwork.id, item.widthMm / item.heightMm);
    }

    const imgSrc = item.src || buildPlaceholderSrc(item.name);

    artwork.innerHTML = `
        <div class="frame" style="display:none;">
            <div class="matte" style="display:none;">
                <div class="image-container">
                    <img src="${imgSrc}" alt="${item.name}">
                </div>
            </div>
        </div>
        <img src="${imgSrc}" alt="${item.name}" class="direct-img">
        <div class="resize-handle"></div>
    `;

    const totalWidthPx  = imgWidthPx;
    const totalHeightPx = imgHeightPx;

    // For manual uploads, correct aspect ratio once the image loads
    if (!item.widthMm && item.src) {
        const tmpImg = new Image();
        tmpImg.onload = function() {
            const ar = tmpImg.naturalWidth / tmpImg.naturalHeight;
            artworkAspectRatios.set(artwork.id, ar);
            const h = unitsToPixels(11, 'inches');
            const w = h * ar;
            artwork.style.width  = w + 'px';
            artwork.style.height = h + 'px';
        };
        tmpImg.src = item.src;
    }

    const left = Math.max(0, Math.min(x - totalWidthPx / 2, wallContainer.offsetWidth  - totalWidthPx));
    const top  = Math.max(0, Math.min(y - totalHeightPx / 2, wallContainer.offsetHeight - totalHeightPx));

    artwork.style.left   = left + 'px';
    artwork.style.top    = top  + 'px';
    artwork.style.width  = totalWidthPx  + 'px';
    artwork.style.height = totalHeightPx + 'px';

    wallContainer.appendChild(artwork);
    setupArtworkEvents(artwork);

    if (item.src && typeof analyzeArtworkForFraming === 'function') {
        analyzeArtworkForFraming(artwork, item.src);
    }
}

function buildPlaceholderSrc(name) {
    const label = name.length > 22 ? name.slice(0, 20) + '…' : name;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
        <rect width="200" height="200" fill="#e0d8d0"/>
        <text x="100" y="105" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#7a6a5a">${label}</text>
    </svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

// ─── DRAG HANDLERS ───────────────────────────────────────────────────────────

function handleCatalogDragStart(e) {
    const id = e.currentTarget.dataset.catalogId;
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'copy';
    e.currentTarget.classList.add('dragging');
}

function handleCatalogDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
}

// ─── DROP ZONE ───────────────────────────────────────────────────────────────

function initCatalogDropZone() {
    const wallContainer = document.getElementById('wallContainer');

    wallContainer.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });

    wallContainer.addEventListener('drop', function(e) {
        const id = e.dataTransfer.getData('text/plain');
        if (!id || !id.startsWith('catalog-')) return;

        e.preventDefault();

        const item = catalogItems.find(i => i.id === id);
        if (!item) return;

        const rect = wallContainer.getBoundingClientRect();
        createArtworkFromCatalog(item, e.clientX - rect.left, e.clientY - rect.top);
    });
}

// ─── RENDER CATALOG LIST ─────────────────────────────────────────────────────

function renderCatalogList() {
    const list = document.getElementById('catalogList');
    if (!list) return;
    if (!catalogItems.length) {
        list.innerHTML = '<div style="color:#999;font-size:12px;padding:8px 0;">No catalog items. Import a CSV file above.</div>';
        return;
    }
    list.innerHTML = catalogItems.map(item => {
        const thumbStyle = item.src
            ? `background-image:url('${item.src}')`
            : '';
        const dims = `${item.widthMm}×${item.heightMm}mm${item.hasFrame ? ' · framed' : ''}`;
        return `<div class="catalog-item" draggable="true" data-catalog-id="${item.id}">
            <div class="catalog-item-thumb" style="${thumbStyle}"></div>
            <div class="catalog-item-info">
                <span class="catalog-item-name" title="${item.name}">${item.name}</span>
                <span class="catalog-item-dims">${dims}</span>
            </div>
            <span class="catalog-item-delete" onclick="deleteFromCatalog('${item.id}')" title="Remove">&times;</span>
        </div>`;
    }).join('');

    list.querySelectorAll('.catalog-item').forEach(el => {
        el.addEventListener('dragstart', handleCatalogDragStart);
        el.addEventListener('dragend',   handleCatalogDragEnd);
    });
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

function deleteFromCatalog(id) {
    catalogItems = catalogItems.filter(i => i.id !== id);
    saveCatalog();
    renderCatalogList();
}

// ─── STORAGE ─────────────────────────────────────────────────────────────────

function saveCatalog() {
    localStorage.setItem('wallspace_catalog', JSON.stringify({
        items:   catalogItems,
        counter: catalogCounter,
    }));
}

function loadCatalog() {
    try {
        const saved = localStorage.getItem('wallspace_catalog');
        if (saved) {
            const data = JSON.parse(saved);
            catalogItems   = data.items   || [];
            catalogCounter = data.counter || 0;
        }
    } catch (e) {
        console.warn('Failed to load catalog:', e);
    }
    renderCatalogList();
}

// ─── CSV IMPORT ──────────────────────────────────────────────────────────────

function handleCSVImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    readCSVFile(file, false);
    event.target.value = '';
}

function handleCSVReplace() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (!confirm(`Replace all ${catalogItems.length} catalog entries with the new CSV?`)) return;
        readCSVFile(file, true);
    };
    input.click();
}

function readCSVFile(file, replace) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const raw = e.target.result;
        console.log('[Catalog] CSV raw (first 200 chars):', raw.slice(0, 200));
        const parsed = parseCatalogCSV(raw);
        console.log('[Catalog] Parsed rows:', parsed.length, parsed);
        if (!parsed.length) {
            setCatalogStatus('No valid rows found. Check the console (F12) for details and make sure the CSV has a header row.');
            return;
        }
        const newItems = parsed.map(p => ({
            id: 'catalog-' + (++catalogCounter),
            ...p,
        }));
        if (replace) {
            catalogItems = newItems;
        } else {
            catalogItems.push(...newItems);
        }
        try {
            saveCatalog();
        } catch (e) {
            setCatalogStatus('Storage full — free space and try again.');
            return;
        }
        renderCatalogList();
        setCatalogStatus(`${replace ? 'Replaced catalog with' : 'Imported'} ${newItems.length} piece${newItems.length !== 1 ? 's' : ''}.`);
    };
    reader.readAsText(file);
}

// ─── STATUS ──────────────────────────────────────────────────────────────────

function setCatalogStatus(msg) {
    const el = document.getElementById('catalogStatus');
    if (el) el.textContent = msg;
}

// ─── MANUAL IMAGE UPLOAD ─────────────────────────────────────────────────────

function handleManualUpload(event) {
    const files = event.target.files;
    if (!files.length) return;

    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!imageFiles.length) return;
    let added = 0;
    imageFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const MAX = 600;
                const scale = Math.min(1, MAX / Math.max(img.width, img.height));
                const canvas = document.createElement('canvas');
                canvas.width  = Math.round(img.width  * scale);
                canvas.height = Math.round(img.height * scale);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                const item = {
                    id:       'catalog-' + (++catalogCounter),
                    name:     file.name.replace(/\.[^/.]+$/, ''),
                    widthMm:  null,
                    heightMm: null,
                    hasFrame: false,
                    isArt:    true,
                    src:      canvas.toDataURL('image/jpeg', 0.75),
                };
                catalogItems.push(item);
                added++;
                try { saveCatalog(); } catch (e) {
                    setCatalogStatus('Storage full — free space and try again.');
                }
                renderCatalogList();
                if (added === imageFiles.length) {
                    setCatalogStatus(`Added ${added} image${added !== 1 ? 's' : ''}.`);
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
    event.target.value = '';
}

// ─── INIT ────────────────────────────────────────────────────────────────────

function initCatalog() {
    const csvInput = document.getElementById('catalogCSVInput');
    if (csvInput) csvInput.addEventListener('change', handleCSVImport);
    const manualInput = document.getElementById('catalogManualInput');
    if (manualInput) manualInput.addEventListener('change', handleManualUpload);
    loadCatalog();
    initCatalogDropZone();
}
