const fs = require("fs")
const path = require("path")

// Create a simple SVG icon
const createIconSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#000000"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${
  size / 3
}" fill="#ffffff" stroke="#ffffff" stroke-width="4"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 6}" fill="#000000"/>
  <text x="${size / 2}" y="${
  size / 2 + size / 20
}" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="${
  size / 8
}" font-weight="bold">S</text>
</svg>`

// Icon sizes for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512]

// Ensure icons directory exists
const iconsDir = path.join(__dirname, "..", "public", "icons")
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// Generate SVG icons
iconSizes.forEach((size) => {
  const svgContent = createIconSVG(size)
  const filename = `icon-${size}x${size}.svg`
  const filepath = path.join(iconsDir, filename)

  fs.writeFileSync(filepath, svgContent)
  console.log(`Generated ${filename}`)
})

// Create a simple HTML file to convert SVG to PNG (for development)
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Icon Generator</title>
  <style>
    body { background: #000; color: #fff; font-family: Arial, sans-serif; padding: 20px; }
    .icon { margin: 10px; display: inline-block; }
    canvas { border: 1px solid #333; }
  </style>
</head>
<body>
  <h1>Sightline PWA Icons</h1>
  <p>These are the generated icons for the PWA. In production, you should use proper PNG icons.</p>
  
  ${iconSizes
    .map(
      (size) => `
    <div class="icon">
      <h3>${size}x${size}</h3>
      <canvas id="canvas-${size}" width="${size}" height="${size}"></canvas>
    </div>
  `
    )
    .join("")}
  
  <script>
    // Convert SVG to canvas (basic implementation)
    ${iconSizes
      .map(
        (size) => `
      const canvas${size} = document.getElementById('canvas-${size}');
      const ctx${size} = canvas${size}.getContext('2d');
      
      // Draw a simple icon
      ctx${size}.fillStyle = '#000000';
      ctx${size}.fillRect(0, 0, ${size}, ${size});
      
      ctx${size}.fillStyle = '#ffffff';
      ctx${size}.beginPath();
      ctx${size}.arc(${size / 2}, ${size / 2}, ${size / 3}, 0, 2 * Math.PI);
      ctx${size}.fill();
      
      ctx${size}.strokeStyle = '#ffffff';
      ctx${size}.lineWidth = 4;
      ctx${size}.stroke();
      
      ctx${size}.fillStyle = '#000000';
      ctx${size}.beginPath();
      ctx${size}.arc(${size / 2}, ${size / 2}, ${size / 6}, 0, 2 * Math.PI);
      ctx${size}.fill();
      
      ctx${size}.fillStyle = '#ffffff';
      ctx${size}.font = 'bold ${size / 8}px Arial';
      ctx${size}.textAlign = 'center';
      ctx${size}.textBaseline = 'middle';
      ctx${size}.fillText('S', ${size / 2}, ${size / 2});
    `
      )
      .join("")}
  </script>
</body>
</html>
`

fs.writeFileSync(path.join(iconsDir, "icon-generator.html"), htmlContent)
console.log("Generated icon-generator.html for preview")

console.log("\nIcon generation complete!")
console.log(
  "Note: In production, replace these with proper PNG icons for better PWA compliance."
)
