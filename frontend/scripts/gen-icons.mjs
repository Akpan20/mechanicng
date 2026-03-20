/* eslint-env node */
import sharp from 'sharp'

const input = './public/favicon.svg'

await sharp(input).resize(192, 192).png().toFile('./public/pwa-192x192.png')
await sharp(input).resize(512, 512).png().toFile('./public/pwa-512x512.png')

console.log('✅ PWA icons generated')