const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const LOGO_PATH = path.join(__dirname, '../assets/logo.png'); // 800x229, dark ink on transparent

function parseMarkdownLines(md) {
  return md.split('\n').map((line) => {
    if (line.startsWith('# ')) return { type: 'h1', text: line.slice(2).trim() };
    if (line.startsWith('## ')) return { type: 'h2', text: line.slice(3).trim() };
    if (line.startsWith('### ')) return { type: 'h3', text: line.slice(4).trim() };
    if (line.trim() === '') return { type: 'blank' };
    // Strip inline bold/italic markers
    return { type: 'p', text: line.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1') };
  });
}

/**
 * Generates a signed contract PDF and returns a Buffer.
 * @param {Object} contract - Prisma Contract row with signedAt, signerName, signerIp, signatureData, renderedBody, id
 */
async function generateContractPdf(contract) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 60, size: 'LETTER', info: { Title: 'Photography Services Agreement' } });
    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // ── Header ───────────────────────────────────────────────────────────────
    if (fs.existsSync(LOGO_PATH)) {
      const logoW = 200;
      const logoH = logoW * (229 / 800);
      doc.image(LOGO_PATH, (612 - logoW) / 2, doc.y, { width: logoW });
      doc.y += logoH + 8;
    } else {
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('#2E2C27')
        .text('Alissa McDonald Photography', { align: 'center' });
      doc.moveDown(0.2);
    }
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#6B655A')
      .text('alissamcdonaldphotography.com', { align: 'center' });
    doc.fillColor('#2E2C27');
    doc.moveDown(0.8);
    doc.moveTo(60, doc.y).lineTo(552, doc.y).strokeColor('#D4C9B0').lineWidth(0.5).stroke();
    doc.moveDown(1);

    // ── Contract body ────────────────────────────────────────────────────────
    const lines = parseMarkdownLines(contract.renderedBody);
    for (const line of lines) {
      if (line.type === 'blank') { doc.moveDown(0.6); continue; }
      if (line.type === 'h1') {
        doc.moveDown(0.5);
        doc.fontSize(15).font('Helvetica-Bold').fillColor('#2E2C27').text(line.text);
        doc.moveDown(0.4);
      } else if (line.type === 'h2') {
        doc.moveDown(0.6);
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#2E2C27').text(line.text);
        doc.moveDown(0.3);
      } else if (line.type === 'h3') {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#2E2C27').text(line.text);
        doc.moveDown(0.3);
      } else {
        doc.fontSize(10).font('Helvetica').fillColor('#2E2C27').text(line.text, { lineGap: 4 });
        doc.moveDown(0.15);
      }
    }

    // ── Signature section ────────────────────────────────────────────────────
    doc.moveDown(1.5);
    doc.moveTo(60, doc.y).lineTo(552, doc.y).strokeColor('#D4C9B0').lineWidth(0.5).stroke();
    doc.moveDown(1);

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#2E2C27').text('Electronic Signature');
    doc.moveDown(0.5);

    // Signature image
    if (contract.signatureData) {
      try {
        const base64Data = contract.signatureData.replace(/^data:image\/\w+;base64,/, '');
        const imgBuf = Buffer.from(base64Data, 'base64');
        doc.image(imgBuf, { width: 220, height: 88 });
      } catch (e) {
        doc.fontSize(9).fillColor('#999').text('[Signature image unavailable]');
      }
    }

    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#2E2C27').text(`Signed by: ${contract.signerName}`);
    doc.moveDown(0.2);
    doc.fontSize(10).text(
      `Date: ${new Date(contract.signedAt).toLocaleString('en-US', {
        timeZone: 'America/New_York',
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
      })}`
    );
    if (contract.signerIp) {
      doc.moveDown(0.2);
      doc.fontSize(9).fillColor('#6B655A').text(`IP: ${contract.signerIp}`);
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    doc.moveDown(2);
    doc
      .fontSize(8)
      .fillColor('#9B9B9B')
      .text(
        `Electronically signed and legally binding. Contract ID: ${contract.id}`,
        { align: 'center' }
      );

    doc.end();
  });
}

module.exports = { generateContractPdf };
