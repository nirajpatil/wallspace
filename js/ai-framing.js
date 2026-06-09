/**
 * ai-framing.js - AI-powered frame suggestions using Claude
 *
 * Dependencies: state.js, framing.js, utils.js
 *
 * Analyzes uploaded artwork images with Claude and automatically applies
 * a suggested frame and matte. The image upload is never blocked — analysis
 * happens asynchronously after the artwork appears on the wall.
 */

const AI_FRAMING_MODEL = 'claude-sonnet-4-6';
const AI_MAX_IMAGE_PX = 800;
const AI_JPEG_QUALITY = 0.8;

// Frame and matte options Claude knows about (must match the select options in index.html)
const FRAME_COLORS = {
    '#1a1a1a': 'Ebony',
    '#4a3728': 'Walnut',
    '#8b4513': 'Mahogany',
    '#d2b48c': 'Birch',
    '#c0c0c0': 'Silver',
    '#d4af37': 'Gold',
    '#ffffff': 'White',
    '#2c2c2c': 'Matte Black',
};

const MATTE_COLORS = {
    '#faf9f7': 'Warm White',
    '#ffffff': 'Bright White',
    '#f0ede8': 'Cream',
    '#e8e4df': 'Linen',
    '#d0cdc8': 'Warm Gray',
    '#1a1a1a': 'Black',
};

function getApiKey() {
    return localStorage.getItem('anthropicApiKey') || '';
}

// Resize image src to max AI_MAX_IMAGE_PX on longest side, return base64 JPEG
function resizeImageToBase64(imageSrc) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function () {
            const maxPx = AI_MAX_IMAGE_PX;
            let w = img.naturalWidth;
            let h = img.naturalHeight;
            if (w > maxPx || h > maxPx) {
                if (w >= h) { h = Math.round(h * maxPx / w); w = maxPx; }
                else { w = Math.round(w * maxPx / h); h = maxPx; }
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            const dataUrl = canvas.toDataURL('image/jpeg', AI_JPEG_QUALITY);
            // Strip the data URL prefix to get pure base64
            resolve(dataUrl.replace(/^data:image\/jpeg;base64,/, ''));
        };
        img.onerror = reject;
        img.src = imageSrc;
    });
}

// Show a subtle loading indicator on the artwork
function showAiLoading(artwork) {
    const indicator = document.createElement('div');
    indicator.className = 'ai-loading-indicator';
    indicator.innerHTML = '<span>✦</span>';
    artwork.appendChild(indicator);
}

function hideAiLoading(artwork) {
    const indicator = artwork.querySelector('.ai-loading-indicator');
    if (indicator) indicator.remove();
}

// Show reasoning text briefly near the artwork
function showReasoningToast(artwork, reasoning) {
    const toast = document.createElement('div');
    toast.className = 'ai-reasoning-toast';
    toast.textContent = reasoning;
    artwork.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('ai-reasoning-toast--fade');
        setTimeout(() => toast.remove(), 600);
    }, 4000);
}

// Show a small error message on the artwork
function showAiError(artwork, message) {
    const err = document.createElement('div');
    err.className = 'ai-reasoning-toast ai-reasoning-toast--error';
    err.textContent = message;
    artwork.appendChild(err);
    setTimeout(() => {
        err.classList.add('ai-reasoning-toast--fade');
        setTimeout(() => err.remove(), 600);
    }, 5000);
}

// Apply a framing suggestion object to an artwork element
function applyFramingSuggestion(artwork, suggestion) {
    const previouslySelected = selectedArtwork;
    selectedArtwork = artwork;

    // Sync sidebar dimension inputs to this artwork before calling updateSelectedArtwork()
    updateControlsFromArtwork(artwork);

    document.getElementById('sidebarHasFrame').checked = true;
    document.getElementById('sidebarFrameColor').value = suggestion.frameColor;
    document.getElementById('sidebarFrameSize').value = suggestion.frameWidth;
    document.getElementById('sidebarHasMatte').checked = suggestion.hasMatte;
    document.getElementById('sidebarMatteColor').value = suggestion.matteColor;
    document.getElementById('sidebarMatteSize').value = suggestion.matteWidth;

    updateSelectedArtwork();

    selectedArtwork = previouslySelected;
    if (previouslySelected) updateControlsFromArtwork(previouslySelected);
}

// Main entry point — call this after artwork is on the wall
async function analyzeArtworkForFraming(artwork, imageSrc) {
    const apiKey = getApiKey();
    if (!apiKey) return; // silently skip if no key configured

    showAiLoading(artwork);

    let base64Image;
    try {
        base64Image = await resizeImageToBase64(imageSrc);
    } catch (e) {
        hideAiLoading(artwork);
        showAiError(artwork, 'Could not process image for AI analysis.');
        return;
    }

    const frameColorList = Object.entries(FRAME_COLORS)
        .map(([hex, name]) => `${hex} (${name})`).join(', ');
    const matteColorList = Object.entries(MATTE_COLORS)
        .map(([hex, name]) => `${hex} (${name})`).join(', ');

    const prompt = `You are an expert art framer. Analyze this artwork image and suggest the ideal frame and matte combination.

Available frame colors: ${frameColorList}
Available matte colors: ${matteColorList}

Respond with ONLY a JSON object (no markdown, no explanation outside the JSON):
{
  "frameColor": "<exact hex from the list above>",
  "frameColorName": "<name>",
  "frameWidth": <number between 0.5 and 3, in inches>,
  "hasMatte": <true or false>,
  "matteColor": "<exact hex from the list above>",
  "matteColorName": "<name>",
  "matteWidth": <number between 0.5 and 3, in inches>,
  "reasoning": "<one sentence explaining your choice>"
}`;

    let responseData;
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true',
            },
            body: JSON.stringify({
                model: AI_FRAMING_MODEL,
                max_tokens: 512,
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: { type: 'base64', media_type: 'image/jpeg', data: base64Image },
                        },
                        { type: 'text', text: prompt },
                    ],
                }],
            }),
        });

        responseData = await response.json();

        if (!response.ok) {
            const errMsg = (responseData && responseData.error && responseData.error.message)
                ? responseData.error.message
                : `API error ${response.status}`;
            console.error('AI framing API error:', responseData);
            throw new Error(errMsg);
        }
    } catch (e) {
        console.error('AI framing request failed:', e, responseData);
        hideAiLoading(artwork);
        showAiError(artwork, `AI framing unavailable: ${e.message}`);
        return;
    }

    hideAiLoading(artwork);

    let suggestion;
    try {
        const rawText = responseData.content[0].text;
        // Strip markdown code fences if present
        const cleaned = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
        suggestion = JSON.parse(cleaned);
    } catch (e) {
        console.error('AI framing: failed to parse response JSON', responseData);
        showAiError(artwork, 'AI framing: unexpected response format.');
        return;
    }

    if (!artwork.isConnected) return;

    applyFramingSuggestion(artwork, suggestion);

    if (suggestion.reasoning) {
        showReasoningToast(artwork, suggestion.reasoning);
    }
}
