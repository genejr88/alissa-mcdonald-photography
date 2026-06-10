require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Admin — created if missing. Password is only set on first create so that
  // in-app password changes survive deploys (seed runs on every deploy).
  const username = process.env.ADMIN_USERNAME || 'alissa';
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const email = process.env.ADMIN_EMAIL || 'alissa@example.com';
  if (!process.env.ADMIN_PASSWORD) {
    console.warn('WARNING: ADMIN_PASSWORD not set — using insecure default.');
  }
  await prisma.user.upsert({
    where: { username },
    update: {},
    create: {
      username,
      email,
      name: 'Alissa McDonald',
      passwordHash: await bcrypt.hash(password, 10),
      role: 'ADMIN',
    },
  });

  // Services — her two real packages (editable in admin afterwards)
  if ((await prisma.service.count()) === 0) {
    await prisma.service.createMany({
      data: [
        {
          name: 'The Mini',
          number: 1,
          description:
            'Perfect for quick, simple portraits — children, couples, small families, maternity, or milestone photos. Thirty unhurried minutes of beautiful, natural images in a relaxed setting.',
          includes: 'One location\n30 minutes\nOnline gallery for viewing & downloading',
          durationMin: 30,
          price: 175,
          bufferMin: 30,
          sortOrder: 1,
        },
        {
          name: 'The Full Session',
          number: 2,
          description:
            'For those wanting a little more time and variety — families, maternity, couples, seniors, or children. A full hour for multiple poses, combinations, and a wider variety of images.',
          includes: 'One location\n60 minutes\nOnline gallery for viewing & downloading',
          durationMin: 60,
          price: 200,
          bufferMin: 30,
          sortOrder: 2,
        },
      ],
    });
  }

  // Availability — Tue–Sat 9–5 default template
  if ((await prisma.availabilityRule.count()) === 0) {
    await prisma.availabilityRule.createMany({
      data: [2, 3, 4, 5, 6].map((weekday) => ({
        weekday,
        startTime: '09:00',
        endTime: '17:00',
      })),
    });
  }

  // Testimonials — her real reviews (from her current site)
  if ((await prisma.testimonial.count()) === 0) {
    await prisma.testimonial.createMany({
      data: [
        {
          quote:
            'We had the pleasure of working with Alissa, and I can’t say enough good things about her! She was incredibly patient & kind, taking her time with our three energetic (and chaotic!) children. What I expected to be a hectic and overwhelming session turned into a gallery of stunning, heartfelt photos that truly took my breath away. She managed to freeze those fleeting, real-life moments in the most beautiful way.',
          pullQuote:
            'A gallery of stunning, heartfelt photos that truly took my breath away.',
          attribution: 'E. Cuevas',
          featured: true,
          sortOrder: 1,
        },
        {
          quote:
            'Alissa took couples photos of Quentin and me, and they came out absolutely beautiful! What really stood out was how well she directed us — that’s something so rare to find! She even gave us a few moments just to be ourselves and enjoy the moment — and somehow, those ended up being some of the best photos!',
          pullQuote:
            'She gave us a few moments just to be ourselves — and those ended up being some of the best photos.',
          attribution: 'G. Rivera',
          featured: true,
          sortOrder: 2,
        },
        {
          quote:
            'Alissa was fantastic when she took family photos for my husband, daughter, and I. She was so creative and had so many ideas that were unique to our family that you could tell she cares very much about what she does. Would highly recommend Alissa McDonald Photography!',
          pullQuote: 'Ideas so unique to our family — you could tell she cares deeply about what she does.',
          attribution: 'Meghan + Family',
          featured: false,
          sortOrder: 3,
        },
        {
          quote:
            'The best experience I could’ve asked for! The pictures were phenomenal for one, but she’s amazing with kids, accommodating, and is so efficient! Only coming to her for my photos.',
          pullQuote: 'The best experience I could’ve asked for.',
          attribution: 'B. Alvelo',
          featured: false,
          sortOrder: 4,
        },
      ],
    });
  }

  // Default contract template
  if ((await prisma.contractTemplate.count()) === 0) {
    await prisma.contractTemplate.create({
      data: {
        name: 'Photography Services Agreement',
        body: `# Photography Services Agreement

This agreement is between **Alissa McDonald Photography** ("Photographer") and **{{client_name}}** ("Client") for the session described below.

**Session:** {{session_type}}
**Date:** {{session_date}}
**Session fee:** {{price}}
**Deposit due to confirm:** {{deposit}}

## 1. Booking & Payment
A deposit is required to confirm your session date. The remaining balance is due on or before the session date.

## 2. Cancellation & Rescheduling
Client may reschedule with at least 48 hours notice. Deposits are non-refundable but may be applied to one rescheduled session within 90 days.

## 3. Image Delivery
Edited images are delivered via a private online gallery. Photographer selects and edits images in her artistic style; unedited files are not provided.

## 4. Copyright & Usage
Photographer retains copyright. Client receives a personal-use license to download, print, and share delivered images. Photographer may use images for portfolio and promotion unless Client opts out in writing.

## 5. Model Release
Client grants Photographer permission to use session images for portfolio, website, and social media unless otherwise agreed in writing.

By signing below, Client agrees to the terms above.`,
        active: true,
      },
    });
  }

  // Site settings defaults
  const defaults = {
    siteTitle: 'Alissa McDonald Photography',
    tagline: 'Moments That Feel Like You',
    aboutText:
      'My mission is to capture real, unscripted moments using natural light to bring warmth and honesty to every image. From quiet in-betweens to big emotions, I aim to create timeless photos that feel true, emotional, and beautifully you.',
    instagramUrl: 'https://www.instagram.com/alissamcdonald.photography_',
    facebookUrl: 'https://www.facebook.com/uncagedcreations.byAlissa',
    timezone: 'America/New_York',
    accentColor: '#8A7C2E',
  };
  for (const [key, value] of Object.entries(defaults)) {
    await prisma.appSetting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
