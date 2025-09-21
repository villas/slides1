# Real Estate Slideshow

A responsive real estate property slideshow that displays Algarve properties from the Algarve Villa Club API.

## Features

- 📱 **Responsive Design**: Adapts from mobile to TV screens
- 🏠 **Property Display**: Shows images, prices, locations, and details
- ⌨️ **Universal Navigation**: Keyboard, touch, and mouse controls
- 🎬 **Auto-advancing Slideshow**: 8-second intervals with play/pause
- 📊 **Progress Indicators**: Visual progress bar and slide counter
- ♿ **Accessibility**: ARIA labels and keyboard navigation

## Controls

- **Arrow Keys**: Navigate between properties
- **Spacebar**: Play/pause slideshow
- **Home/End**: Jump to first/last property
- **Touch/Swipe**: Mobile navigation
- **Mouse Clicks**: Click left/right side of image

## Local Development

```bash
# Start local server
python3 -m http.server 8000
# or
node server.js

# Open http://localhost:8000
```

## GitHub Pages Deployment

1. Create a new GitHub repository
2. Upload all files (`index.html`, `styles.css`, `script.js`)
3. Go to repository Settings → Pages
4. Set source to "Deploy from a branch"
5. Select "main" branch and "/ (root)" folder
6. Save and wait for deployment

The slideshow will be available at: `https://yourusername.github.io/repository-name/`

## API Integration

Fetches property data from: `https://ivvdata.algarvevillaclub.com/datafeed/properties.json?type=saleonly`

If CORS issues occur, falls back to sample data.

## Browser Compatibility

Works on all modern browsers including:
- Chrome/Chromium
- Firefox
- Safari
- Edge
- LG WebOS (TV browsers)