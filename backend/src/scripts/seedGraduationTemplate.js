/**
 * One-time: create the "Graduation Session — Agreement & Model Release"
 * contract template, ported from the Google Form version.
 *
 * Run: node src/scripts/seedGraduationTemplate.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const prisma = require('../lib/prisma');

const NAME = 'Graduation Session — Agreement & Model Release';

const BODY = `# Photography Session Agreement & Model Release

This contract outlines the agreement between Alissa McDonald Photography ("Photographer") and {{client_name}} ("Client"). By signing, the Client agrees to the terms outlined below.

## Session Details

**Session Type:** {{session_type}}
**Session Date:** {{session_date}}
**Session Location:** Gulf Beach
**Session Time:** 2:00 pm
**Session Duration:** 1.5 hrs

If there are any additional props that you would like to include for your portrait please feel free to do so. This could be a book, bat, toy, uniform or maybe a message board! Shoot over a message and let me know your inspo :)

## Fees & Payment Terms

**Cost:** {{price}}

A non-refundable deposit of {{deposit}} is required at the time of booking to secure your session. The remaining balance is due 24 hrs before your session.

Payments can be made via Apple Pay, Zelle at 401.660.7800, or Venmo @mcvazquez24.

## Digital Images

The session includes access to the full gallery of professionally edited digital images. These will be delivered to the email provided by the client within 7 days of the session.

## Gallery Access & Storage

Your gallery will be available for 30 days from the date of your initial download. I recommend saving your images to your phone, Google Drive, or an external hard drive to avoid losing them. After 30 days, retrieval may not be possible and, if available, will incur an additional fee.

For easy and ongoing sharing, you can upload your images to Google Drive and generate a shareable link, allowing access without needing to download again.

## Copyright & Usage Rights

All images are copyrighted by Alissa McDonald Photography and remain the property of the Photographer.

The Photographer grants the Client personal usage rights for printing and sharing on social media (with credit to the Photographer where applicable).

## Model Release

The Client may grant the Photographer permission to use images from the session for promotional purposes, including:

- Website, portfolio, and social media platforms
- Marketing materials and advertisements

You will choose whether to grant or decline this permission in the form below before signing.

## Liability

The Photographer is not responsible for any injuries, accidents, or damages during the session. The Client assumes all responsibility for themselves, their property, and the safety of participants.

## Cancellation & Rescheduling

**Cancellation:** If you need to cancel your session, please notify me as soon as possible. Since the initial deposit is non-refundable, it will be forfeited in the event of a cancellation. If the cancellation occurs less than 48 hours before the scheduled session, the full session fee will still be due.

**Rescheduling:** If you need to reschedule, I will do my best to accommodate your request. Rescheduling is allowed up to 48 hours before the session without penalty. A new session date must be chosen at the time of rescheduling. Please note that if you reschedule more than once, a rescheduling fee of $25 may apply.

**Weather & Unforeseen Circumstances:** In the case of inclement weather or any unforeseen circumstance that prevents the session from taking place, we will work together to find a new date. There will be no additional charge for rescheduling in these cases.

**No-Show Policy:** If you fail to show up for your scheduled session without prior notice, the full session fee will be forfeited, and no rescheduling will be permitted.

## Agreement

By signing below, the Client confirms they have read, understand, and agree to the terms of this contract.`;

(async () => {
  const existing = await prisma.contractTemplate.findFirst({ where: { name: NAME } });
  if (existing) {
    await prisma.contractTemplate.update({ where: { id: existing.id }, data: { body: BODY } });
    console.log('Updated existing template:', existing.id);
  } else {
    const t = await prisma.contractTemplate.create({ data: { name: NAME, body: BODY, active: true } });
    console.log('Created template:', t.id);
  }
  await prisma.$disconnect();
})();
