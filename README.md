# Real Estate Slideshow

A responsive slideshow system for displaying real estate properties that works seamlessly on all screen sizes, from mobile devices to large format TVs.

## Features

- 📱 **Fully Responsive** - Adapts to any screen size including large TVs
- 🏠 **Property Display** - Shows property details, features, and images
- ⌨️ **Keyboard Navigation** - Full keyboard support for TV remotes
- 🎮 **Touch/Swipe Support** - Mobile-friendly navigation
- 🔄 **Auto-advance** - Automatic slideshow progression with pause/play
- 🔗 **API Integration** - Ready for Firebird database backend
- ♿ **Accessibility** - Screen reader support and ARIA labels
- 🎨 **Modern Design** - Beautiful gradient backgrounds and smooth animations

## Screenshots

### Desktop/TV View
![Desktop View](https://github.com/user-attachments/assets/6fa973a5-09c6-468b-bc7a-0314dca244c3)

### Mobile/Tablet View  
![Mobile View](https://github.com/user-attachments/assets/1d12cd61-46c8-451c-a863-27727f03a758)

### Large TV View (1920x1080)
![TV View](https://github.com/user-attachments/assets/14b50498-95d9-48a2-a1ad-165eb7dd5f04)

## Usage

1. **Open the slideshow**: Navigate to `index.html` in any modern browser
2. **Navigation**:
   - Click arrow buttons or use arrow keys to navigate
   - Press spacebar to pause/play auto-advance
   - Swipe left/right on touch devices
   - Use TV remote directional keys

## API Integration

The slideshow is designed to work with your Python backend system. Configure the API endpoints in `api.js`:

### Expected API Endpoints

```
GET /api/properties
GET /api/properties/{id}  
GET /api/properties/{id}/images
```

### Property Data Format

```json
{
  "id": 1,
  "title": "Luxury Waterfront Villa",
  "price": 2850000,
  "address": "123 Ocean Drive",
  "city": "Miami Beach",
  "state": "FL",
  "zip": "33139",
  "bedrooms": 5,
  "bathrooms": 4.5,
  "area": 4200,
  "type": "Villa",
  "year_built": 2018,
  "garage_spaces": 3,
  "description": "Stunning waterfront villa..."
}
```

### Image Data Format

```json
[
  {
    "url": "/images/property1/main.jpg",
    "thumbnail": "/images/property1/thumb.jpg", 
    "alt": "Property front view",
    "caption": "Beautiful entrance"
  }
]
```

## Customization

- **Auto-advance timing**: Modify `autoAdvanceDelay` in `slideshow.js`
- **Colors/styling**: Update CSS custom properties in `styles.css`  
- **API endpoints**: Configure base URL in `api.js`
- **Screen size breakpoints**: Adjust media queries in `styles.css`

## Browser Support

- Chrome/Edge 60+
- Firefox 55+
- Safari 12+
- Modern Smart TV browsers

## Files

- `index.html` - Main slideshow page
- `styles.css` - Responsive styling and animations
- `slideshow.js` - Slideshow controller and navigation
- `api.js` - API integration and data handling
