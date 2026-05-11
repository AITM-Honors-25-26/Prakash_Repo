const QRCode = require('qrcode');
const readline = require('readline');
const fs = require('fs');

/**
 * @param {string} text - The string/URL to encode.
 * @param {string} fileName - The name of the output file.
 */
const generateQR = async (text, fileName = 'qrcode.png') => {
  try {
    // 1. Generate and save as an image file
    await QRCode.toFile(fileName, text);
    console.log(`\n✅ Success! QR code saved as: ${fileName}`);

    // 2. Optional: Generate a Data URL (useful for web apps)
    const dataUrl = await QRCode.toDataURL(text);
    console.log(`🔗 Data URL: ${dataUrl.slice(0, 50)}... (truncated)`);
    
  } catch (err) {
    console.error('❌ Error generating QR code:', err);
  }
};

// Setup readline to get input from the terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the text or URL you want to encode: ', (userInput) => {
  if (userInput.trim()) {
    generateQR(userInput);
  } else {
    console.log('Input cannot be empty.');
  }
  rl.close();
});