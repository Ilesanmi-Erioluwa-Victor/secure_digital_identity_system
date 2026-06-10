const mongoose = require('mongoose');

const lifecycleEntrySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reason: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const identitySchema = new mongoose.Schema(
  {
    digitalIDNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
    },
    photo: {
      type: String,
      required: [true, 'Photo is required'],
    },
    role: {
      type: String,
    },
    accessLevel: {
      type: Number,
      enum: [1, 2, 3, 4],
      required: [true, 'Access level is required'],
    },
    department: {
      type: String,
    },
    matricNumber: {
      type: String,
    },
    staffID: {
      type: String,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    status: {
      type: String,
      enum: ['Active', 'Suspended', 'Revoked', 'Expired', 'Pending'],
      default: 'Active',
    },
    verifyToken: {
      type: String,
    },
    qrCodeImage: {
      type: String,
    },
    suspendedAt: {
      type: Date,
    },
    suspensionReason: {
      type: String,
    },
    revokedAt: {
      type: Date,
    },
    revocationReason: {
      type: String,
    },
    renewedAt: {
      type: Date,
    },
    renewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    expiryWarningSent: {
      type: Boolean,
      default: false,
    },
    finalWarningSent: {
      type: Boolean,
      default: false,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lifecycleHistory: [lifecycleEntrySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Identity', identitySchema);
