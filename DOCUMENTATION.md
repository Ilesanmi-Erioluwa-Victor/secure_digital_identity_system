# Secure Digital Identity System — Full Documentation (A–Z)XZ

---

## Table of Contents

1. [Overview & Abstract](#1-overview--abstract)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [Database Schema (MongoDB Models)](#4-database-schema)
5. [Authentication & Authorization Flow](#5-authentication--authorization-flow)
6. [API Reference (All Endpoints)](#6-api-reference)
7. [Frontend Pages & Routing](#7-frontend-pages--routing)
8. [Role-Based Access Control](#8-role-based-access-control)
9. [QR Verification System](#9-qr-verification-system)
10. [Multi-Factor Authentication (MFA)](#10-multi-factor-authentication)
11. [Identity Lifecycle](#11-identity-lifecycle)
12. [Email & Notifications](#12-email--notifications)
13. [Expiry Scheduler (Cron Job)](#13-expiry-scheduler)
14. [File Uploads](#14-file-uploads)
15. [Seed Data](#15-seed-data)
16. [Installation & Setup](#16-installation--setup)
17. [Running the Application](#17-running-the-application)
18. [Environment Variables](#18-environment-variables)
19. [Project Structure](#19-project-structure)
20. [Security Considerations](#20-security-considerations)
21. [Common Issues & Fixes](#21-common-issues--fixes)

---

## 1. Overview & Abstract

The management of user identities in institutional settings such as a polytechnic library presents significant challenges: unauthorized access, identity fraud, and inefficient manual verification processes. This system provides each library user with a unique verifiable digital identity in the form of a QR-code-backed digital ID card.

**Key capabilities:**

- Secure login with multi-factor authentication (email OTP or TOTP via authenticator app)
- Role-based access: **admin**, **librarian**, **student**, **staff**
- QR code identity verification (librarians scan student/staff cards)
- Complete identity lifecycle: issue, suspend, activate, renew, revoke
- Full audit trail via access logs
- Downloadable PDF identity cards
- Admin dashboard with charts and reports
- Configurable system settings (expiry, MFA policies, rate limits)
- Department management
- Email notifications for OTPs, suspensions, renewals, expiry warnings

---

## 2. Tech Stack

| Layer          | Technology                                         |
| -------------- | -------------------------------------------------- |
| Frontend       | React 18 + Vite + Tailwind CSS                     |
| Backend        | Node.js + Express.js                               |
| Database       | MongoDB Atlas (M0 free-tier) via Mongoose ODM      |
| Auth           | JWT (access + refresh tokens), bcryptjs            |
| 2FA            | TOTP via `speakeasy` + `otplib`                    |
| QR Codes       | `qrcode` (server), `html5-qrcode` (client scanner) |
| PDF Generation | `pdfkit`                                           |
| Email          | `nodemailer` (Gmail SMTP)                          |
| File Uploads   | `multer` (JPEG/PNG, 5MB max)                       |
| Scheduling     | `node-cron` (daily expiry checks)                  |
| Rate Limiting  | `express-rate-limit`                               |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Client (React + Vite)             │
│  ┌─────────┐ ┌──────────┐ ┌──────────────────┐     │
│  │ Auth    │ │ Admin    │ │ Librarian / User  │     │
│  │ Pages   │ │ Pages    │ │ Pages             │     │
│  └────┬────┘ └────┬─────┘ └────────┬─────────┘     │
│       │           │                 │                │
│  ┌────┴───────────┴─────────────────┴────────┐      │
│  │         Axios Instance (axiosInstance.js)  │      │
│  │   - JWT interceptor  - 401 refresh logic  │      │
│  └──────────────────────┬────────────────────-┘      │
└─────────────────────────┼────────────────────────────┘
                          │ HTTP (proxied via Vite /api)
                          ▼
┌─────────────────────────────────────────────────────┐
│              Express.js Server (port 5000)           │
│                                                      │
│  Middleware Stack:                                   │
│    cors → cookie-parser → json → morgan              │
│    → authMiddleware (JWT verify)                     │
│    → roleMiddleware (role check)                     │
│    → routes → controllers → models                   │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐     │
│  │ Auth     │ │ Identity │ │ Verify            │     │
│  │ Routes   │ │ Routes   │ │ Routes (public)   │     │
│  ├──────────┤ ├──────────┤ ├──────────────────┤     │
│  │ Users    │ │ Logs     │ │ Reports           │     │
│  │ Routes   │ │ Routes   │ │ Routes            │     │
│  ├──────────┤ ├──────────┤ ├──────────────────┤     │
│  │ Settings │ │ Dept.    │ │ Health            │     │
│  │ Routes   │ │ Routes   │ │                   │     │
│  └──────────┘ └──────────┘ └──────────────────┘     │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │    node-cron (daily 7AM expiry scheduler)    │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              MongoDB Atlas (Replica Set)             │
│  Collections: users, identities, accesslogs,        │
│  refreshtokens, settings, departments               │
└─────────────────────────────────────────────────────┘
```

---

## 4. Database Schema

### 4.1 User

| Field                 | Type            | Notes                                          |
| --------------------- | --------------- | ---------------------------------------------- |
| `fullName`            | String          | Required, trimmed                              |
| `email`               | String          | Required, unique, lowercase                    |
| `password`            | String          | bcrypt hashed, `select: false`, min 8 chars    |
| `role`                | String          | Enum: `admin`, `librarian`, `student`, `staff` |
| `matricNumber`        | String          | Students only                                  |
| `staffID`             | String          | Staff/librarians only                          |
| `phone`               | String          | Optional                                       |
| `department`          | String          | Optional, references Department.name           |
| `profileImage`        | String          | File path                                      |
| `isMFAEnabled`        | Boolean         | Default `true`                                 |
| `totpSecret`          | String          | Base32 TOTP secret                             |
| `isTOTPEnabled`       | Boolean         | Default `false`                                |
| `otpCode`             | String          | SHA-256 of current OTP                         |
| `otpExpiry`           | Date            | OTP expiration (5 min)                         |
| `loginAttempts`       | Number          | Failed attempts counter                        |
| `lockUntil`           | Date            | Lockout expiration                             |
| `isActive`            | Boolean         | Soft-delete, default `true`                    |
| `isEmailVerified`     | Boolean         | Default `false`                                |
| `passwordResetToken`  | String          | Hashed reset token                             |
| `passwordResetExpiry` | Date            | 1 hour                                         |
| `createdBy`           | ObjectId → User | Admin who created this user                    |

### 4.2 Identity

| Field               | Type            | Notes                                                  |
| ------------------- | --------------- | ------------------------------------------------------ |
| `digitalIDNumber`   | String          | Unique, format: `DID-POLY-XXXXXX`                      |
| `user`              | ObjectId → User | Owner                                                  |
| `fullName`          | String          | Mirrors user at time of issue                          |
| `photo`             | String          | `/uploads/filename`                                    |
| `role`              | String          | Mirrors user role                                      |
| `accessLevel`       | Number          | Enum: 1–4                                              |
| `department`        | String          |                                                        |
| `matricNumber`      | String          |                                                        |
| `staffID`           | String          |                                                        |
| `issueDate`         | Date            | Default `now()`                                        |
| `expiryDate`        | Date            | Required                                               |
| `status`            | String          | `Active`, `Suspended`, `Revoked`, `Expired`, `Pending` |
| `verifyToken`       | String          | SHA-256 hash of (rawToken + hmacSignature)             |
| `qrCodeImage`       | String          | Base64 PNG                                             |
| `suspendedAt`       | Date            |                                                        |
| `suspensionReason`  | String          |                                                        |
| `revokedAt`         | Date            |                                                        |
| `revocationReason`  | String          |                                                        |
| `renewedAt`         | Date            |                                                        |
| `renewedBy`         | ObjectId → User |                                                        |
| `expiryWarningSent` | Boolean         |                                                        |
| `finalWarningSent`  | Boolean         |                                                        |
| `issuedBy`          | ObjectId → User |                                                        |
| `lifecycleHistory`  | Array           | Subdocs: `{ action, performedBy, reason, timestamp }`  |

### 4.3 AccessLog

| Field         | Type                | Notes                                                                                                                                                                                                                                                                                                                                                     |
| ------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `identity`    | ObjectId → Identity | Optional                                                                                                                                                                                                                                                                                                                                                  |
| `user`        | ObjectId → User     | Optional                                                                                                                                                                                                                                                                                                                                                  |
| `action`      | String              | Enum: `LOGIN_SUCCESS`, `LOGIN_FAILED`, `OTP_SENT`, `OTP_VERIFIED`, `OTP_FAILED`, `QR_SCAN_VALID`, `QR_SCAN_INVALID`, `QR_SCAN_SUSPENDED`, `QR_SCAN_EXPIRED`, `IDENTITY_ISSUED`, `IDENTITY_RENEWED`, `IDENTITY_SUSPENDED`, `IDENTITY_REVOKED`, `IDENTITY_ACTIVATED`, `PASSWORD_RESET`, `ACCOUNT_LOCKED`, `2FA_ENABLED`, `2FA_DISABLED`, `IDENTITY_EXPIRED` |
| `outcome`     | String              | `Success`, `Failed`, `Suspicious`                                                                                                                                                                                                                                                                                                                         |
| `ipAddress`   | String              |                                                                                                                                                                                                                                                                                                                                                           |
| `userAgent`   | String              |                                                                                                                                                                                                                                                                                                                                                           |
| `details`     | String              |                                                                                                                                                                                                                                                                                                                                                           |
| `performedBy` | ObjectId → User     |                                                                                                                                                                                                                                                                                                                                                           |
| `timestamp`   | Date                | Default `now()`, indexed                                                                                                                                                                                                                                                                                                                                  |

### 4.4 RefreshToken

| Field       | Type            | Notes                       |
| ----------- | --------------- | --------------------------- |
| `token`     | String          | SHA-256 hashed              |
| `user`      | ObjectId → User |                             |
| `expiresAt` | Date            | TTL index for auto-deletion |
| `isRevoked` | Boolean         | Default `false`             |

### 4.5 Department

| Field         | Type            | Notes              |
| ------------- | --------------- | ------------------ |
| `name`        | String          | Required, unique   |
| `code`        | String          | e.g., `CSC`, `MTH` |
| `description` | String          |                    |
| `isActive`    | Boolean         | Default `true`     |
| `createdBy`   | ObjectId → User |                    |

### 4.6 Settings (singleton document)

| Field                     | Type                              | Default                            |
| ------------------------- | --------------------------------- | ---------------------------------- |
| `institutionName`         | String                            | Delta State Polytechnic Library    |
| `institutionAddress`      | String                            | Otefe-Oghara, Delta State, Nigeria |
| `institutionPhone`        | String                            | +234 800 000 0000                  |
| `defaultExpiryMonths`     | Number                            | 12                                 |
| `expiryWarningDays`       | Number                            | 30                                 |
| `finalWarningDays`        | Number                            | 7                                  |
| `requireMFAForAll`        | Boolean                           | true                               |
| `allowTOTP`               | Boolean                           | true                               |
| `loginRateLimitMax`       | Number                            | 5                                  |
| `accountLockoutMinutes`   | Number                            | 30                                 |
| `accessLevelDescriptions` | Array of `{ level, description }` |                                    |

---

## 5. Authentication & Authorization Flow

### 5.1 Login Flow (MFA Required)

```
User enters email + password
        │
        ▼
   POST /api/auth/login
        │
        ├── Validate email/password exist
        ├── Find user by email (+password field)
        ├── Check account active
        ├── Check account locked (lockUntil > now)
        ├── Compare password (bcrypt)
        │
        ├── FAIL → increment loginAttempts
        │          if attempts ≥ 5 → lock account 30 min
        │          return 401
        │
        └── SUCCESS → reset loginAttempts
                       │
                       ├── User has TOTP enabled?
                       │   YES → return { mfaRequired: true, method: 'totp', email }
                       │
                       ├── User has MFA enabled (email OTP)?
                       │   YES → generate 6-digit OTP
                       │          SHA-256 hash → store in user.otpCode
                       │          send email + console.log
                       │          return { mfaRequired: true, method: 'email', email }
                       │
                       └── No MFA → generate JWT tokens
                                     store refresh token
                                     set httpOnly cookie
                                     return accessToken + user
```

### 5.2 OTP Verification

```
POST /api/auth/verify-otp { email, otp }
  → hash input OTP with SHA-256
  → compare to stored user.otpCode
  → check user.otpExpiry not expired
  → clear otpCode/otpExpiry via updateOne
  → generate tokens, log access
  → return accessToken + user
```

### 5.3 TOTP Verification

```
POST /api/auth/verify-totp { email, token/totp }
  → speakeasy.totp.verify({ secret, token, window: 1 })
  → generate tokens, log access
  → return accessToken + user
```

### 5.4 Token Refresh

```
POST /api/auth/refresh (httpOnly cookie)
  → find RefreshToken by hash
  → check not revoked, not expired
  → verify JWT signature on cookie
  → revoke old token
  → issue new token pair
  → return new accessToken
```

### 5.5 Authorization Middleware

**`protect` middleware (`authMiddleware.js`):**

1. Extract `Bearer <token>` from Authorization header
2. `jwt.verify(token, JWT_ACCESS_SECRET)` → decode `{ id, role }`
3. `User.findById(decoded.id).select('-password')`
4. Attach user to `req.user`, call `next()`

**`authorize(...roles)` middleware (`roleMiddleware.js`):**

1. Check `req.user.role` is in allowed roles array
2. If not → `403 Access denied`
3. If yes → `next()`

---

## 6. API Reference

### 6.1 Authentication (`/api/auth`)

| Method | Endpoint                 | Auth    | Rate-Limited  | Description                    |
| ------ | ------------------------ | ------- | ------------- | ------------------------------ |
| POST   | `/register`              | No      | No            | Self-register as student/staff |
| POST   | `/login`                 | No      | Yes (5/15min) | Step 1: email + password       |
| POST   | `/verify-otp`            | No      | No            | Step 2: email OTP code         |
| POST   | `/verify-totp`           | No      | No            | Step 2: TOTP code              |
| POST   | `/refresh`               | No      | No            | Rotate refresh token           |
| POST   | `/logout`                | No      | No            | Revoke refresh token           |
| POST   | `/forgot-password`       | No      | No            | Send reset link                |
| POST   | `/reset-password/:token` | No      | No            | Set new password               |
| GET    | `/me`                    | protect | No            | Current user profile           |
| GET    | `/totp/setup`            | protect | No            | Get TOTP secret + QR           |
| POST   | `/totp/enable`           | protect | No            | Enable TOTP (verify token)     |
| POST   | `/totp/disable`          | protect | No            | Disable TOTP                   |

### 6.2 Identities (`/api/identity`)

| Method | Endpoint        | Auth    | Role  | Description                             |
| ------ | --------------- | ------- | ----- | --------------------------------------- |
| POST   | `/`             | protect | admin | Issue new identity (multipart)          |
| GET    | `/`             | protect | all   | List identities (paginated, filterable) |
| GET    | `/my`           | protect | all   | Current user's identity                 |
| GET    | `/:id`          | protect | all   | Single identity details                 |
| PUT    | `/:id`          | protect | admin | Update identity fields                  |
| POST   | `/:id/suspend`  | protect | admin | Suspend + email notification            |
| POST   | `/:id/activate` | protect | admin | Reactivate suspended only               |
| POST   | `/:id/revoke`   | protect | admin | Permanent revoke + email                |
| POST   | `/:id/renew`    | protect | admin | Renew + new QR code                     |
| GET    | `/:id/download` | protect | all   | Download PDF ID card                    |
| PUT    | `/:id/photo`    | protect | all   | Update photo (multipart)                |

### 6.3 Verification (`/api/verify`)

| Method | Endpoint  | Auth | Description                     |
| ------ | --------- | ---- | ------------------------------- |
| GET    | `/:token` | No   | Public QR verification endpoint |

### 6.4 Users (`/api/users`) — all admin-only

| Method | Endpoint          | Description            |
| ------ | ----------------- | ---------------------- |
| POST   | `/`               | Create user (any role) |
| POST   | `/register-admin` | Create admin account   |
| GET    | `/`               | List users (paginated) |
| GET    | `/:id`            | Get single user        |
| PUT    | `/:id`            | Update user fields     |
| PUT    | `/:id/unlock`     | Unlock locked account  |
| PUT    | `/:id/deactivate` | Toggle active/inactive |

### 6.5 Access Logs (`/api/logs`)

| Method | Endpoint  | Auth            | Description          |
| ------ | --------- | --------------- | -------------------- |
| GET    | `/`       | admin/librarian | All logs (paginated) |
| GET    | `/my`     | all             | Own logs             |
| GET    | `/export` | admin           | Export as PDF        |

### 6.6 Reports (`/api/reports`) — admin only

| Method | Endpoint              | Description                           |
| ------ | --------------------- | ------------------------------------- |
| GET    | `/summary`            | Summary counts by status              |
| GET    | `/monthly-issuance`   | Monthly identity issuance (12 months) |
| GET    | `/access-summary`     | Login/scan activity (30 days)         |
| GET    | `/role-breakdown`     | Identity count by role                |
| GET    | `/export/identities`  | Export identity register PDF          |
| GET    | `/export/access-logs` | Export access log report PDF          |

### 6.7 Settings (`/api/settings`)

| Method | Endpoint | Auth  | Description            |
| ------ | -------- | ----- | ---------------------- |
| GET    | `/`      | all   | Get system settings    |
| PUT    | `/`      | admin | Update system settings |

### 6.8 Departments (`/api/departments`)

| Method | Endpoint | Auth  | Description                 |
| ------ | -------- | ----- | --------------------------- |
| GET    | `/`      | all   | List all active departments |
| GET    | `/:id`   | all   | Get single department       |
| POST   | `/`      | admin | Create department           |
| PUT    | `/:id`   | admin | Update department           |
| DELETE | `/:id`   | admin | Delete department           |

### 6.9 Health

| Method | Endpoint      | Description         |
| ------ | ------------- | ------------------- |
| GET    | `/api/health` | Server health check |

---

## 7. Frontend Pages & Routing

### 7.1 Public Routes (no auth)

| Route                    | Page               | Purpose                           |
| ------------------------ | ------------------ | --------------------------------- |
| `/login`                 | Login.jsx          | Email + password form             |
| `/signup`                | SignUp.jsx         | Self-registration (student/staff) |
| `/verify-otp`            | OTPVerify.jsx      | Enter 6-digit email OTP           |
| `/verify-totp`           | TOTPVerify.jsx     | Enter 6-digit TOTP code           |
| `/forgot-password`       | ForgotPassword.jsx | Request reset email               |
| `/reset-password/:token` | ResetPassword.jsx  | Set new password                  |

### 7.2 Admin Routes (role: admin)

| Route                         | Page               | Purpose                              |
| ----------------------------- | ------------------ | ------------------------------------ |
| `/admin/dashboard`            | Dashboard.jsx      | Metrics, charts, alerts, recent logs |
| `/admin/identities`           | Identities.jsx     | Search/filter all identities table   |
| `/admin/identities/new`       | IssueIdentity.jsx  | Issue new identity card              |
| `/admin/identities/:id`       | IdentityDetail.jsx | View/manage single identity          |
| `/admin/users`                | UserManagement.jsx | CRUD users, edit/unlock/deactivate   |
| `/admin/users/register-admin` | RegisterAdmin.jsx  | Create admin account                 |
| `/admin/logs`                 | AccessLogs.jsx     | Full audit trail                     |
| `/admin/reports`              | Reports.jsx        | Charts + export buttons              |
| `/admin/settings`             | Settings.jsx       | System configuration                 |
| `/admin/departments`          | Departments.jsx    | Manage departments                   |

### 7.3 Librarian Routes (role: librarian)

| Route                   | Page           | Purpose                        |
| ----------------------- | -------------- | ------------------------------ |
| `/librarian/dashboard`  | Dashboard.jsx  | Scan metrics                   |
| `/librarian/verify`     | ScanVerify.jsx | QR scanner + manual code entry |
| `/librarian/identities` | Identities.jsx | Read-only identity table       |
| `/librarian/logs`       | AccessLogs.jsx | Read-only logs                 |

### 7.4 User Routes (roles: student, staff)

| Route                  | Page              | Purpose                       |
| ---------------------- | ----------------- | ----------------------------- |
| `/user/dashboard`      | Dashboard.jsx     | Status card + recent activity |
| `/user/my-id`          | MyID.jsx          | Full digital ID card display  |
| `/user/access-history` | AccessHistory.jsx | Own access log                |
| `/user/security`       | Security.jsx      | Change password + TOTP setup  |
| `/user/profile`        | Profile.jsx       | Edit details + upload photo   |

### 7.5 Component Hierarchy

```
App.jsx
├── BrowserRouter
│   └── AuthProvider
│       └── ErrorBoundary
│           └── AppRoutes
│               ├── Public routes (no layout)
│               └── Protected routes
│                   └── RoleRoute
│                       └── PageWrapper
│                           ├── Navbar
│                           ├── Sidebar
│                           └── [Page Content]
```

---

## 8. Role-Based Access Control

### 8.1 Role Definitions

| Role          | Dashboard Prefix | Permissions                                                          |
| ------------- | ---------------- | -------------------------------------------------------------------- |
| **admin**     | `/admin`         | Full CRUD on identities, users, settings, departments, reports, logs |
| **librarian** | `/librarian`     | QR scan & verify, read identities, read logs                         |
| **student**   | `/user`          | View own identity, access history, security, profile                 |
| **staff**     | `/user`          | Same as student                                                      |

### 8.2 How It Works

1. **ProtectedRoute.jsx**: checks `isAuthenticated` from AuthContext. Redirects to `/login` if not.
2. **RoleRoute.jsx**: checks `user.role` against `allowedRoles` prop. Redirects to role-specific dashboard if unauthorized.
3. **Backend `roleMiddleware.js`**: checks `req.user.role` before each admin/librarian-only endpoint.

---

## 9. QR Verification System

### 9.1 Token Generation

When an identity is issued or renewed:

```js
const identityId = md5(digitalIDNumber);
const { rawToken, hmacSignature } = generateVerifyToken(identityId);
// rawToken = crypto.randomBytes(32).toString('hex')
// hmacSignature = HMAC-SHA256(IDENTITY_VERIFY_SECRET, identityId + rawToken)
const verifyUrl = `${CLIENT_URL}/verify/${rawToken}.${hmacSignature}`;
// Stored: SHA-256(rawToken + hmacSignature)
```

### 9.2 Verification Flow

```
Librarian scans QR code (or enters token manually)
        │
        ▼
  GET /api/verify/:token
        │
        ├── Parse: rawToken.hmacSignature from URL
        ├── Recompute HMAC using IDENTITY_VERIFY_SECRET + rawToken
        ├── Compute SHA-256(rawToken + hmacSignature)
        ├── Find Identity by verifyToken match
        │
        ├── Not found → QR_SCAN_INVALID
        ├── Suspended → QR_SCAN_SUSPENDED
        ├── Revoked  → QR_SCAN_INVALID
        ├── Expired  → QR_SCAN_EXPIRED
        └── Active   → QR_SCAN_VALID → return identity details
```

### 9.3 QR Code Content

The QR code encodes a URL like:XZ

```
http://localhost:5173/verify/<64-char-hex>.<64-char-hex-sig>
```

This URL is never rendered as a page in the frontend; it is only scanned by the librarian's QR scanner.

---

## 10. Multi-Factor Authentication

### 10.1 Email OTP

- 6-digit numeric code
- Generated via `crypto.randomInt(100000, 999999)`
- Stored as SHA-256 hash (never plaintext in DB)
- Expires in 5 minutes
- Logged to console as fallback when email fails
- Email sent via Nodemailer (Gmail SMTP)

### 10.2 TOTP (Authenticator App)

- Compatible with Google Authenticator, Authy, etc.
- Uses `speakeasy.generateSecret({ length: 20 })`
- QR code generated server-side via `qrcode.toDataURL(otpauth_url)`
- Setup flow:
  1. Call `GET /auth/totp/setup` → get `{ secret, qrCode, otpauth_url }`
  2. User scans QR code in authenticator app
  3. User enters 6-digit code from app
  4. Call `POST /auth/totp/enable { token, secret }` → server verifies + saves secret

### 10.3 Account Lockout

- After 5 failed login attempts, account is locked for 30 minutes
- Admin can manually unlock via `/admin/users` → Unlock button
- Lockout resets on successful password reset

### 10.4 Rate Limiting

- `/api/auth/login`: max 5 requests per 15-minute window per IP
- Configurable via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX` env vars

---

## 11. Identity Lifecycle

```
                ┌──────────┐
                │  Issued  │
                └────┬─────┘
                     │
              ┌──────┴──────┐
              │              │
         ┌────▼────┐   ┌────▼────┐
         │ Active  │   │ Pending │
         └────┬────┘   └─────────┘
              │
     ┌────────┼────────┐
     │        │        │
  ┌──▼──┐  ┌──▼──┐  ┌──▼──┐
  │Sus- │  │Ex-  │  │Re-  │
  │pend-│  │pired│  │voked│
  │ed   │  └─────┘  └─────┘
  └──┬──┘
     │
  ┌──▼──┐
  │Acti-│
  │vated│ → back to Active
  └─────┘
```

Each status transition is logged in:

1. `identity.lifecycleHistory[]` array (for display in IdentityDetail page)
2. `AccessLog` collection (for audit trail)

**State transition rules:**

- Only `Active` → `Suspended` (via admin)
- Only `Suspended` → `Active` (via admin "Activate")
- Any state → `Revoked` (permanent, no undo)
- `Expired` → automatically set by cron job
- `Revoked` → cannot be renewed

---

## 12. Email & Notifications

### 12.1 Email Events

| Event              | Recipient | Content                        |
| ------------------ | --------- | ------------------------------ |
| Login OTP          | User      | 6-digit code, expires in 5 min |
| Identity Issued    | User      | DID number, expiry date        |
| Identity Suspended | User      | Suspension reason              |
| Identity Activated | User      | Notification of reactivation   |
| Identity Revoked   | User      | Revocation reason              |
| Identity Renewed   | User      | New expiry date                |
| Expiry Warning     | User      | 30 days before expiry          |
| Final Warning      | User      | 7 days before expiry           |
| Password Reset     | User      | Reset link (1 hour expiry)     |

### 12.2 Configuration

- SMTP: Gmail (host: `smtp.gmail.com`, port: 587)
- Credentials from `EMAIL_USER` / `EMAIL_PASS` env vars
- If SMTP fails → error logged but request proceeds (non-blocking)
- OTP is always printed to server console regardless of email success

---

## 13. Expiry Scheduler

A `node-cron` job runs daily at **7:00 AM** (`0 7 * * *`).

**Checks performed:**

1. Find all identities where `expiryDate < now` and status is `Active` or `Pending` → set status to `Expired`, log `IDENTITY_EXPIRED`
2. Find all identities expiring within `expiryWarningDays` (default 30) where `expiryWarningSent === false` → send warning email, set `expiryWarningSent = true`
3. Find all identities expiring within `finalWarningDays` (default 7) where `finalWarningSent === false` → send final warning email, set `finalWarningSent = true`

---

## 14. File Uploads

- **Library:** `multer`
- **Storage:** `server/uploads/` directory
- **Naming:** `{timestamp}-{original-filename}`
- **Allowed types:** `jpeg`, `jpg`, `png`, `gif`, `bmp`, `webp`
- **Max size:** 5MB
- **Served:** Staticly via Express at `/uploads/*`
- **Used for:** Identity card photos, user profile photos

---

## 15. Seed Data

Run via `npm run seed` from the `server/` directory.

### Seeded Records

**Departments (12):**
Computer Science (CSC), Mathematics (MTH), Physics (PHY), Chemistry (CHM), Biology (BIO), Library Science (LIB), Engineering (ENG), Business Administration (BUS), Accounting (ACC), Mass Communication (MCM), Library Administration (ADM), Library Services (LSR)

**Users (5):**
| Name | Email | Password | Role | ID |
|---|---|---|---|---|
| Admin User | admin@dspoly.edu.ng | Admin@1234 | admin | STAFF-ID: ADMIN-0001 |
| Librarian User | librarian@dspoly.edu.ng | Lib@1234 | librarian | STAFF-ID: LIB-0023 |
| Student User One | student@dspoly.edu.ng | Student@1234 | student | DSP/CS/2022/001 |
| Staff User One | staff@dspoly.edu.ng | Staff@1234 | staff | STAFF-ID: STAFF-0042 |
| Student User Two | student2@dspoly.edu.ng | Student2@1234 | student | DSP/CS/2022/002 |

**Identities (5):**

- DID-POLY-000001 → Student 1 (Active, Level 2)
- DID-POLY-000002 → Staff (Active, Level 3)
- DID-POLY-000003 → Student 2 (Suspended - "Lost identity card")
- DID-POLY-000004 → Admin (Revoked - "Upgraded")
- DID-POLY-000005 → Librarian (Expired)

**Access Logs (10):** Mixed events, timestamps, IPs.

**Settings (1):** Default system configuration.

---

## 16. Installation & Setup

### 16.1 Prerequisites

- Node.js v18+
- MongoDB Atlas account (M0 free tier)
- Git

### 16.2 Clone & Install

```bash
git clone <repo-url> secure_digital_identity_system
cd secure_digital_identity_system

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 16.3 Environment Configuration

Create `server/.env`:

```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas connection string (non-SRV format)
MONGO_URI=mongodb://<user>:<pass>@host1:27017,host2:27017,host3:27017/digital_identity_db?tls=true&replicaSet=<replica-set>&authSource=admin&retryWrites=true&w=majority

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES=24h
JWT_REFRESH_EXPIRES=30d
IDENTITY_VERIFY_SECRET=your_qr_verify_secret

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=Name <your.email@gmail.com>

CLIENT_URL=http://localhost:5173

INSTITUTION_NAME="Delta State Polytechnic Library"
INSTITUTION_ADDRESS="Otefe-Oghara, Delta State, Nigeria"
INSTITUTION_PHONE="+234 800 000 0000"

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=20
ACCOUNT_LOCKOUT_ATTEMPTS=20
ACCOUNT_LOCKOUT_DURATION_MIN=30
IDENTITY_DEFAULT_EXPIRY_MONTHS=12
IDENTITY_EXPIRY_WARNING_DAYS=30
```

> **Note:** Use non-SRV hostnames for Atlas (A records only). SRV records are often blocked by ISP DNS. Append `?tls=true` and specify `replicaSet=<name>`.

### 16.4 Seed the Database

```bash
cd server
npm run seed
```

---

## 17. Running the Application

### 17.1 Development Mode

**Terminal 1 (Backend):**

```bash
cd server
npm run dev
# Starts on http://localhost:5000 with nodemon
```

**Terminal 2 (Frontend):**

```bash
cd client
npm run dev
# Starts on http://localhost:5173 with Vite HMR
```

Vite proxies `/api/*` requests to `http://localhost:5000`.

### 17.2 Production Build

```bash
cd client
npm run build   # outputs to client/dist/
```

Serve `client/dist` from Express or deploy to a static host.

---

## 18. Environment Variables

| Variable                       | Default               | Description                           |
| ------------------------------ | --------------------- | ------------------------------------- |
| PORT                           | 5000                  | Server port                           |
| NODE_ENV                       | development           | `development` or `production`         |
| MONGO_URI                      | (required)            | MongoDB Atlas connection string       |
| JWT_ACCESS_SECRET              | (required)            | JWT signing secret for access tokens  |
| JWT_REFRESH_SECRET             | (required)            | JWT signing secret for refresh tokens |
| JWT_ACCESS_EXPIRES             | 24h                   | Access token expiry                   |
| JWT_REFRESH_EXPIRES            | 30d                   | Refresh token expiry                  |
| IDENTITY_VERIFY_SECRET         | (required)            | HMAC secret for QR tokens             |
| EMAIL_HOST                     | smtp.gmail.com        | SMTP host                             |
| EMAIL_PORT                     | 587                   | SMTP port                             |
| EMAIL_USER                     | (optional)            | SMTP username                         |
| EMAIL_PASS                     | (optional)            | SMTP password or app password         |
| EMAIL_FROM                     | (optional)            | Sender name/email                     |
| CLIENT_URL                     | http://localhost:5173 | Frontend URL for links                |
| RATE_LIMIT_WINDOW_MS           | 900000                | Rate limit window (15 min)            |
| RATE_LIMIT_MAX                 | 20                    | Max requests per window               |
| ACCOUNT_LOCKOUT_ATTEMPTS       | 20                    | Failed attempts before lock           |
| ACCOUNT_LOCKOUT_DURATION_MIN   | 30                    | Lockout duration in minutes           |
| IDENTITY_DEFAULT_EXPIRY_MONTHS | 12                    | Default identity validity             |
| IDENTITY_EXPIRY_WARNING_DAYS   | 30                    | Days before first warning             |

---

## 19. Project Structure

```
secure_digital_identity_system/
├── server/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── email.js           # Nodemailer transporter
│   ├── controllers/
│   │   ├── authController.js  # Login, register, OTP, TOTP, refresh, reset
│   │   ├── identityController.js  # CRUD, suspend, activate, revoke, renew
│   │   ├── userController.js  # Admin user management
│   │   ├── accessLogController.js # Audit log queries
│   │   ├── reportController.js # Summary, charts, PDF exports
│   │   ├── settingsController.js # System settings CRUD
│   │   ├── departmentController.js # Department CRUD
│   │   └── verifyController.js # QR token verification
│   ├── jobs/
│   │   └── expiryScheduler.js # Daily cron for expiry + warnings
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT protect middleware
│   │   ├── roleMiddleware.js   # Role-based access
│   │   ├── errorMiddleware.js  # Global error handler
│   │   ├── rateLimitMiddleware.js # Login rate limiter
│   │   └── uploadMiddleware.js # Multer file uploads
│   ├── models/
│   │   ├── User.js
│   │   ├── Identity.js
│   │   ├── AccessLog.js
│   │   ├── RefreshToken.js
│   │   ├── Settings.js
│   │   └── Department.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── identityRoutes.js
│   │   ├── verifyRoutes.js
│   │   ├── userRoutes.js
│   │   ├── accessLogRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── settingsRoutes.js
│   │   └── departmentRoutes.js
│   ├── utils/
│   │   ├── generateDID.js     # DID-POLY-XXXXXX format
│   │   ├── generateOTP.js     # 6-digit OTP
│   │   ├── generateTokens.js  # JWT pair generation
│   │   ├── generateVerifyToken.js # QR verify token + HMAC
│   │   ├── hashToken.js       # SHA-256 hashing
│   │   └── pdfGenerator.js    # PDFKit ID card generation
│   ├── uploads/               # Photo storage
│   ├── seedData.js            # Database seeder
│   ├── server.js              # Entry point
│   └── .env                   # Environment variables
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axiosInstance.js  # Axios + interceptors
│   │   │   └── index.js          # All API functions
│   │   ├── components/
│   │   │   ├── common/           # Reusable UI components
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── ConfirmDialog.jsx
│   │   │   │   ├── ErrorBoundary.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── Pagination.jsx
│   │   │   │   ├── SearchInput.jsx
│   │   │   │   ├── Spinner.jsx
│   │   │   │   └── Table.jsx
│   │   │   ├── features/         # Domain-specific components
│   │   │   │   ├── AccessLogRow.jsx
│   │   │   │   ├── DigitalIDCard.jsx
│   │   │   │   ├── OTPInput.jsx
│   │   │   │   ├── QRScanner.jsx
│   │   │   │   ├── TOTPSetup.jsx
│   │   │   │   └── VerifyResult.jsx
│   │   │   └── layout/
│   │   │       ├── AuthLayout.jsx
│   │   │       ├── Navbar.jsx
│   │   │       ├── PageWrapper.jsx
│   │   │       └── Sidebar.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Auth state management
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── useFetch.js
│   │   ├── pages/                # Page components
│   │   │   ├── auth/
│   │   │   ├── admin/
│   │   │   ├── librarian/
│   │   │   └── user/
│   │   ├── routes/
│   │   │   ├── AppRoutes.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── RoleRoute.jsx
│   │   ├── utils/
│   │   │   ├── formatDate.js
│   │   │   └── validators.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── DOCUMENTATION.md
├── digital-identity-MASTER-PROMPT.txt
└── README.md
```

---

## 20. Security Considerations

### 20.1 Password Security

- bcrypt hashing (salt rounds: 10)
- Password field excluded from queries by default (`select: false`)
- Min 8 character length enforced

### 20.2 Token Security

- Access tokens: short-lived (24h), stored in `localStorage`
- Refresh tokens: long-lived (30d), stored in `httpOnly` cookie
- Refresh token rotation: old token revoked on each refresh
- QR verify tokens: HMAC-signed + SHA-256 hashed in DB

### 20.3 Rate Limiting

- Login endpoint: 5 attempts per IP per 15 minutes
- Account lockout: 5 failed attempts → 30 min lock
- Configurable via env vars

### 20.4 Data Protection

- OTP codes stored as SHA-256 hashes (never plaintext)
- TOTP secrets stored in DB (encrypted at rest by MongoDB Atlas)
- Password reset tokens expire after 1 hour
- .env files gitignored (secrets never committed)

### 20.5 Input Validation

- Email normalization (lowercase, trim)
- Mongoose schema validation on all models
- Allowed fields whitelist on update endpoints
- File upload type/size limits via Multer

### 20.6 CORS

- Development: origin `*`, credentials: true
- Production: restrict to specific domain

---

## 21. Common Issues & Fixes

### 21.1 MongoDB Connection Fails

**Cause:** SRV records blocked by ISP DNS  
**Fix:** Use non-SRV hostnames + `?tls=true` + `&replicaSet=<name>` in MONGO_URI

### 21.2 OTP Verification "No OTP requested"

**Cause:** React 18 StrictMode double-fires useEffect, sending two verify-otp requests. First succeeds, second finds OTP consumed.  
**Fix:** Use `submittedRef` ref to prevent double-submit.

### 21.3 QR Code Not Displaying in TOTP Setup

**Cause:** Frontend destructured `qrCodeUrl` but API returns `qrCode`.  
**Fix:** Destructure as `qrCode: qrCodeUrl` to alias the field.

### 21.4 TOTP Enable Fails

**Cause:** Frontend wasn't sending the `secret` needed for token verification.  
**Fix:** Pass `(token, secret)` to `enableTOTP` API call.

### 21.5 TOTP Status Not Reflecting in UI

**Cause:** `loadTOTPStatus()` called `getTOTPSetup` which always returns a new secret (never the enabled status).  
**Fix:** Use `getMe()` to check `isTOTPEnabled` instead (the real source of truth).

### 21.6 Department Shows `[object Object]` in Settings

**Cause:** Backend stores `accessLevelDescriptions` as array `[{ level, description }]`, frontend expects object map `{ "1": "text" }`.  
**Fix:** Controller transforms array → object on read, object → array on write.

### 21.7 Digital ID Shows "N/A"

**Cause:** Frontend column key was `digitalId` but backend/model field is `digitalIDNumber`.  
**Fix:** Change column key to `digitalIDNumber`.

### 21.8 White Page / Blank Screen

**Cause:** Uncaught render error crashes React tree.  
**Fix:** `ErrorBoundary` component wraps routes and shows a "Reload" button.

### 21.9 "Something went wrong" on Reports Page

**Cause:** API returns `{ roleBreakdown: [...] }` but frontend reads `r.data`. Also charts crash on empty arrays.  
**Fix:** Read `r.roleBreakdown`, wrap charts in `Array.isArray` guards.

### 21.10 Department Field Shows Text Input Instead of Dropdown

**Cause:** Some pages were built before the Department feature existed.  
**Fix:** Replace `<input>` with `<select>` populated from `api.getDepartments()`.
