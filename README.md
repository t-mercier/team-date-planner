# Team Date Planner

A simple, elegant desktop application for teams to find the best date for drinks, dinner, or any group event. Built with Electron.

## Features

- 📅 **Visual Calendar**: Click dates to mark your availability
- 👥 **Team Collaboration**: Share availability through a common file
- 🎯 **Smart Recommendations**: Automatically highlights dates with the most people available
- 💾 **Local Storage**: All data stays on your computer
- 🎨 **Modern UI**: Clean, intuitive interface with smooth animations
- ♿ **Accessible**: Built with keyboard navigation and screen reader support

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm start
   ```

## How It Works

1. **Enter your name**: Your name identifies your availability selections
2. **Select dates**: Click on calendar dates when you're available
3. **Save**: Click "Save my availability" to store your choices
4. **Share**: Place this app folder in a shared drive (Teams, Dropbox, Google Drive, etc.)
5. **Collaborate**: Teammates run the app from the same folder to merge everyone's availability
6. **Find best dates**: Switch to the "Best dates" tab to see which dates work for the most people

## Technical Details

### Architecture

The application is built with a clean, modular architecture:

- **index.html** (182 lines): Semantic HTML structure
- **styles.css** (811 lines): Organized CSS with design tokens
- **app.js** (499 lines): Modular JavaScript with clear separation of concerns
- **main.js**: Electron main process
- **preload.js**: IPC bridge between renderer and main process

### JavaScript Modules

The application is organized into logical modules:

- **State Management**: Centralized application state
- **DOM Elements**: Cached element references
- **Utilities**: Shared helper functions (date formatting, pluralization)
- **UI Updates**: Interface update functions
- **Calendar**: Calendar rendering and interaction
- **Summary**: Best dates view
- **Profiles**: User profile management
- **Data**: API communication and persistence
- **Tabs**: Tab switching logic
- **Event Handlers**: User interaction handling

### CSS Organization

Styles are organized with:

- **CSS Variables**: 25+ design tokens for colors, spacing, shadows, and radii
- **Logical Sections**: Theme, layout, components, responsive design
- **Modern Features**: Smooth scrolling, focus outlines, ARIA support

### Accessibility

- ✅ Keyboard navigation support
- ✅ ARIA attributes for screen readers
- ✅ Proper tab/tabpanel relationships
- ✅ Focus outlines for keyboard users
- ✅ Semantic HTML structure

## Data Storage

The application stores availability data in `availability.json` in the same folder as the app. This file is structured as:

```json
{
  "2024-01-15": {
    "Alice": true,
    "Bob": true
  },
  "2024-01-16": {
    "Alice": true
  }
}
```

## Development

### Code Quality

- Modular architecture with clear separation of concerns
- No code duplication
- Consistent naming conventions
- Comprehensive error handling

### Browser Compatibility

Built with modern web standards:
- ES6+ JavaScript
- CSS Variables
- Flexbox and Grid layouts

## Recent Improvements (v2.0)

This version includes a major refactoring focused on:

✅ **Code Organization**
- Separated HTML, CSS, and JavaScript into individual files
- Reduced HTML from 1,328 lines to 182 lines (86% reduction)
- Modular JavaScript architecture

✅ **Visual Polish**
- Enhanced hover states and transitions
- Better visual feedback on interactive elements
- Improved color contrast
- Modern design with smooth animations

✅ **Accessibility**
- ARIA attributes for screen readers
- Keyboard navigation support
- Focus outlines for keyboard users

✅ **Code Quality**
- Eliminated code duplication
- Better error handling
- Improved maintainability

See [REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md) for detailed changes.

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
