const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'dist', 'assets');

async function convertSvgToPng(svgFile) {
    const svgPath = path.join(assetsDir, svgFile);
    const pngPath = path.join(assetsDir, svgFile.replace('.svg', '.png'));
    
    await sharp(svgPath)
        .png()
        .toFile(pngPath);
    
    console.log(`Converted ${svgFile} to PNG`);
}

async function convertAll() {
    const files = ['player.svg', 'bullet.svg', 'enemy.svg'];
    
    for (const file of files) {
        await convertSvgToPng(file);
    }
}

convertAll().catch(console.error); 