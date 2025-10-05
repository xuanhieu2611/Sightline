<div align="center">

# 🔭 Sightline

**AI-Powered Accessibility Assistant for the Visually Impaired**

[![Live Demo](https://img.shields.io/badge/demo-live-success?style=for-the-badge&logo=vercel)](https://sightline-xi.vercel.app/describe)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](./LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-ready-blueviolet?style=for-the-badge)](https://web.dev/pwa/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)

[Try Live Demo](https://sightline-xi.vercel.app/describe) · [Report Bug](https://github.com/yourusername/Sightline/issues) · [Request Feature](https://github.com/yourusername/Sightline/issues)

</div>

---

## 🌟 What is Sightline?

Sightline is an AI-powered Progressive Web App (PWA) designed to help blind and low-vision individuals understand the world around them through real-time audio descriptions.

Using the phone's camera, Sightline captures what's in front of the user and generates natural, vivid spoken explanations of the scene. The app combines Google's Gemini API for visual understanding and language generation with ElevenLabs for high-quality text-to-speech narration.

The experience is designed to feel like having a personal sighted guide: users simply point their phone toward a scene (like a waterfall, street, or museum exhibit), and Sightline describes what it sees — including key objects, spatial context, colors, and atmosphere — in a clear and empathetic voice.

### 💡 The Problem We're Solving

For millions of people with visual impairments worldwide, everyday tasks like navigating unfamiliar spaces, reading signs and menus, or finding specific objects can be challenging and stressful. Traditional accessibility tools often require expensive specialized hardware or complex setups that aren't practical for daily use.

**Sightline changes that.**

We believe accessibility should be:

- ✅ **Available** - Works on any modern smartphone, no special hardware needed
- ✅ **Instant** - Get immediate audio feedback about your surroundings
- ✅ **Private** - Your data stays secure, nothing is stored without permission
- ✅ **Free** - Accessibility shouldn't come with a price tag

### 🎯 How It Works

Sightline combines cutting-edge AI with thoughtful UX design to create three core experiences:

1. **👆 Describe** - Point your camera and get instant audio descriptions

   - "Two people ahead. Door slightly right. Clear path left."
   - Perfect for navigating unfamiliar spaces

2. **📖 Read** (Coming Soon) - OCR functionality for signs and menus

   - Point at text to have it read aloud
   - Works offline with cached models

3. **🔍 Live** - Continuous real-time analysis
   - Live scanning with ongoing updates
   - Spatial awareness and object detection

---

## ✨ Features

### 🎨 Designed for Accessibility First

- **High Contrast UI** - Black background, white text, ultra-readable fonts
- **Large Touch Targets** - 60px minimum for easy interaction
- **Voice Feedback** - Every action has audio confirmation
- **Haptic Response** - Feel the app respond to your touch
- **Works Offline** - Core functionality available without internet

### 🚀 Progressive Web App

- **Install Like an App** - Add to home screen on iOS and Android
- **Lightning Fast** - Cached for instant loading
- **Offline Capable** - Access history without connection
- **Always Up-to-Date** - No app store updates needed

### 🤖 Powered by AI

- **Google Gemini AI** - State-of-the-art vision understanding
- **ElevenLabs** - Natural, human-like voice synthesis
- **Real-time Analysis** - Instant image processing and audio feedback
- **Natural Language** - Descriptions that actually make sense
- **Privacy Focused** - Images analyzed in real-time, never stored

---

## 🛠️ Tech Stack

Sightline is built with modern, production-ready technologies:

| Technology                                                                            | Purpose                            |
| ------------------------------------------------------------------------------------- | ---------------------------------- |
| **[Next.js 14](https://nextjs.org/)**                                                 | React framework with App Router    |
| **[TypeScript](https://www.typescriptlang.org/)**                                     | Type-safe development              |
| **[Google Gemini AI](https://ai.google.dev/)**                                        | Vision and language understanding  |
| **[ElevenLabs](https://elevenlabs.io/)**                                              | High-quality text-to-speech        |
| **[PWA](https://web.dev/pwa/)**                                                       | Offline-first, installable web app |
| **[Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)** | Text-to-speech output              |
| **[MediaDevices API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices)** | Camera access                      |
| **[Vercel](https://vercel.com/)**                                                     | Deployment and hosting             |

---

## 🚀 Quick Start

### Try It Now

Visit **[sightline-xi.vercel.app/describe](https://sightline-xi.vercel.app/describe)** to try Sightline instantly in your browser!

For the best experience:

1. Open the link on your smartphone
2. Tap "Add to Home Screen" for app-like experience
3. Allow camera and audio permissions
4. Start exploring!

### Run Locally

Want to contribute or run your own instance?

```bash
# Clone the repository
git clone https://github.com/yourusername/Sightline.git
cd Sightline

# Install dependencies
npm install

# Set up environment variables (required for AI features)
cat > .env.local << EOL
GEMINI_API_KEY=your_gemini_key_here
ELEVEN_LABS_API_KEY=your_elevenlabs_key_here
VOICE_ID=your_voice_id_here
EOL

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see your local instance.

### Build for Production

```bash
# Create optimized production build
npm run build

# Start production server
npm start
```

---

## 📱 Installation Guide

### iOS (Safari)

1. Visit [sightline-xi.vercel.app/describe](https://sightline-xi.vercel.app/describe)
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" to confirm

### Android (Chrome)

1. Visit [sightline-xi.vercel.app/describe](https://sightline-xi.vercel.app/describe)
2. Tap the three-dot menu
3. Select "Add to Home screen"
4. Tap "Install" or "Add"

### Desktop (Chrome/Edge)

1. Visit [sightline-xi.vercel.app/describe](https://sightline-xi.vercel.app/describe)
2. Look for the install icon in the address bar
3. Click "Install" to add as desktop app

---

## 🎯 Usage

### Basic Flow

1. **Open the App** - Launch Sightline from your home screen
2. **Grant Permissions** - Allow camera and microphone access
3. **Point Your Camera** - Aim at what you want described
4. **Tap the Button** - Large center button to capture and analyze
5. **Listen** - Audio description plays automatically

### Tips for Best Results

- 📸 **Good Lighting** - Works best in well-lit environments
- 🎯 **Steady Camera** - Hold phone still when capturing
- 🔊 **Volume Up** - Ensure phone volume is turned up
- 📶 **Online First** - AI features require internet connection
- 💾 **Offline Access** - Previous analyses available without internet

---

## 🔐 Privacy & Security

Your privacy is our top priority:

- 🚫 **No Data Collection** - We don't collect or store your data
- 🔒 **Secure by Default** - All connections use HTTPS
- 🖼️ **No Image Storage** - Photos are analyzed in real-time and discarded
- 🎤 **Local Processing** - Speech synthesis happens on your device
- 📵 **Offline Capable** - Core features work without sending data

---

## 🗺️ Roadmap

We're constantly improving Sightline. Here's what's coming:

- [ ] **OCR Text Reading** - Read signs, menus, and documents
- [ ] **Object Detection** - Find specific items (exits, restrooms, etc.)
- [ ] **Multi-language Support** - Support for 50+ languages
- [ ] **Spatial Audio** - 3D audio cues for better navigation
- [ ] **Customizable Voice** - Choose your preferred voice and speed
- [ ] **History & Bookmarks** - Save and revisit important descriptions
- [ ] **Offline AI Models** - Basic AI capabilities without internet

---

## 🙏 Acknowledgments

Sightline wouldn't be possible without:

- **[Google Gemini AI](https://ai.google.dev/)** - For powerful vision AI capabilities
- **[ElevenLabs](https://elevenlabs.io/)** - For natural, accessible voice synthesis
- **[Next.js Team](https://nextjs.org/)** - For an amazing React framework
- **[Vercel](https://vercel.com/)** - For seamless deployment
- **Accessibility Community** - For invaluable feedback and testing

Special thanks to all the beta testers who helped make Sightline better!

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 💬 Get in Touch

Have questions, suggestions, or just want to say hi?

- 🐛 [Report a Bug](https://github.com/yourusername/Sightline/issues)
- 💡 [Request a Feature](https://github.com/yourusername/Sightline/issues)
- ⭐ [Star on GitHub](https://github.com/yourusername/Sightline)

---

<div align="center">

**Made with ❤️ for accessibility**

[Try Sightline Now](https://sightline-xi.vercel.app/describe) · [Learn More](https://github.com/yourusername/Sightline)

</div>
