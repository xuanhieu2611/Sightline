# 🧪 Testing Guide: Gemini API Integration

## Quick Start Testing

### 1. Set Up Your API Key

Create a `.env.local` file in your project root:

```bash
# Create the file
touch .env.local

# Add your API key (replace with your actual key)
echo "GEMINI_API_KEY=your_actual_gemini_api_key_here" > .env.local
```

### 2. Start the Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3000`

### 3. Test the Integration

#### Option A: Browser Testing (Recommended)

1. **Visit the test page**: `http://localhost:3000/test-analyzer`
2. **Upload an image** or **take a photo**
3. **Click "Analyze Image"**
4. **Check the response** - you should see either:
   - Real AI analysis (if API key works)
   - Fallback response (if API key issues)

#### Option B: Main App Testing

1. **Visit the main app**: `http://localhost:3000`
2. **Click the main TAP button**
3. **Allow camera access** when prompted
4. **Check the response** - should get AI analysis

#### Option C: API Testing with curl

```bash
# Test with a real image file
curl -X POST http://localhost:3000/api/analyze-image \
  -F "image=@path/to/your/image.jpg"
```

## Expected Responses

### ✅ Success Response (Real AI)

```json
{
  "success": true,
  "description": "Two people ahead. Door slightly right. Clear path left. Exit sign visible at 2 o'clock, approximately 20 feet away. Floor appears clear with no obstacles in the immediate path.",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 🔄 Fallback Response (Development Mode)

```json
{
  "success": true,
  "description": "Two people ahead. Door slightly right. Clear path left. Exit sign visible at 2 o'clock, approximately 20 feet away. Floor appears clear with no obstacles in the immediate path.",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "note": "Development mode - using placeholder response"
}
```

### ❌ Error Response

```json
{
  "error": "Failed to analyze image",
  "details": "API key invalid or quota exceeded"
}
```

## Troubleshooting

### Issue: "API key invalid"

**Solution**: Check your `.env.local` file has the correct API key

### Issue: "Model not found"

**Solution**: The API route will fall back to development mode automatically

### Issue: "Camera access denied"

**Solution**:

- Use HTTPS (required for camera access)
- Or test with file upload instead

### Issue: "Network error"

**Solution**:

- Check your internet connection
- Verify the development server is running
- Check browser console for errors

## Testing Checklist

- [ ] API key set in `.env.local`
- [ ] Development server running (`npm run dev`)
- [ ] Can access `http://localhost:3000/test-analyzer`
- [ ] Can upload image or take photo
- [ ] Get response (real AI or fallback)
- [ ] Voice feedback works
- [ ] Main TAP button works with camera

## Next Steps

Once testing works:

1. **Deploy to production** with HTTPS
2. **Set production API key** in environment variables
3. **Test on mobile devices** for camera functionality
4. **Monitor API usage** in Google AI Studio

## API Usage Monitoring

- Check your Google AI Studio dashboard
- Monitor API quota and usage
- Set up billing alerts if needed
- Track response times and success rates
