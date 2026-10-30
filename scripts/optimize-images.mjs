import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(root, 'src', 'assets', 'images');
const outputDir = path.join(root, 'public', 'optimized');

const images = [
  { file: 'hero_streetwear_editorial_1790342899745.jpg', widths: [400, 480, 640, 768, 1200] },
  { file: 'product_boxfit_tee_black_1790342911897.jpg', widths: [320, 360, 400, 480, 600] },
  { file: 'product_oversized_tee_offwhite_1790342923739.jpg', widths: [320, 360, 400, 480, 600] },
  { file: 'product_interlock_polo_charcoal_1790342934447.jpg', widths: [320, 360, 400, 480, 600] },
  { file: 'product_streetwear_shirt_olive_1790342946975.jpg', widths: [320, 360, 400, 480, 600] },
];

await fs.mkdir(outputDir, { recursive: true });

for (const image of images) {
  const input = path.join(sourceDir, image.file);
  const baseName = image.file.replace(/\.jpg$/i, '');
  const sourceStat = await fs.stat(input);

  for (const width of image.widths) {
    const output = path.join(outputDir, `${baseName}-${width}.webp`);
    await sharp(input)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: width <= 480 ? 70 : 76, effort: 5 })
      .toFile(output);

    const outputStat = await fs.stat(output);
    console.log(`Optimized ${path.basename(output)}: ${Math.round(outputStat.size / 1024)} KB`);
  }

  // Preserve the existing WebP path for existing references.
  const canonical = path.join(outputDir, `${baseName}.webp`);
  await sharp(input)
    .rotate()
    .resize({ width: image.widths[image.widths.length - 1], withoutEnlargement: true })
    .webp({ quality: 76, effort: 5 })
    .toFile(canonical);

  const canonicalStat = await fs.stat(canonical);
  console.log(`Optimized ${image.file}: ${Math.round(sourceStat.size / 1024)} KB -> ${Math.round(canonicalStat.size / 1024)} KB`);
}
