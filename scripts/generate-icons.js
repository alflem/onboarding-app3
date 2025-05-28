const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icon sizes needed for PWA
const iconSizes = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 144, name: 'icon-144.png' },
  { size: 96, name: 'icon-96.png' },
  { size: 72, name: 'icon-72.png' },
  { size: 48, name: 'icon-48.png' }
];

async function generateIcons() {
  const inputPath = path.join(__dirname, '../public/logo.png');
  const outputDir = path.join(__dirname, '../public');

  // Check if input file exists
  if (!fs.existsSync(inputPath)) {
    console.error('❌ logo.png not found in public directory');
    console.log('Please ensure you have a logo.png file in the public directory');
    return;
  }

  console.log('🎨 Generating PWA icons...');

  try {
    for (const { size, name } of iconSizes) {
      const outputPath = path.join(outputDir, name);

      await sharp(inputPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated ${name} (${size}x${size})`);
    }

    console.log('🎉 All icons generated successfully!');
    console.log('\nNext steps:');
    console.log('1. Review the generated icons in the public directory');
    console.log('2. Test your PWA installability in Chrome DevTools');
    console.log('3. Consider creating maskable versions for better Android integration');

  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    console.log('\nTo install sharp (required for image processing):');
    console.log('npm install sharp --save-dev');
  }
}

// Run the script
generateIcons();