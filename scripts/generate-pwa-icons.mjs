import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const source = join(root, 'src/assets/optimized/savora-logo-560.jpg')
const outDir = join(root, 'public/icons')
const background = { r: 250, g: 247, b: 242, alpha: 1 }

await mkdir(outDir, { recursive: true })

async function createIcon(size, output, maskable = false) {
  if (!maskable) {
    await sharp(source)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .png()
      .toFile(output)
    return
  }

  const logoSize = Math.round(size * 0.72)
  const logo = await sharp(source)
    .resize(logoSize, logoSize, { fit: 'contain', background })
    .png()
    .toBuffer()

  await sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(output)
}

await createIcon(192, join(outDir, 'icon-192.png'))
await createIcon(512, join(outDir, 'icon-512.png'))
await createIcon(192, join(outDir, 'icon-maskable-192.png'), true)
await createIcon(512, join(outDir, 'icon-maskable-512.png'), true)

console.log('PWA icons generated in public/icons/')
