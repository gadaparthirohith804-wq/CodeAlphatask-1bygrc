const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\LENOVO\\.gemini\\antigravity\\brain\\4310a2f4-10f7-4f4a-9729-01e102441d5d';
const destDir = path.join(__dirname, 'public', 'images');

// List of source and destination filenames
const files = [
  { src: 'aether_light_1779247142197.png', dest: 'aether_light.png' },
  { src: 'cyber_keyboard_1779247160769.png', dest: 'cyber_keyboard.png' },
  { src: 'neuro_headset_1779247283819.png', dest: 'neuro_headset.png' },
  { src: 'smart_ring_1779247548324.png', dest: 'smart_ring.png' },
  { src: 'holo_projector_1779247621010.png', dest: 'holo_projector.png' },
  { src: 'biometric_key_1779247646143.png', dest: 'biometric_key.png' }
];

// Ensure destination directory exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  console.log(`Created directory: ${destDir}`);
}

files.forEach(file => {
  const srcPath = path.join(srcDir, file.src);
  const destPath = path.join(destDir, file.dest);

  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${file.src} to ${file.dest}`);
  } else {
    console.error(`Source file not found: ${srcPath}`);
  }
});

console.log('Image copy complete!');
