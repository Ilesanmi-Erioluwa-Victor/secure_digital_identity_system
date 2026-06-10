require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");


const User = require("./models/User");
const Identity = require("./models/Identity");
const AccessLog = require("./models/AccessLog");
const Settings = require("./models/Settings");
const hashToken = require("./utils/hashToken");
const generateVerifyToken = require("./utils/generateVerifyToken");

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected for seeding...");

    // Drop database
    await mongoose.connection.db.dropDatabase();
    console.log("Database dropped...");

    // Create Settings
    const settings = await Settings.create({
      institutionName: "Delta State Polytechnic Library",
      institutionAddress: "Otefe-Oghara, Delta State, Nigeria",
      institutionPhone: "+234 800 000 0000",
      defaultExpiryMonths: 12,
      expiryWarningDays: 30,
      finalWarningDays: 7,
      requireMFAForAll: true,
      allowTOTP: true,
      loginRateLimitMax: 5,
      accountLockoutMinutes: 30,
      accessLevelDescriptions: [
        { level: 1, description: "Basic - General access" },
        { level: 2, description: "Standard - Student access with borrowing" },
        {
          level: 3,
          description: "Elevated - Staff access with all privileges",
        },
        { level: 4, description: "Full - Administrative access" },
      ],
    });
    console.log("Settings created...");

    // Create users
    const salt = await bcrypt.genSalt(10);

    const usersData = [
      {
        fullName: "Admin User",
        email: "admin@dspoly.edu.ng",
        password: await bcrypt.hash("Admin@1234", salt),
        role: "admin",
        staffID: "ADMIN-0001",
        phone: "+234 800 000 0001",
        department: "Library Administration",
        isMFAEnabled: true,
        isEmailVerified: true,
      },
      {
        fullName: "Librarian User",
        email: "librarian@dspoly.edu.ng",
        password: await bcrypt.hash("Lib@1234", salt),
        role: "librarian",
        staffID: "LIB-0023",
        phone: "+234 800 000 0002",
        department: "Library Services",
        isMFAEnabled: true,
        isEmailVerified: true,
      },
      {
        fullName: "Student User One",
        email: "student@dspoly.edu.ng",
        password: await bcrypt.hash("Student@1234", salt),
        role: "student",
        matricNumber: "DSP/CS/2022/001",
        phone: "+234 800 000 0003",
        department: "Computer Science",
        isMFAEnabled: true,
        isEmailVerified: true,
      },
      {
        fullName: "Staff User One",
        email: "staff@dspoly.edu.ng",
        password: await bcrypt.hash("Staff@1234", salt),
        role: "staff",
        staffID: "STAFF-0042",
        phone: "+234 800 000 0004",
        department: "Mathematics",
        isMFAEnabled: true,
        isEmailVerified: true,
      },
      {
        fullName: "Student User Two",
        email: "student2@dspoly.edu.ng",
        password: await bcrypt.hash("Student2@1234", salt),
        role: "student",
        matricNumber: "DSP/CS/2022/002",
        phone: "+234 800 000 0005",
        department: "Computer Science",
        isMFAEnabled: true,
        isEmailVerified: true,
      },
    ];

    const users = await User.insertMany(usersData);
    console.log(`Created ${users.length} users...`);

    const adminUser = users[0];
    const librarianUser = users[1];
    const studentUser = users[2];
    const staffUser = users[3];
    const studentUser2 = users[4];

    // Generate verify tokens for identities
    const makeVerifyToken = () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const { rawToken, hmacSignature, verifyUrl } =
        generateVerifyToken(fakeId);
      const storedToken = hashToken(rawToken + hmacSignature);
      return { storedToken, verifyUrl };
    };

    // Create QR codes
    const qrCode = require("qrcode");

    const createQR = async (url) => {
      return qrCode.toDataURL(url);
    };

    const qr1 = await createQR(makeVerifyToken().verifyUrl);
    const qr2 = await createQR(makeVerifyToken().verifyUrl);
    const qr3 = await createQR(makeVerifyToken().verifyUrl);
    const qr4 = await createQR(makeVerifyToken().verifyUrl);
    const qr5 = await createQR(makeVerifyToken().verifyUrl);

    // Create identities
    const now = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    const identitiesData = [
      {
        digitalIDNumber: "DID-POLY-000001",
        user: studentUser._id,
        fullName: studentUser.fullName,
        photo: "/uploads/seed_placeholder.jpg",
        role: "student",
        accessLevel: 2,
        department: "Computer Science",
        matricNumber: "DSP/CS/2022/001",
        issueDate: now,
        expiryDate: nextYear,
        status: "Active",
        qrCodeImage: qr1,
        issuedBy: adminUser._id,
        lifecycleHistory: [
          {
            action: "Issued",
            performedBy: adminUser._id,
            reason: "Initial issuance",
            timestamp: now,
          },
        ],
      },
      {
        digitalIDNumber: "DID-POLY-000002",
        user: staffUser._id,
        fullName: staffUser.fullName,
        photo: "/uploads/seed_placeholder.jpg",
        role: "staff",
        accessLevel: 3,
        department: "Mathematics",
        staffID: "STAFF-0042",
        issueDate: now,
        expiryDate: nextYear,
        status: "Active",
        qrCodeImage: qr2,
        issuedBy: adminUser._id,
        lifecycleHistory: [
          {
            action: "Issued",
            performedBy: adminUser._id,
            reason: "Initial issuance",
            timestamp: now,
          },
        ],
      },
      {
        digitalIDNumber: "DID-POLY-000003",
        user: studentUser2._id,
        fullName: studentUser2.fullName,
        photo: "/uploads/seed_placeholder.jpg",
        role: "student",
        accessLevel: 2,
        department: "Computer Science",
        matricNumber: "DSP/CS/2022/002",
        issueDate: now,
        expiryDate: nextYear,
        status: "Suspended",
        suspendedAt: now,
        suspensionReason: "Lost identity card - reported",
        qrCodeImage: qr3,
        issuedBy: adminUser._id,
        lifecycleHistory: [
          {
            action: "Issued",
            performedBy: adminUser._id,
            reason: "Initial issuance",
            timestamp: now,
          },
          {
            action: "Suspended",
            performedBy: adminUser._id,
            reason: "Lost identity card - reported",
            timestamp: now,
          },
        ],
      },
      {
        digitalIDNumber: "DID-POLY-000004",
        user: adminUser._id,
        fullName: adminUser.fullName,
        photo: "/uploads/seed_placeholder.jpg",
        role: "admin",
        accessLevel: 4,
        department: "Library Administration",
        staffID: "ADMIN-0001",
        issueDate: now,
        expiryDate: nextYear,
        status: "Revoked",
        revokedAt: now,
        revocationReason: "Upgraded to new identity card",
        qrCodeImage: qr4,
        issuedBy: adminUser._id,
        lifecycleHistory: [
          {
            action: "Issued",
            performedBy: adminUser._id,
            reason: "Initial issuance",
            timestamp: now,
          },
          {
            action: "Revoked",
            performedBy: adminUser._id,
            reason: "Upgraded to new identity card",
            timestamp: now,
          },
        ],
      },
      {
        digitalIDNumber: "DID-POLY-000005",
        user: librarianUser._id,
        fullName: librarianUser.fullName,
        photo: "/uploads/seed_placeholder.jpg",
        role: "librarian",
        accessLevel: 3,
        department: "Library Services",
        staffID: "LIB-0023",
        issueDate: lastYear,
        expiryDate: lastYear,
        status: "Expired",
        qrCodeImage: qr5,
        issuedBy: adminUser._id,
        lifecycleHistory: [
          {
            action: "Issued",
            performedBy: adminUser._id,
            reason: "Initial issuance",
            timestamp: lastYear,
          },
          {
            action: "Expired",
            performedBy: null,
            reason: "Auto-expired",
            timestamp: lastYear,
          },
        ],
      },
    ];

    const identities = await Identity.insertMany(identitiesData);
    console.log(`Created ${identities.length} identities...`);

    // Create access logs
    const accessLogsData = [
      {
        user: studentUser._id,
        action: "LOGIN_SUCCESS",
        outcome: "Success",
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
        details: "Student login from library terminal",
        performedBy: studentUser._id,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        user: studentUser._id,
        action: "OTP_SENT",
        outcome: "Success",
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
        details: "OTP sent to registered email",
        performedBy: studentUser._id,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        identity: identities[0]._id,
        user: studentUser._id,
        action: "QR_SCAN_VALID",
        outcome: "Success",
        ipAddress: "192.168.1.50",
        userAgent: "Mobile App v2.1",
        details: "Library entry gate scan",
        performedBy: studentUser._id,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        user: staffUser._id,
        action: "LOGIN_SUCCESS",
        outcome: "Success",
        ipAddress: "10.0.0.25",
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15",
        details: "Staff login from office",
        performedBy: staffUser._id,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        identity: identities[1]._id,
        user: staffUser._id,
        action: "QR_SCAN_VALID",
        outcome: "Success",
        ipAddress: "10.0.0.25",
        userAgent: "Staff Scanner v1.0",
        details: "Staff room access scan",
        performedBy: staffUser._id,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        identity: identities[2]._id,
        action: "QR_SCAN_SUSPENDED",
        outcome: "Failed",
        ipAddress: "192.168.1.150",
        userAgent: "Library Gate Scanner v3.0",
        details: "Attempted entry with suspended identity",
        performedBy: studentUser2._id,
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        user: adminUser._id,
        action: "IDENTITY_ISSUED",
        outcome: "Success",
        ipAddress: "10.0.0.10",
        userAgent: "Admin Dashboard",
        details: "Issued identity DID-POLY-000001",
        performedBy: adminUser._id,
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        user: adminUser._id,
        action: "IDENTITY_SUSPENDED",
        outcome: "Success",
        ipAddress: "10.0.0.10",
        userAgent: "Admin Dashboard",
        details: "Suspended identity DID-POLY-000003",
        performedBy: adminUser._id,
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        user: studentUser2._id,
        action: "LOGIN_FAILED",
        outcome: "Failed",
        ipAddress: "192.168.1.200",
        userAgent: "Mozilla/5.0 (Linux; Android 14) Chrome/120.0.0.0",
        details: "Invalid password attempt 3",
        performedBy: studentUser2._id,
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        user: adminUser._id,
        action: "IDENTITY_EXPIRED",
        outcome: "Success",
        ipAddress: "10.0.0.10",
        userAgent: "System Scheduler",
        details: "Auto-expired identity DID-POLY-000005",
        performedBy: null,
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    ];

    await AccessLog.insertMany(accessLogsData);
    console.log(`Created ${accessLogsData.length} access logs...`);

    console.log("\n========================================");
    console.log("  SEED DATA CREATED SUCCESSFULLY");
    console.log("========================================");
    console.log("\nTest Accounts:");
    console.log("----------------------------------------");
    console.log("Admin:     admin@dspoly.edu.ng / Admin@1234");
    console.log("Librarian: librarian@dspoly.edu.ng / Lib@1234");
    console.log("Student:   student@dspoly.edu.ng / Student@1234");
    console.log("Staff:     staff@dspoly.edu.ng / Staff@1234");
    console.log("Student 2: student2@dspoly.edu.ng / Student2@1234");
    console.log("========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seedData();
