// Builds the home screen icons and favicon.ico from the mascot in the repo-root logo.svg
// (an 816x815 PNG inside the SVG). Run from web/: node scripts/build-app-icons.mjs.
// Writes public/icons/ (listed in public/manifest.webmanifest and index.html) and public/favicon.ico.
// The output is committed, so the Docker build never runs this.

import {mkdir, readFile, writeFile} from 'node:fs/promises'
import sharp from 'sharp'

/** The red of the mascot's circle, so a filled background blends into it. */
const RED = '#e50914'

const svg = await readFile(new URL('../../logo.svg', import.meta.url), 'utf8')
const base64 = svg.match(/data:image\/png;base64,([^"]+)/)?.[1]
if (!base64) throw new Error('No PNG found inside logo.svg')

// The circle without the transparent margin around it.
const mascot = await sharp(Buffer.from(base64, 'base64')).trim().png().toBuffer()

/** The mascot circle at `scale` of a `size` square, centered on `background`. */
async function icon(size, {scale = 1, background = {r: 0, g: 0, b: 0, alpha: 0}} = {}) {
  const inner = Math.round(size * scale)
  const circle = await sharp(mascot).resize(inner, inner, {fit: 'contain', background: {r: 0, g: 0, b: 0, alpha: 0}}).toBuffer()
  const offset = Math.round((size - inner) / 2)
  const image = sharp({create: {width: size, height: size, channels: 4, background}}).composite([
    {input: circle, top: offset, left: offset},
  ])
  // A solid background means no transparency, so drop the alpha channel.
  const opaque = typeof background === 'string'
  return sharp(await image.png().toBuffer())
    [opaque ? 'removeAlpha' : 'ensureAlpha']()
    .png({compressionLevel: 9})
    .toBuffer()
}

/** An .ico holding PNG images (every current browser reads these). */
function ico(images) {
  const head = Buffer.alloc(6 + 16 * images.length)
  head.writeUInt16LE(0, 0)
  head.writeUInt16LE(1, 2)
  head.writeUInt16LE(images.length, 4)
  let offset = head.length
  images.forEach(({size, data}, i) => {
    const e = 6 + 16 * i
    head.writeUInt8(size >= 256 ? 0 : size, e)
    head.writeUInt8(size >= 256 ? 0 : size, e + 1)
    head.writeUInt16LE(1, e + 4)
    head.writeUInt16LE(32, e + 6)
    head.writeUInt32LE(data.length, e + 8)
    head.writeUInt32LE(offset, e + 12)
    offset += data.length
  })
  return Buffer.concat([head, ...images.map(i => i.data)])
}

const out = new URL('../public/icons/', import.meta.url)
await mkdir(out, {recursive: true})

await writeFile(new URL('icon-192.png', out), await icon(192, {scale: 0.96}))
await writeFile(new URL('icon-512.png', out), await icon(512, {scale: 0.96}))
// Android crops maskable icons to its own shape, so the red fills the square and the
// mascot stays inside the middle 80% (the safe zone).
await writeFile(new URL('icon-maskable-512.png', out), await icon(512, {scale: 0.8, background: RED}))
// iOS needs an opaque icon and rounds the corners itself.
await writeFile(new URL('apple-touch-icon.png', out), await icon(180, {scale: 0.9, background: '#ffffff'}))

const sizes = [16, 32, 48]
const images = await Promise.all(sizes.map(async size => ({size, data: await icon(size)})))
await writeFile(new URL('../public/favicon.ico', import.meta.url), ico(images))

console.log('Wrote public/icons/ and public/favicon.ico')
