import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(root, 'src', 'assets', 'images');
const outputDir = path.join(root, 'public', 'optimized');

const images = [
  { file: 'hero_streetwear_editorial_1790342899745.jpg', width: 1200 },
  { file: 'product_boxfit_tee_black_1790342911897.jpg', width: 600 },
  { file: 'product_oversized_tee_offwhite_1790342923739.jpg', width: 600 },
  { file: 'product_interlock_polo_charcoal_1790342934447.jpg', width: 600 },
  { file: 'product_streetwear_shirt_olive_1790342946975.jpg', width: 600 },
];

await fs.mkdir(outputDir, { recursive: true });

for (const image of images) {
  const input = path.join(sourceDir, image.file);
  const output = path.join(outputDir, image.file.replace(/\.jpg$/i, '.webp'));

  await sharp(input)
    .rotate()
    .resize({ width: image.width, withoutEnlargement: true })
    .webp({ quality: 78, effort: 5 })
    .toFile(output);

  const [sourceStat, outputStat] = await Promise.all([
    fs.stat(input),
    fs.stat(output),
  ]);

  console.log(
    `Optimized ${image.file}: ${Math.round(sourceStat.size / 1024)} KB -> ${Math.round(outputStat.size / 1024)} KB`
  );
}
