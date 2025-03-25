const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'dist', 'assets');

// WAV Header
function createWavHeader(sampleRate, bitsPerSample, channels, dataLength) {
    const header = Buffer.alloc(44);
    
    // RIFF identifier
    header.write('RIFF', 0);
    // File length minus RIFF identifier length and file description length
    header.writeUInt32LE(36 + dataLength, 4);
    // WAVE identifier
    header.write('WAVE', 8);
    // Format chunk identifier
    header.write('fmt ', 12);
    // Format chunk length
    header.writeUInt32LE(16, 16);
    // Sample format (1 for PCM)
    header.writeUInt16LE(1, 20);
    // Channel count
    header.writeUInt16LE(channels, 22);
    // Sample rate
    header.writeUInt32LE(sampleRate, 24);
    // Byte rate (sample rate * block align)
    header.writeUInt32LE(sampleRate * channels * bitsPerSample / 8, 28);
    // Block align (channel count * bytes per sample)
    header.writeUInt16LE(channels * bitsPerSample / 8, 32);
    // Bits per sample
    header.writeUInt16LE(bitsPerSample, 34);
    // Data chunk identifier
    header.write('data', 36);
    // Data chunk length
    header.writeUInt32LE(dataLength, 40);
    
    return header;
}

// Generate a simple beep sound
function generateBeep(frequency, duration, sampleRate = 44100, bitsPerSample = 16) {
    const samples = Math.floor(duration * sampleRate);
    const data = Buffer.alloc(samples * 2);
    
    for (let i = 0; i < samples; i++) {
        const value = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 32767;
        data.writeInt16LE(value, i * 2);
    }
    
    const header = createWavHeader(sampleRate, bitsPerSample, 1, data.length);
    return Buffer.concat([header, data]);
}

// Generate shoot sound
const shootSound = generateBeep(440, 0.1);
fs.writeFileSync(path.join(assetsDir, 'shoot.wav'), shootSound);

// Generate explosion sound
const explosionSound = generateBeep(100, 0.2);
fs.writeFileSync(path.join(assetsDir, 'explosion.wav'), explosionSound);

console.log('Generated sound effects'); 