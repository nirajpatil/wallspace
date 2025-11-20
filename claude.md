# Wallspace - Wall Art Arrangement Planner

## Project Overview

Wallspace is a web-based gallery wall planning application that helps users design and visualize their perfect wall art arrangements before hanging them. Users can upload artwork images, arrange them on a virtual wall with customizable dimensions, add frames and mattes, and save multiple layout designs.

## Tech Stack

- **HTML5**: Semantic markup and structure
- **CSS3**: Styling with flexbox/grid layouts
- **Vanilla JavaScript**: No frameworks - pure JavaScript for all functionality
- **localStorage**: Client-side data persistence for saved layouts
- **FileReader API**: Image upload and preview functionality

## Key Features

### Wall Configuration
- Customizable wall dimensions (inches or centimeters)
- Adjustable wall color
- Optional wall background image upload
- Real-time wall preview with responsive scaling

### Artwork Management
- Multi-image upload support (JPG, PNG, GIF)
- Drag-and-drop positioning on the wall
- Resize with aspect ratio locking
- Individual artwork dimension controls

### Framing & Matting
- Toggle frame and matte individually
- Multiple frame color options (brown, black, white, silver, gold, birch)
- Multiple matte color options (off-white, white, light gray, cream, black)
- Adjustable frame and matte widths
- Real-time preview of framing effects

### Layout Management
- Save multiple gallery wall layouts
- Name and organize saved layouts
- Load previously saved layouts
- Delete unwanted layouts
- Export layouts to JSON file
- Import layouts from JSON file (cross-device sync)

### Measurement System
- Dual unit support (inches/centimeters)
- Independent unit selection for wall and artwork
- Automatic conversion between units
- Precise dimension input

## File Structure

```
wallspace/
├── index.html      # Main application (HTML + JavaScript)
├── styles.css      # Application styling
├── README.md       # Project documentation
└── claude.md       # This file
```

## How to Run

This is a static web application with no build process or dependencies.

### Local Development
1. Open `index.html` directly in a web browser
2. Or use a local server:
   ```bash
   python -m http.server 8000
   # Then open http://localhost:8000
   ```

### Testing
- Test in multiple browsers (Chrome, Firefox, Safari, Edge)
- Test image upload with various file formats
- Test localStorage persistence (save/load layouts)
- Test import/export functionality
- Test unit conversion (inches ↔ cm)

## Code Architecture

### State Management
- Global variables manage application state
- `selectedArtwork`: Currently selected artwork element
- `artworkAspectRatios`: Map storing original image aspect ratios
- `savedLayouts`: Array of saved layout objects
- `wallScale`: Scaling factor for wall display

### Unit Conversion System
- `currentUnits`: Wall measurement units
- `currentArtworkUnits`: Artwork measurement units
- `inchesToCm()` / `cmToInches()`: Conversion functions
- `unitsToPixels()` / `pixelsToUnits()`: Display conversion

### Event Handlers
- Mouse events for drag-and-drop
- Mouse events for resize handles
- File upload handlers for images
- Form change handlers for real-time updates

### Data Persistence
- `localStorage` stores layouts as JSON
- `saveLayoutsToStorage()`: Persists to localStorage
- `loadSavedLayouts()`: Loads from localStorage
- `exportLayouts()`: Downloads JSON file
- `importLayouts()`: Uploads JSON file

## Development Guidelines

### Adding New Features
1. Maintain vanilla JavaScript approach (no frameworks)
2. Keep all code in single HTML file for simplicity
3. Use semantic HTML and accessible markup
4. Test localStorage quota limits for large images
5. Ensure mobile responsiveness

### Code Style
- Use camelCase for JavaScript variables/functions
- Use kebab-case for CSS classes
- Add comments for complex calculations
- Keep functions focused and single-purpose

### Known Limitations
- Large base64 images can exceed localStorage quota (5-10MB limit)
- No undo/redo functionality
- No collaborative features (single user only)
- No print/PDF export
- Desktop-focused UI (limited mobile support)

## Future Enhancement Ideas

- Undo/redo functionality
- Keyboard shortcuts for common actions
- Grid/alignment guides
- Auto-arrange suggestions
- Print/PDF export
- Social sharing
- Template gallery
- Mobile app version
- Multi-wall projects
- Collaboration features

## Browser Compatibility

- Chrome/Edge: ✓ Full support
- Firefox: ✓ Full support
- Safari: ✓ Full support
- Mobile browsers: ⚠️ Limited (touch events not optimized)

## Performance Considerations

- Image base64 encoding can be memory intensive
- localStorage has size limits (typically 5-10MB)
- Recommend limiting image sizes before upload
- Consider image compression for production use

## Security Notes

- All data stored client-side only
- No server communication
- No authentication required
- Images stored as base64 in localStorage
- Safe to use with personal artwork images
