const asyncHandler = require('express-async-handler');
const AccessLog = require('../models/AccessLog');

const getAllLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.action) filter.action = req.query.action;
  if (req.query.outcome) filter.outcome = req.query.outcome;
  if (req.query.userId) filter.user = req.query.userId;
  if (req.query.startDate || req.query.endDate) {
    filter.timestamp = {};
    if (req.query.startDate) filter.timestamp.$gte = new Date(req.query.startDate);
    if (req.query.endDate) filter.timestamp.$lte = new Date(req.query.endDate);
  }

  const [logs, total] = await Promise.all([
    AccessLog.find(filter)
      .populate('user', 'fullName email role')
      .populate('identity', 'digitalIDNumber fullName')
      .populate('performedBy', 'fullName email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit),
    AccessLog.countDocuments(filter),
  ]);

  res.json({
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

const getMyLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const skip = (page - 1) * limit;

  const filter = { user: req.user.id };
  if (req.query.action) filter.action = req.query.action;
  if (req.query.outcome) filter.outcome = req.query.outcome;

  const [logs, total] = await Promise.all([
    AccessLog.find(filter)
      .populate('identity', 'digitalIDNumber fullName')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit),
    AccessLog.countDocuments(filter),
  ]);

  res.json({
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

const exportLogs = asyncHandler(async (req, res) => {
  const PDFDocument = require('pdfkit');

  const filter = {};
  if (req.query.startDate || req.query.endDate) {
    filter.timestamp = {};
    if (req.query.startDate) filter.timestamp.$gte = new Date(req.query.startDate);
    if (req.query.endDate) filter.timestamp.$lte = new Date(req.query.endDate);
  }

  const logs = await AccessLog.find(filter)
    .populate('user', 'fullName email')
    .populate('identity', 'digitalIDNumber')
    .sort({ timestamp: -1 })
    .limit(1000);

  const doc = new PDFDocument({ margin: 30, size: 'A4' });
  const buffers = [];
  doc.on('data', (chunk) => buffers.push(chunk));

  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="access_logs_report.pdf"');
      res.send(pdfBuffer);
      resolve();
    });
    doc.on('error', reject);

    doc.fontSize(18).font('Helvetica-Bold').text('Access Logs Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    // Table header
    const tableTop = doc.y;
    doc.fontSize(8).font('Helvetica-Bold');
    const columns = [
      { label: 'Timestamp', x: 30, w: 80 },
      { label: 'User', x: 115, w: 70 },
      { label: 'Action', x: 190, w: 70 },
      { label: 'Outcome', x: 265, w: 50 },
      { label: 'Details', x: 320, w: 80 },
    ];

    columns.forEach((col) => {
      doc.text(col.label, col.x, tableTop, { width: col.w });
    });

    doc.moveTo(30, doc.y + 2).lineTo(560, doc.y + 2).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(7);
    logs.forEach((log) => {
      const y = doc.y;
      if (y > 750) {
        doc.addPage();
      }
      doc.text(new Date(log.timestamp).toLocaleString(), 30, doc.y, { width: 80 });
      doc.text(log.user?.fullName || log.user?.email || 'N/A', 115, doc.y - 11, { width: 70 });
      doc.text(log.action, 190, doc.y - 11, { width: 70 });
      doc.text(log.outcome, 265, doc.y - 11, { width: 50 });
      doc.text(log.details || '', 320, doc.y - 11, { width: 80 });
      doc.moveDown(0.3);
    });

    doc.end();
  });
});

module.exports = { getAllLogs, getMyLogs, exportLogs };
