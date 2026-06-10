/**
 * One-time migration: pull Pixieset portfolio photos into Cloudinary
 * and create a "Selected Works" gallery in the database.
 *
 * Run: node backend/src/scripts/migratePixieset.js
 * Requires DATABASE_URL and CLOUDINARY_URL (or CLOUDINARY_API_KEY etc.) in env.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { v2: cloudinary } = require('cloudinary');
const { PrismaClient } = require('@prisma/client');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const prisma = new PrismaClient();

const PIXIESET_URLS = [
  'https://images-pw.pixieset.com/site/BDqQpv/X7VZXY/FamilySession2026-117-02b753c8-1500.jpg',
  'https://images-pw.pixieset.com/site/BDqQpv/X7L74X/Calzonefamilysession-86-ad0fa9d0-1500.jpg',
  'https://images-pw.pixieset.com/site/BDqQpv/w3o1mE/Briana.Raya.MommyandMe-18-ae831548-1500.jpg',
  'https://images-pw.pixieset.com/site/BDqQpv/7XoeJ9/IMG_1156-a4198a2a-1500.jpeg',
  'https://images-pw.pixieset.com/site/BDqQpv/yvMwO4/IMG_0631-43e11b0c-1500.jpeg',
  'https://images-pw.pixieset.com/site/BDqQpv/4Z5wKx/AnyaandGene.SpookySession-65-848790bc-1500.jpg',
  'https://images-pw.pixieset.com/site/BDqQpv/bnqxze/Briana.Raya.MommyandMe-32-c35571f0-1500.jpg',
  'https://images-pw.pixieset.com/site/BDqQpv/MXqYW6/IMG_28952-a52fcd14-1500.jpg',
  'https://images-pw.pixieset.com/site/BDqQpv/0Z5zYv/Skylar.Silas.FallSession-041-67daae8a-1500.jpg',
  'https://images-pw.pixieset.com/site/BDqQpv/8ZOZpD/Calzonefamilysession-81-214424f6-1500.jpg',
  'https://images-pw.pixieset.com/site/BDqQpv/zMV9XY/IMG_4206-bae53814-1500.jpg',
  'https://images-pw.pixieset.com/site/BDqQpv/nGo6Pe/IMG_22282-672347e3-1500.jpg',
  'https://images-pw.pixieset.com/site/BDqQpv/5XobQn/Makayla19thBirthday-51-4db1d7f9-1500.jpg',
  'https://images-pw.pixieset.com/site/BDqQpv/w3DDn3/Makayla19thBirthdayBW-30-ca2ac616-1500.jpg',
  'https://images-pw.pixieset.com/site/BDqQpv/0dGbQY/BiancaFamilySession.Christmas25-007-992812fb-1500.jpg',
  'https://images-pw.pixieset.com/site/BDqQpv/7Xoek9/IMG_29302-125e5163-1500.jpg',
  'https://images-pw.pixieset.com/site/BDqQpv/y6ljD8/VictoriaGradSession-18-86877496-1500.jpg',
  'https://images-pw.pixieset.com/site/BDqQpv/3ZkZzw/Calzonefamilysession-21-d3f3a605-1500.jpg',
  'https://images-pw.pixieset.com/site/BDqQpv/0ZpveG/VictoriaGradSession-27-44224926-1500.jpg',
  'https://images-pw.pixieset.com/site/BDqQpv/PZzoDz/IMG_27352-e3aa5217-1500.jpg',
  'https://images-pw.pixieset.com/site/BDqQpv/R0KJzM/FamilySession2026-114-c75aad54-1500.jpg',
  'https://images-pw.pixieset.com/site/BDqQpv/V6wwGp/Makayla19thBirthday-05-389d44e5-1500.jpg',
  'https://images-pw.pixieset.com/site/BDqQpv/MXqYV6/IMG_1135-05dccc3a-1500.jpeg',
  'https://images-pw.pixieset.com/site/BDqQpv/PZzoYW/IMG_2975-3854cf8f-1500.jpg',
  'https://images-pw.pixieset.com/site/BDqQpv/WWRkVv/IMG_1221-56ae08d9-1500.jpeg',
  'https://images-pw.pixieset.com/site/BDqQpv/4Z5wZL/FamilySession2026-087-c6d1aecc-1500.jpg',
  'https://images-pw.pixieset.com/site/BDqQpv/8Xokz1/IMG_28072-a17ac246-1500.jpg',
  'https://images-pw.pixieset.com/site/BDqQpv/OZOEYG/Brianna.Gracelyn.MommyandMe-26-3ab9c80d-1500.jpg',
  'https://images-pw.pixieset.com/site/BDqQpv/w78Ym9/IMG_2043-70014398-1500.JPG',
  'https://images-pw.pixieset.com/site/BDqQpv/MXqYGY/IMG_21912-248203df-1500.jpg',
];

async function main() {
  console.log('Starting Pixieset → Cloudinary migration...\n');

  // Create or find the "Selected Works" gallery
  let gallery = await prisma.gallery.findFirst({ where: { slug: 'selected-works' } });
  if (!gallery) {
    gallery = await prisma.gallery.create({
      data: {
        title: 'Selected Works',
        slug: 'selected-works',
        description: 'A curated collection of favourite sessions.',
        mood: 'LIGHT',
        published: true,
        sortOrder: 0,
      },
    });
    console.log(`Created gallery: ${gallery.id}`);
  } else {
    console.log(`Found existing gallery: ${gallery.id}`);
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < PIXIESET_URLS.length; i++) {
    const url = PIXIESET_URLS[i];
    process.stdout.write(`[${i + 1}/${PIXIESET_URLS.length}] Uploading... `);
    try {
      // Upload (or re-upload if already exists — Cloudinary deduplicates by public_id only if overwrite=true)
      const result = await cloudinary.uploader.upload(url, {
        folder: 'amp-galleries',
        resource_type: 'image',
        overwrite: false,
        unique_filename: true,
      });

      const dominantColor = null;

      await prisma.photo.create({
        data: {
          galleryId: gallery.id,
          cloudinaryPublicId: result.public_id,
          url: result.secure_url,
          width: result.width,
          height: result.height,
          dominantColor,
          sortOrder: i,
        },
      });

      console.log(`OK  ${result.public_id}`);
      successCount++;
    } catch (err) {
      console.log(`FAIL  ${err.message}`);
      failCount++;
    }
  }

  console.log(`\nDone. ${successCount} uploaded, ${failCount} failed.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
