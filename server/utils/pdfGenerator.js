const PDFDocument = require('pdfkit');

const generateIDCardPDF = (identity, user, settings) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [400, 600],
      margins: { top: 20, bottom: 20, left: 20, right: 20 },
    });

    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const primaryDark = '#1a237e';
    const primaryLight = '#3949ab';
    const accent = '#ff6f00';
    const white = '#ffffff';
    const black = '#212121';
    const gray = '#757575';

    // Header background
    doc.rect(0, 0, 400, 90).fill(primaryDark);

    doc.fillColor(white).fontSize(20).font('Helvetica-Bold');
    doc.text(settings?.institutionName || 'DSPoly Library', 200, 20, {
      align: 'center',
      width: 360,
    });

    doc.fontSize(10).font('Helvetica');
    doc.text('Digital Identity Card', 200, 48, { align: 'center', width: 360 });

    // Line under header
    doc.moveTo(20, 85).lineTo(380, 85).strokeColor(accent).lineWidth(2).stroke();

    // Photo placeholder
    doc.roundedRect(30, 105, 80, 80, 5).fill(primaryLight);
    doc.fillColor(white).fontSize(10).font('Helvetica');
    doc.text('PHOTO', 70, 145, { align: 'center' });

    // Name and ID
    doc.fillColor(black).fontSize(16).font('Helvetica-Bold');
    doc.text(identity.fullName || user.fullName, 125, 110, {
      width: 250,
    });

    doc.fillColor(primaryDark).fontSize(10).font('Courier');
    doc.text(`ID: ${identity.digitalIDNumber}`, 125, 140);

    // Details section
    const detailsY = 200;
    doc.rect(20, detailsY - 10, 360, 180).fill('#f5f5f5');

    const detailItems = [
      { label: 'Role', value: identity.role || user.role },
      { label: 'Access Level', value: `Level ${identity.accessLevel}` },
      { label: 'Department', value: identity.department || 'N/A' },
      { label: 'Matric/Staff ID', value: identity.matricNumber || identity.staffID || 'N/A' },
      { label: 'Issue Date', value: new Date(identity.issueDate).toLocaleDateString() },
      { label: 'Expiry Date', value: new Date(identity.expiryDate).toLocaleDateString() },
    ];

    detailItems.forEach((item, i) => {
      const y = detailsY + i * 25;
      doc.fillColor(gray).fontSize(9).font('Helvetica');
      doc.text(item.label, 30, y);
      doc.fillColor(black).fontSize(10).font('Helvetica-Bold');
      doc.text(item.value, 180, y);
    });

    // Status badge
    const statusY = detailsY + 175;
    const statusColors = {
      Active: '#2e7d32',
      Suspended: '#e65100',
      Revoked: '#c62828',
      Expired: '#616161',
      Pending: '#f9a825',
    };
    const statusColor = statusColors[identity.status] || '#616161';

    doc.roundedRect(30, detailsY + 170, 100, 20, 3).fill(statusColor);
    doc.fillColor(white).fontSize(9).font('Helvetica-Bold');
    doc.text(identity.status, 80, detailsY + 174, { align: 'center' });

    // QR Code placeholder
    doc.roundedRect(280, 390, 100, 100, 5).fill('#eeeeee');
    if (identity.qrCodeImage) {
      try {
        const qrBuffer = Buffer.from(identity.qrCodeImage.replace(/^data:image\/png;base64,/, ''), 'base64');
        doc.image(qrBuffer, 285, 395, { width: 90, height: 90 });
      } catch (e) {
        doc.fillColor(gray).fontSize(8).font('Helvetica');
        doc.text('QR Code', 330, 440, { align: 'center' });
      }
    } else {
      doc.fillColor(gray).fontSize(8).font('Helvetica');
      doc.text('QR Code', 330, 440, { align: 'center' });
    }

    // Footer
    doc.rect(0, 555, 400, 45).fill(primaryDark);
    doc.fillColor(white).fontSize(7).font('Helvetica');
    doc.text(
      settings?.institutionAddress || 'Otefe-Oghara, Delta State, Nigeria',
      200,
      565,
      { align: 'center', width: 360 }
    );
    doc.text(
      settings?.institutionPhone || '+234 800 000 0000',
      200,
      580,
      { align: 'center', width: 360 }
    );

    doc.end();
  });
};

module.exports = generateIDCardPDF;
