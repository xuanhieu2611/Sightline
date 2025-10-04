# Sightline - Accessibility Assistant PWA

A Progressive Web App (PWA) designed to provide AI-powered accessibility assistance for navigation and reading assistance.

## Features

### Core User Flows

1. **Tap** - Scan surroundings for navigation assistance

   - Audio feedback with spatial awareness
   - Haptic feedback for touch interactions
   - Contextual responses like "Two people ahead. Door slightly right. Clear path left."

2. **Read** - OCR functionality for signs and menus

   - Point camera at text to read
   - Short headline first, then "Read all?" option
   - Works offline with cached models

3. **Find** - Object detection for specific targets
   - Choose target (Exit, Restroom, Elevator, etc.)
   - Continuous scanning with updates
   - Responses like "Exit sign, 1 o'clock, near"

### UX Principles

- **One giant action button** - Tap to act, long-press to repeat last action
- **Voice lines < 3s** - Never spam audio
- **High contrast design** - Black background, white text, 20+ pt fonts
- **Large hit areas** - 60px minimum touch targets
- **Works offline** - History + basic OCR functionality
- **Privacy-first** - No storage unless user saves

## PWA Features

### Manifest Requirements ✅

- `manifest.json` with name, short_name, icons, theme_color
- `display: "standalone"` for app-like experience
- `start_url: "/"` for proper launching

### Service Worker ✅

- Caches shell and offline page
- Caches last results for offline access
- Background sync when connection restored

### iOS Optimizations ✅

- Viewport meta tag for proper scaling
- Apple touch icon
- Status bar style configuration
- "Add to Home Screen" instructions

### Lighthouse PWA Score

- Target: ≥ 90
- Installable, offline-capable, fast loading

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

### PWA Testing

1. Build the application: `npm run build`
2. Start production server: `npm start`
3. Open Chrome DevTools
4. Go to Lighthouse tab
5. Run PWA audit
6. Target score: ≥ 90

### Icon Generation

Visit `/icons/create-icons.html` to generate proper PWA icons.

## Architecture

### Components

- `TapButton` - Main scanning functionality
- `ReadButton` - OCR for text reading
- `FindButton` - Object detection and targeting
- `VoiceFeedback` - Text-to-speech output
- `StatusIndicator` - Online/offline status

### Service Worker

- Caches essential files for offline use
- Handles background sync
- Provides offline fallback page

### Styling

- High contrast theme (black/white)
- Large touch targets (60px minimum)
- Accessible typography (20+ pt fonts)
- Responsive design for mobile-first

## Accessibility Features

1. **High Contrast Design** - Black/white theme for visual accessibility
2. **Large Touch Targets** - 60px minimum for motor accessibility
3. **Voice Feedback** - Text-to-speech for all actions
4. **Haptic Feedback** - Vibration for touch interactions
5. **Keyboard Navigation** - Full keyboard support
6. **Screen Reader Support** - Proper ARIA labels and semantic HTML

## Browser Support

- Chrome/Edge (full PWA support)
- Safari (iOS PWA support)
- Firefox (basic PWA support)

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel --prod
```

### Netlify

```bash
npm run build
# Deploy dist folder to Netlify
```

### Manual Deployment

1. Run `npm run build`
2. Upload the `.next` folder to your server
3. Configure server for Next.js

## Privacy & Security

- **No data collection** - All processing happens locally
- **Offline-first** - Works without internet connection
- **No tracking** - No analytics or user tracking
- **Secure** - HTTPS required for PWA features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test PWA functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
