const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function generateIcons() {
  const svgPath = path.join(__dirname, '../public/img/placeholder-icon.svg');
  const imgDir = path.join(__dirname, '../public/img');
  
  try {
    // Ensure img directory exists
    await fs.mkdir(imgDir, { recursive: true });
    
    // Read SVG file
    const svgBuffer = await fs.readFile(svgPath);
    
    // Generate different sizes
    const sizes = [
      { size: 192, name: 'icon-192.png' },
      { size: 512, name: 'icon-512.png' },
      { size: 180, name: 'apple-touch-icon.png' },
      { size: 32, name: 'favicon-32.png' },
      { size: 16, name: 'favicon-16.png' }
    ];
    
    for (const { size, name } of sizes) {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(imgDir, name));
      
      console.log(`Generated ${name}`);
    }
    
    // Generate favicon.ico (multi-resolution)
    await sharp(svgBuffer)
      .resize(16, 16)
      .toFile(path.join(__dirname, '../public/favicon.ico'));
    
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

// Run if called directly
if (require.main === module) {
  generateIcons();
}

module.exports = generateIcons;