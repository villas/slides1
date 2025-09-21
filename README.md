# slides1
Slideshow using any monitor incl TVs



This PR implements a comprehensive real estate slideshow system that displays property information from a Firebird database with images from the Linux filesystem, designed to work seamlessly across all screen sizes including large format TVs.
Features Implemented

📱 Responsive Design System

    CSS Grid layout that adapts from mobile (768px) to large TVs (1920px+)
    Vertical stacking on mobile/tablet, side-by-side layout on desktop/TV
    Font scaling optimized for viewing distances on different screen types
    Professional gradient backgrounds with smooth animations

🏠 Property Display Components

    Brief property details (title, price, location, features)
    Feature grid showing bedrooms, bathrooms, square m, property type
    Full property descriptions with scrollable content
    Price formatting with proper currency display

⌨️ Universal Navigation System

    Keyboard controls: Arrow keys for navigation, spacebar for play/pause, Home/End for first/last
    Touch/swipe gestures for mobile devices
    Mouse click controls for desktop
    TV remote directional key compatibility

🎬 Professional Slideshow Features

    Auto-advance with 8-second intervals (configurable)
    Smooth fade transitions between properties
    Play/pause functionality with visual indicators
    Progress bar and slide counter (1/3, 2/3, etc.)
    Image preloading for seamless transitions

🔗 Backend 

    An existing source of info is available here: https://ivvdata.algarvevillaclub.com/datafeed/properties.json?type=saleonly

Implementation

The system uses pure HTML/CSS/JavaScript for maximum compatibility across browsers and devices. Key technical decisions:

    CSS Grid for responsive layouts that maintain proper proportions on any screen
    Fetch API for modern, promise-based backend communication
    Intersection Observer patterns for performance optimization
    ARIA labels and screen reader support for accessibility
    CSS Custom Properties for easy theme customization

