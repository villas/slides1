# Agent Guidelines for slides1

## Commands
- **Serve locally**: Open `index.html` in a web browser or use a local server like `python -m http.server`
- **No build process**: Pure HTML/CSS/JS - no compilation required
- **No tests**: No test framework configured
- **No linting**: No linter configured

## Code Style
- **Language**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Imports**: Use ES6 modules with relative paths (`import { func } from './utils.js'`)
- **Formatting**: 2-space indentation, consistent with existing code
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Types**: No TypeScript - use JSDoc for documentation if needed
- **Error handling**: Use try/catch for async operations, console.error for debugging
- **Accessibility**: Include ARIA labels, keyboard navigation support
- **Performance**: Use Intersection Observer, image preloading, efficient DOM manipulation