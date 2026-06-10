const asyncHandler = require('express-async-handler');
const Identity = require('../models/Identity');
const AccessLog = require('../models/AccessLog');
const User = require('../models/User');

const getSummary = asyncHandler(async (req, res) => {
  const totalIdentities = await Identity.countDocuments();
  const statusCounts = await Identity.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const summary = { total: totalIdentities };
  statusCounts.forEach((item) => {
    summary[item._id.toLowerCase()] = item.count;
  });

  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });

  res.json({
    summary,
    users: { total: totalUsers, active: activeUsers },
  });
});

const getMonthlyIssuance = asyncHandler(async (req, res) => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const monthlyData = await Identity.aggregate([
    {
      $match: { createdAt: { $gte: twelveMonthsAgo } },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    {
      $project: {
        _id: 0,
        year: '$_id.year',
        month: '$_id.month',
        count: 1,
      },
    },
  ]);

  res.json({ monthlyData });
});

const getAccessSummary = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const accessStats = await AccessLog.aggregate([
    {
      $match: { timestamp: { $gte: thirtyDaysAgo } },
    },
    {
      $group: {
        _id: {
          action: '$action',
          outcome: '$outcome',
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    {
      $project: {
        _id: 0,
        action: '$_id.action',
        outcome: '$_id.outcome',
        count: 1,
      },
    },
  ]);

  const loginSuccess = await AccessLog.countDocuments({
    action: 'LOGIN_SUCCESS',
    timestamp: { $gte: thirtyDaysAgo },
  });
  const loginFailed = await AccessLog.countDocuments({
    action: 'LOGIN_FAILED',
    timestamp: { $gte: thirtyDaysAgo },
  });
  const scans = await AccessLog.countDocuments({
    action: { $regex: /^QR_SCAN/ },
    timestamp: { $gte: thirtyDaysAgo },
  });

  res.json({
    accessStats,
    totals: {
      loginSuccess,
      loginFailed,
      scans,
      total: await AccessLog.countDocuments({ timestamp: { $gte: thirtyDaysAgo } }),
    },
  });
});

const getRoleBreakdown = asyncHandler(async (req, res) => {
  const roleCounts = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        role: '$_id',
        count: 1,
      },
    },
    { $sort: { count: -1 } },
  ]);

  res.json({ roleBreakdown: roleCounts });
});

const exportIdentities = asyncHandler(async (req, res) => {
  const PDFDocument = require('pdfkit');

  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.role) filter.role = req.query.role;

  const identities = await Identity.find(filter)
    .populate('user', 'fullName email')
    .sort({ createdAt: -1 })
    .limit(1000);

  const doc = new PDFDocument({ margin: 30, size: 'A4' });
  const buffers = [];
  doc.on('data', (chunk) => buffers.push(chunk));

  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="identities_report.pdf"');
      res.send(pdfBuffer);
      resolve();
    });
    doc.on('error', reject);

    doc.fontSize(18).font('Helvetica-Bold').text('Identities Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    const tableTop = doc.y;
    doc.fontSize(8).font('Helvetica-Bold');
    const columns = [
      { label: 'DID Number', x: 30, w: 70 },
      { label: 'Name', x: 105, w: 70 },
      { label: 'Role', x: 180, w: 50 },
      { label: 'Status', x: 235, w: 40 },
      { label: 'Access', x: 280, w: 30 },
      { label: 'Expiry', x: 315, w: 60 },
      { label: 'Department', x: 380, w: 60 },
    ];

    columns.forEach((col) => {
      doc.text(col.label, col.x, tableTop, { width: col.w });
    });

    doc.moveTo(30, doc.y + 2).lineTo(560, doc.y + 2).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(7);
    identities.forEach((id) => {
      if (doc.y > 750) {
        doc.addPage();
      }
      doc.text(id.digitalIDNumber || 'N/A', 30, doc.y, { width: 70 });
      doc.text(id.fullName, 105, doc.y - 11, { width: 70 });
      doc.text(id.role || 'N/A', 180, doc.y - 11, { width: 50 });
      doc.text(id.status, 235, doc.y - 11, { width: 40 });
      doc.text(`Lv${id.accessLevel || '?'}`, 280, doc.y - 11, { width: 30 });
      doc.text(new Date(id.expiryDate).toLocaleDateString(), 315, doc.y - 11, { width: 60 });
      doc.text(id.department || 'N/A', 380, doc.y - 11, { width: 60 });
      doc.moveDown(0.3);
    });

    doc.end();
  });
});

const exportAccessLogs = asyncHandler(async (req, res) => {
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

    const tableTop = doc.y;
    doc.fontSize(8).font('Helvetica-Bold');
    [
      { label: 'Timestamp', x: 30, w: 80 },
      { label: 'User', x: 115, w: 70 },
      { label: 'Action', x: 190, w: 70 },
      { label: 'Outcome', x: 265, w: 50 },
      { label: 'Details', x: 320, w: 80 },
    ].forEach((col) => {
      doc.text(col.label, col.x, tableTop, { width: col.w });
    });

    doc.moveTo(30, doc.y + 2).lineTo(560, doc.y + 2).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(7);
    logs.forEach((log) => {
      if (doc.y > 750) {
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

module.exports = {
  getSummary,
  getMonthlyIssuance,
  getAccessSummary,
  getRoleBreakdown,
  exportIdentities,
  exportAccessLogs,
};
