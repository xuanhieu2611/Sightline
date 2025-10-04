# Gemini API Integration for Sightline

This document describes the Gemini AI integration for image analysis in the Sightline accessibility app.

## Overview

The integration provides AI-powered image analysis to generate accessibility-focused descriptions of environments, helping visually impaired users navigate their surroundings.

## API Endpoint

### POST `/api/analyze-image`

Analyzes an uploaded image using Google's Gemini AI and returns an accessibility-focused description.

#### Request

**Content-Type:** `multipart/form-data`

**Body:**

- `image` (File): The image file to analyze (JPEG, PNG, WebP supported)

#### Response

**Success (200):**

```json
{
  "success": true,
  "description": "Two people ahead. Door slightly right. Clear path left. Exit sign visible at 2 o'clock, approximately 20 feet away. Floor appears clear with no obstacles in the immediate path.",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error (400/500):**

```json
{
  "error": "No image provided",
  "details": "Additional error information"
}
```

#### Development Mode

When `GEMINI_API_KEY` is not set or in development mode, the API returns fallback responses:

```json
{
  "success": true,
  "description": "Two people ahead. Door slightly right. Clear path left. Exit sign visible at 2 o'clock, approximately 20 feet away. Floor appears clear with no obstacles in the immediate path.",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "note": "Development mode - using placeholder response"
}
```

## Setup Instructions

### 1. Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Install Dependencies

```bash
npm install @google/generative-ai
```

## Frontend Integration

### ImageAnalyzer Component

The `ImageAnalyzer` component provides a user-friendly interface for image upload and analysis:

```tsx
import { ImageAnalyzer } from "@/components/ImageAnalyzer"

;<ImageAnalyzer
  onAnalysisComplete={(description) => console.log(description)}
  onError={(error) => console.error(error)}
/>
```

#### Features:

- Camera capture (mobile devices)
- File upload (desktop)
- Image preview
- Loading states
- Error handling

### TapButton Integration

The main `TapButton` component now integrates with the Gemini API:

- Automatically captures camera image on tap
- Sends image to `/api/analyze-image` endpoint
- Falls back to simulated responses if camera access fails
- Provides real-time AI analysis

## API Configuration

### Environment Variables

| Variable         | Description           | Required             |
| ---------------- | --------------------- | -------------------- |
| `GEMINI_API_KEY` | Google Gemini API key | Yes (for production) |
| `NODE_ENV`       | Environment mode      | No                   |

### Fallback Responses

The system includes intelligent fallback responses for development and offline scenarios:

```typescript
const FALLBACK_RESPONSES = {
  TAP_SCAN: [
    "Two people ahead. Door slightly right. Clear path left.",
    "Obstacle detected at 2 o'clock. Safe passage to your left.",
    "Clear path ahead. No obstacles detected.",
    // ... more responses
  ],
}
```

## Testing

### 1. Test API Integration

```bash
node scripts/test-api.js
```

### 2. Test in Browser

1. Start development server: `npm run dev`
2. Visit: `http://localhost:3000/test-analyzer`
3. Upload an image or take a photo
4. Verify AI analysis response

### 3. Test with Real API

1. Set `GEMINI_API_KEY` in `.env.local`
2. Restart development server
3. Test with real images
4. Verify AI-generated descriptions

## Error Handling

### Common Issues

1. **No API Key**: Falls back to development responses
2. **Camera Access Denied**: Falls back to simulated responses
3. **Network Error**: Shows error message to user
4. **Invalid Image**: Returns 400 error with details

### Error Responses

```typescript
// Network error
{
  "error": "Network error: Failed to fetch",
  "details": "Connection timeout"
}

// Invalid image
{
  "error": "No image provided",
  "details": "Please select an image file"
}

// API error
{
  "error": "Failed to analyze image",
  "details": "Gemini API quota exceeded"
}
```

## Performance Considerations

### Image Optimization

- Images are compressed to 80% quality before sending
- Maximum resolution: 1280x720
- Supported formats: JPEG, PNG, WebP

### Caching

- API responses are not cached (real-time analysis)
- Images are processed immediately
- No persistent storage of uploaded images

### Rate Limiting

- Gemini API has rate limits
- Implement exponential backoff for retries
- Consider implementing request queuing for high usage

## Security

### Data Privacy

- Images are sent directly to Gemini API
- No local storage of uploaded images
- No user data collection
- Images are not saved on the server

### API Key Security

- Store API key in environment variables
- Never commit API keys to version control
- Use different keys for development/production

## Deployment

### Production Setup

1. Set `GEMINI_API_KEY` in production environment
2. Ensure HTTPS is enabled (required for camera access)
3. Test API integration in production environment
4. Monitor API usage and costs

### Environment Variables

```bash
# Production
GEMINI_API_KEY=your_production_api_key
NODE_ENV=production

# Development
GEMINI_API_KEY=your_development_api_key
NODE_ENV=development
```

## Monitoring

### API Usage

- Monitor Gemini API usage in Google Cloud Console
- Track request/response times
- Monitor error rates
- Set up alerts for quota limits

### User Experience

- Track analysis success rates
- Monitor fallback usage
- Measure response times
- User feedback on description quality

## Troubleshooting

### Common Problems

1. **"Camera access failed"**: Check HTTPS and permissions
2. **"Analysis failed"**: Verify API key and network
3. **"No image provided"**: Check file upload implementation
4. **Slow responses**: Check image size and network

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=sightline:api
```

## Future Enhancements

### Planned Features

1. **Batch Processing**: Analyze multiple images
2. **Video Analysis**: Real-time video stream analysis
3. **Custom Models**: Fine-tuned models for specific environments
4. **Offline Mode**: Local AI models for offline analysis
5. **Voice Commands**: Voice-activated image capture
6. **AR Integration**: Augmented reality overlays

### API Improvements

1. **Caching**: Cache common analysis results
2. **Batching**: Batch multiple requests
3. **Streaming**: Real-time analysis updates
4. **Custom Prompts**: User-customizable analysis prompts
