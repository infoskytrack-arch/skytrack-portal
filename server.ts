import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;
const ROOT_DIR = process.cwd();
const DATA_DIR = path.resolve(ROOT_DIR, 'data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const REQUESTS_FILE = path.resolve(DATA_DIR, 'requests.json');
const ADMIN_AUTH_FILE = path.resolve(DATA_DIR, 'admin-auth.json');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Signing key held in process memory (or env) for short-lived Bearer tokens
const TOKEN_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16
    ? process.env.SESSION_SECRET
    : crypto.randomBytes(32).toString('hex');

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5 MB

interface StoredPassenger {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Transgender';
  berthPreference: string;
  idProofType?: string;
}

interface StoredBookingRequest {
  id: string;
  referenceId: string;
  createdAt: string;
  updatedAt: string;
  serviceType?: 'train' | 'flight' | 'bus';
  trainNumber: string;
  trainName: string;
  fromStation: string;
  toStation: string;
  boardingStation: string;
  journeyDate: string;
  returnDate?: string;
  travelClass: string;
  quota: string;
  extraPreferences?: string;
  allowAlternateTrain?: boolean;
  allowClassUpgrade?: boolean;
  isAdvanceOpeningPriority?: boolean;
  referredBy?: string;
  advancePaymentChoice?: 'advance-token' | 'pay-after-confirmation';
  advanceTokenAmount?: number;
  paymentProofMethod?: 'screenshot' | 'utr' | 'whatsapp-chat';
  paymentScreenshotStoredName?: string;
  paymentScreenshotOriginalName?: string;
  passengers: StoredPassenger[];
  mobile: string;
  alternatePhone?: string;
  email?: string;
  paymentReference?: string;
  deliveryChannel: 'whatsapp' | 'email' | 'admin-direct';
  status: 'Pending Verification' | 'Fare Confirmed' | 'Ticket Issued' | 'Cancelled';
  pnrNumber?: string;
  agentRemark?: string;
  pdfStoredName?: string;
  pdfOriginalName?: string;
}

interface AdminAuthStore {
  saltHex: string;
  hashHex: string;
  createdAt: string;
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJsonFileAtomic(filePath: string, data: unknown): void {
  const tmpPath = `${filePath}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpPath, filePath);
}

function loadRequests(): StoredBookingRequest[] {
  return readJsonFile<StoredBookingRequest[]>(REQUESTS_FILE, []);
}

function saveRequests(items: StoredBookingRequest[]): void {
  writeJsonFileAtomic(REQUESTS_FILE, items);
}

function loadAdminAuth(): AdminAuthStore | null {
  return readJsonFile<AdminAuthStore | null>(ADMIN_AUTH_FILE, null);
}

function sanitizeString(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLen);
}

function normalizeMobile(value: unknown): string {
  if (typeof value !== 'string') return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  return digits.slice(-10);
}

function isValidMobile(mobile: string): boolean {
  return /^[6-9]\d{9}$/.test(mobile);
}

function generateReferenceId(): string {
  const year = new Date().getFullYear();
  const num = crypto.randomInt(100000, 999999);
  return `ST-${year}-${num}`;
}

function hashPasswordScrypt(password: string, saltHex: string): string {
  return crypto.scryptSync(password, saltHex, 64).toString('hex');
}

function constantTimeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function verifyAdminPassword(candidate: string): boolean {
  const envPassword = process.env.ADMIN_PASSWORD?.trim();
  if (envPassword && envPassword.length > 0) {
    return constantTimeStringEqual(candidate, envPassword);
  }

  const stored = loadAdminAuth();
  if (!stored) return false;
  const candidateHash = hashPasswordScrypt(candidate, stored.saltHex);
  return constantTimeStringEqual(candidateHash, stored.hashHex);
}

function issueAdminToken(): string {
  const payload = Buffer.from(
    JSON.stringify({
      role: 'admin',
      exp: Date.now() + TOKEN_TTL_MS,
      nonce: crypto.randomBytes(8).toString('hex'),
    })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

function verifyAdminToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  if (!payload || !signature) return false;

  const expectedSig = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('base64url');
  if (!constantTimeStringEqual(signature, expectedSig)) return false;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      role?: string;
      exp?: number;
    };
    return decoded.role === 'admin' && typeof decoded.exp === 'number' && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7).trim();
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token || !verifyAdminToken(token)) {
    res.status(401).json({ error: 'Admin authentication required.' });
    return;
  }
  next();
}

function resolveConfinedPdfPath(storedName: string): string | null {
  if (!/^[a-f0-9-]+\.pdf$/i.test(storedName)) return null;
  const resolved = path.resolve(UPLOADS_DIR, storedName);
  if (!resolved.startsWith(UPLOADS_DIR + path.sep)) return null;
  return resolved;
}

function resolveConfinedImagePath(storedName: string): string | null {
  if (!/^[a-f0-9-]+\.(png|jpg)$/i.test(storedName)) return null;
  const resolved = path.resolve(UPLOADS_DIR, storedName);
  if (!resolved.startsWith(UPLOADS_DIR + path.sep)) return null;
  return resolved;
}

function saveValidatedImageBase64(
  imageBase64: string,
  originalName?: string
): { storedName: string; originalName: string } {
  const cleaned = imageBase64.includes(',') ? imageBase64.split(',').pop() || '' : imageBase64;
  const buffer = Buffer.from(cleaned, 'base64');

  if (buffer.length === 0 || buffer.length > MAX_PDF_BYTES) {
    throw new Error('Payment screenshot must be non-empty and under 5 MB.');
  }

  // Strictly validate PNG or JPEG magic bytes
  const isPng =
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;
  const isJpeg =
    buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

  if (!isPng && !isJpeg) {
    throw new Error('Payment screenshot must be a valid JPG or PNG image.');
  }

  const ext = isPng ? 'png' : 'jpg';
  const storedName = `${crypto.randomUUID()}.${ext}`;
  const targetPath = resolveConfinedImagePath(storedName);
  if (!targetPath) {
    throw new Error('Invalid file storage path.');
  }

  fs.writeFileSync(targetPath, buffer);
  const safeOriginal =
    sanitizeString(originalName || `payment-proof.${ext}`, 120).replace(/[^a-zA-Z0-9._ -]/g, '') ||
    `payment-proof.${ext}`;

  return {
    storedName,
    originalName: safeOriginal,
  };
}

function saveValidatedPdfBase64(
  pdfBase64: string,
  originalName?: string
): { storedName: string; originalName: string } {
  const cleaned = pdfBase64.includes(',') ? pdfBase64.split(',').pop() || '' : pdfBase64;
  const buffer = Buffer.from(cleaned, 'base64');

  if (buffer.length === 0 || buffer.length > MAX_PDF_BYTES) {
    throw new Error('Ticket PDF must be non-empty and under 5 MB.');
  }

  // Verify %PDF- magic bytes
  const header = buffer.subarray(0, 5).toString('ascii');
  if (header !== '%PDF-') {
    throw new Error('Uploaded file must be a valid PDF document.');
  }

  const storedName = `${crypto.randomUUID()}.pdf`;
  const targetPath = resolveConfinedPdfPath(storedName);
  if (!targetPath) {
    throw new Error('Invalid file storage path.');
  }

  fs.writeFileSync(targetPath, buffer);
  const safeOriginal =
    sanitizeString(originalName || 'Confirmed-Ticket.pdf', 120).replace(/[^a-zA-Z0-9._ -]/g, '') ||
    'Confirmed-Ticket.pdf';

  return {
    storedName,
    originalName: safeOriginal.toLowerCase().endsWith('.pdf') ? safeOriginal : `${safeOriginal}.pdf`,
  };
}

function toPublicRecord(rec: StoredBookingRequest) {
  return {
    id: rec.id,
    referenceId: rec.referenceId,
    createdAt: rec.createdAt,
    updatedAt: rec.updatedAt,
    serviceType: rec.serviceType || 'train',
    trainNumber: rec.trainNumber,
    trainName: rec.trainName,
    fromStation: rec.fromStation,
    toStation: rec.toStation,
    boardingStation: rec.boardingStation,
    journeyDate: rec.journeyDate,
    returnDate: rec.returnDate,
    travelClass: rec.travelClass,
    quota: rec.quota,
    extraPreferences: rec.extraPreferences,
    allowAlternateTrain: Boolean(rec.allowAlternateTrain),
    allowClassUpgrade: Boolean(rec.allowClassUpgrade),
    isAdvanceOpeningPriority: Boolean(rec.isAdvanceOpeningPriority),
    referredBy: rec.referredBy,
    advancePaymentChoice: rec.advancePaymentChoice || 'pay-after-confirmation',
    advanceTokenAmount: rec.advanceTokenAmount,
    paymentProofMethod: rec.paymentProofMethod,
    hasPaymentScreenshot: Boolean(rec.paymentScreenshotStoredName),
    paymentScreenshotOriginalName: rec.paymentScreenshotOriginalName,
    passengers: rec.passengers,
    mobile: rec.mobile,
    alternatePhone: rec.alternatePhone,
    email: rec.email,
    paymentReference: rec.paymentReference,
    deliveryChannel: rec.deliveryChannel,
    status: rec.status,
    pnrNumber: rec.pnrNumber,
    agentRemark: rec.agentRemark,
    hasTicketPdf: Boolean(rec.pdfStoredName),
    pdfOriginalName: rec.pdfOriginalName,
  };
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '8mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Submit a new customer booking request
  app.post('/api/requests', (req, res) => {
    const body = req.body as Record<string, unknown>;

    const rawService = sanitizeString(body.serviceType, 16);
    const serviceType: 'train' | 'flight' | 'bus' =
      rawService === 'flight' || rawService === 'bus' ? rawService : 'train';

    const trainNumber = sanitizeString(body.trainNumber, 32);
    const trainName = sanitizeString(body.trainName, 120);
    const fromStation = sanitizeString(body.fromStation, 100);
    const toStation = sanitizeString(body.toStation, 100);
    const boardingStation = sanitizeString(body.boardingStation || body.fromStation, 100);
    const journeyDate = sanitizeString(body.journeyDate, 20);
    const returnDate = sanitizeString(body.returnDate, 20) || undefined;
    const travelClass = sanitizeString(body.travelClass, 60);
    const quota = sanitizeString(body.quota, 30) || 'GENERAL';
    const extraPreferences = sanitizeString(body.extraPreferences, 180) || undefined;
    const allowAlternateTrain = Boolean(body.allowAlternateTrain);
    const allowClassUpgrade = Boolean(body.allowClassUpgrade);
    const isAdvanceOpeningPriority = Boolean(body.isAdvanceOpeningPriority);
    const referredBy = sanitizeString(body.referredBy, 100) || undefined;
    const advancePaymentChoice: 'advance-token' | 'pay-after-confirmation' =
      body.advancePaymentChoice === 'advance-token'
        ? 'advance-token'
        : 'pay-after-confirmation';
    const mobile = normalizeMobile(body.mobile);
    const alternatePhone = body.alternatePhone ? normalizeMobile(body.alternatePhone) : undefined;
    const email = sanitizeString(body.email, 120) || undefined;
    const rawUtr = sanitizeString(body.paymentReference, 32).replace(/\D/g, '');
    const hasValidUtr = /^\d{12}$/.test(rawUtr);
    const willShareProofOnWhatsApp = Boolean(body.willShareProofOnWhatsApp);
    const paymentScreenshotBase64 =
      typeof body.paymentScreenshotBase64 === 'string' ? body.paymentScreenshotBase64 : '';
    const paymentScreenshotOriginalName =
      typeof body.paymentScreenshotOriginalName === 'string'
        ? body.paymentScreenshotOriginalName
        : undefined;
    const deliveryChannel = body.deliveryChannel === 'email' ? 'email' : 'whatsapp';

    if (!trainName || !fromStation || !toStation || !journeyDate || !travelClass) {
      res.status(400).json({ error: 'Incomplete journey details. Please fill all required fields.' });
      return;
    }

    let savedScreenshot: { storedName: string; originalName: string } | undefined;
    let paymentProofMethod: 'screenshot' | 'utr' | 'whatsapp-chat' | undefined;
    let paymentReference: string | undefined;

    if (advancePaymentChoice === 'advance-token') {
      const hasScreenshotInput = paymentScreenshotBase64.trim().length > 0;
      if (!hasScreenshotInput && !hasValidUtr && !willShareProofOnWhatsApp) {
        res.status(400).json({
          error:
            "Please complete at least ONE payment proof option (Upload Payment Screenshot, enter 12-digit UTR, or tick the WhatsApp screenshot checkbox), or select 'Skip Advance & Pay on Call/Cash'.",
        });
        return;
      }

      if (hasScreenshotInput) {
        try {
          savedScreenshot = saveValidatedImageBase64(
            paymentScreenshotBase64,
            paymentScreenshotOriginalName
          );
        } catch (err) {
          res.status(400).json({
            error: err instanceof Error ? err.message : 'Invalid payment screenshot image.',
          });
          return;
        }
      }

      if (hasValidUtr) {
        paymentReference = rawUtr;
      }

      if (savedScreenshot) {
        paymentProofMethod = 'screenshot';
      } else if (hasValidUtr) {
        paymentProofMethod = 'utr';
      } else {
        paymentProofMethod = 'whatsapp-chat';
      }
    }

    if (!isValidMobile(mobile)) {
      res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    if (!Array.isArray(body.passengers) || body.passengers.length === 0 || body.passengers.length > 6) {
      res.status(400).json({ error: 'Please add between 1 and 6 passengers.' });
      return;
    }

    const allowedGenders = new Set(['Male', 'Female', 'Transgender']);
    const allowedIdProofs = new Set(['', 'Aadhaar Card', 'Voter ID', 'PAN Card', 'Passport']);
    const passengers: StoredPassenger[] = [];
    for (const rawP of body.passengers) {
      const p = rawP as Record<string, unknown>;
      const pName = sanitizeString(p.name, 80);
      const pAge = Number(p.age);
      const pGender = sanitizeString(p.gender, 20);
      const pBerth = sanitizeString(p.berthPreference || 'No Preference', 30);
      const pIdProof = sanitizeString(p.idProofType || '', 30);

      if (!pName || !Number.isFinite(pAge) || pAge < 1 || pAge > 120 || !allowedGenders.has(pGender)) {
        res.status(400).json({ error: 'Each passenger must have a valid name, age (1–120), and gender.' });
        return;
      }

      passengers.push({
        name: pName,
        age: Math.round(pAge),
        gender: pGender as 'Male' | 'Female' | 'Transgender',
        berthPreference: pBerth,
        idProofType: allowedIdProofs.has(pIdProof) && pIdProof ? pIdProof : undefined,
      });
    }

    // Server-side deterministic calculation of optional advance token amount
    let advanceTokenAmount: number | undefined;
    if (advancePaymentChoice === 'advance-token') {
      const acTrainClasses = new Set(['1A', '2A', '3A', '3E', 'CC']);
      let perPassenger = 1000;
      if (serviceType === 'flight') {
        perPassenger = 2000;
      } else if (serviceType === 'bus') {
        perPassenger = travelClass.toLowerCase().includes('non-ac') ? 1000 : 2000;
      } else if (acTrainClasses.has(travelClass.toUpperCase())) {
        perPassenger = 2000;
      }
      advanceTokenAmount = perPassenger * passengers.length;
    }

    const now = new Date().toISOString();
    const record: StoredBookingRequest = {
      id: crypto.randomUUID(),
      referenceId: generateReferenceId(),
      createdAt: now,
      updatedAt: now,
      serviceType,
      trainNumber: trainNumber || (serviceType === 'train' ? 'CUSTOM' : serviceType.toUpperCase()),
      trainName,
      fromStation,
      toStation,
      boardingStation,
      journeyDate,
      returnDate,
      travelClass,
      quota,
      extraPreferences,
      allowAlternateTrain,
      allowClassUpgrade,
      isAdvanceOpeningPriority,
      referredBy,
      advancePaymentChoice,
      advanceTokenAmount,
      paymentProofMethod,
      paymentScreenshotStoredName: savedScreenshot?.storedName,
      paymentScreenshotOriginalName: savedScreenshot?.originalName,
      passengers,
      mobile,
      alternatePhone: alternatePhone && alternatePhone.length === 10 ? alternatePhone : undefined,
      email,
      paymentReference,
      deliveryChannel,
      status: 'Pending Verification',
    };

    const existing = loadRequests();
    existing.unshift(record);
    saveRequests(existing);

    res.status(201).json({ request: toPublicRecord(record) });
  });

  // Customer Track Request / Download Ticket lookup by mobile or referenceId
  app.get('/api/requests/track', (req, res) => {
    const mobileQuery = normalizeMobile(req.query.mobile);
    const refQuery = sanitizeString(req.query.ref, 40).toUpperCase();

    if (!isValidMobile(mobileQuery) && !refQuery) {
      res.status(400).json({ error: 'Enter a valid 10-digit mobile number or Booking Reference ID.' });
      return;
    }

    const all = loadRequests();
    const matches = all.filter((item) => {
      if (refQuery && item.referenceId.toUpperCase() === refQuery) return true;
      if (isValidMobile(mobileQuery) && item.mobile === mobileQuery) return true;
      return false;
    });

    res.json({ requests: matches.map(toPublicRecord) });
  });

  // Download Confirmed Ticket PDF (verified by customer mobile ownership OR admin Bearer token)
  app.get('/api/tickets/:id/download', (req, res) => {
    const id = sanitizeString(req.params.id, 64);
    const mobileQuery = normalizeMobile(req.query.mobile);
    const refQuery = sanitizeString(req.query.ref, 40).toUpperCase();
    const token = extractBearerToken(req);
    const isAdmin = Boolean(token && verifyAdminToken(token));

    const all = loadRequests();
    const record = all.find((item) => item.id === id);

    if (!record || !record.pdfStoredName) {
      res.status(404).json({ error: 'Confirmed ticket PDF not found for this booking.' });
      return;
    }

    const ownsByMobile = isValidMobile(mobileQuery) && record.mobile === mobileQuery;
    const ownsByRef = Boolean(refQuery && record.referenceId.toUpperCase() === refQuery);

    if (!isAdmin && !ownsByMobile && !ownsByRef) {
      res.status(403).json({ error: 'Unauthorized to download this ticket.' });
      return;
    }

    const pdfPath = resolveConfinedPdfPath(record.pdfStoredName);
    if (!pdfPath || !fs.existsSync(pdfPath)) {
      res.status(404).json({ error: 'Ticket PDF file is missing on server.' });
      return;
    }

    const downloadFilename = `SKYTRACK-${record.referenceId}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(pdfPath);
  });

  // Admin auth status (never returns any password or hash)
  app.get('/api/admin/status', (_req, res) => {
    const envConfigured = Boolean(process.env.ADMIN_PASSWORD?.trim());
    const stored = loadAdminAuth();
    res.json({
      configured: envConfigured || Boolean(stored),
      mode: envConfigured ? 'env' : stored ? 'claimed' : 'unconfigured',
    });
  });

  // One-time atomic first-run admin password setup (disabled once env password or claimed hash exists)
  app.post('/api/admin/setup', (req, res) => {
    if (process.env.ADMIN_PASSWORD?.trim()) {
      res.status(403).json({ error: 'Admin password is already configured via environment secrets.' });
      return;
    }
    if (loadAdminAuth()) {
      res.status(409).json({ error: 'Admin password has already been initialized. Please sign in.' });
      return;
    }

    const password = typeof req.body?.password === 'string' ? req.body.password.trim() : '';
    if (password.length < 6 || password.length > 128) {
      res.status(400).json({ error: 'Password must be between 6 and 128 characters.' });
      return;
    }

    const saltHex = crypto.randomBytes(16).toString('hex');
    const hashHex = hashPasswordScrypt(password, saltHex);
    const authPayload: AdminAuthStore = {
      saltHex,
      hashHex,
      createdAt: new Date().toISOString(),
    };

    try {
      // Atomic exclusive create flag prevents race conditions during setup
      fs.writeFileSync(ADMIN_AUTH_FILE, JSON.stringify(authPayload, null, 2), {
        encoding: 'utf8',
        flag: 'wx',
      });
    } catch {
      res.status(409).json({ error: 'Admin password was already set. Please sign in.' });
      return;
    }

    const token = issueAdminToken();
    res.status(201).json({ token });
  });

  // Admin login
  app.post('/api/admin/login', (req, res) => {
    const envConfigured = Boolean(process.env.ADMIN_PASSWORD?.trim());
    const stored = loadAdminAuth();
    if (!envConfigured && !stored) {
      res.status(400).json({ error: 'Admin password not initialized yet. Complete first-run setup.' });
      return;
    }

    const password = typeof req.body?.password === 'string' ? req.body.password.trim() : '';
    if (!password || !verifyAdminPassword(password)) {
      res.status(401).json({ error: 'Invalid admin password.' });
      return;
    }

    const token = issueAdminToken();
    res.json({ token });
  });

  // Admin: list all booking requests
  app.get('/api/admin/requests', requireAdmin, (_req, res) => {
    const all = loadRequests();
    res.json({ requests: all.map(toPublicRecord) });
  });

  // Admin: directly create a confirmed ticket record & upload PDF for walk-in / WhatsApp customers
  app.post('/api/admin/tickets', requireAdmin, (req, res) => {
    const body = req.body as Record<string, unknown>;
    const mobile = normalizeMobile(body.mobile);
    const passengerName = sanitizeString(body.passengerName, 80);
    const fromStation = sanitizeString(body.fromStation, 100);
    const toStation = sanitizeString(body.toStation, 100);
    const journeyDate = sanitizeString(body.journeyDate, 20);
    const trainNumber = sanitizeString(body.trainNumber, 32) || 'CONFIRMED';
    const trainName = sanitizeString(body.trainName, 120) || 'Confirmed Indian Railways Train';
    const travelClass = sanitizeString(body.travelClass, 10) || 'SL';
    const quota = sanitizeString(body.quota, 30) || 'GENERAL';
    const pnrNumber = sanitizeString(body.pnrNumber, 20);
    const agentRemark = sanitizeString(body.agentRemark, 240);
    const pdfBase64 = typeof body.pdfBase64 === 'string' ? body.pdfBase64 : '';
    const pdfOriginalName = typeof body.pdfOriginalName === 'string' ? body.pdfOriginalName : '';

    if (!isValidMobile(mobile) || !passengerName || !fromStation || !toStation || !journeyDate) {
      res.status(400).json({
        error: 'Mobile number, passenger name, from/to stations, and journey date are required.',
      });
      return;
    }

    let pdfInfo: { storedName: string; originalName: string } | undefined;
    if (pdfBase64) {
      try {
        pdfInfo = saveValidatedPdfBase64(pdfBase64, pdfOriginalName);
      } catch (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid PDF file.' });
        return;
      }
    }

    const now = new Date().toISOString();
    const record: StoredBookingRequest = {
      id: crypto.randomUUID(),
      referenceId: generateReferenceId(),
      createdAt: now,
      updatedAt: now,
      trainNumber,
      trainName,
      fromStation,
      toStation,
      boardingStation: fromStation,
      journeyDate,
      travelClass,
      quota,
      passengers: [
        {
          name: passengerName,
          age: 30,
          gender: 'Male',
          berthPreference: 'No Preference',
        },
      ],
      mobile,
      deliveryChannel: 'admin-direct',
      status: pdfInfo ? 'Ticket Issued' : 'Fare Confirmed',
      pnrNumber: pnrNumber || undefined,
      agentRemark: agentRemark || undefined,
      pdfStoredName: pdfInfo?.storedName,
      pdfOriginalName: pdfInfo?.originalName,
    };

    const existing = loadRequests();
    existing.unshift(record);
    saveRequests(existing);

    res.status(201).json({ request: toPublicRecord(record) });
  });

  // Admin: update request status, PNR, remarks, and/or upload confirmed ticket PDF
  app.patch('/api/admin/requests/:id', requireAdmin, (req, res) => {
    const id = sanitizeString(req.params.id, 64);
    const body = req.body as Record<string, unknown>;
    const all = loadRequests();
    const index = all.findIndex((item) => item.id === id);

    if (index === -1) {
      res.status(404).json({ error: 'Booking request not found.' });
      return;
    }

    const current = all[index];
    const allowedStatuses = new Set([
      'Pending Verification',
      'Fare Confirmed',
      'Ticket Issued',
      'Cancelled',
    ]);

    if (typeof body.status === 'string' && allowedStatuses.has(body.status)) {
      current.status = body.status as StoredBookingRequest['status'];
    }
    if (typeof body.pnrNumber === 'string') {
      current.pnrNumber = sanitizeString(body.pnrNumber, 20) || undefined;
    }
    if (typeof body.agentRemark === 'string') {
      current.agentRemark = sanitizeString(body.agentRemark, 240) || undefined;
    }

    if (typeof body.pdfBase64 === 'string' && body.pdfBase64.length > 0) {
      try {
        const uploaded = saveValidatedPdfBase64(
          body.pdfBase64,
          typeof body.pdfOriginalName === 'string' ? body.pdfOriginalName : undefined
        );
        // Clean up previous PDF if replacing
        if (current.pdfStoredName) {
          const oldPath = resolveConfinedPdfPath(current.pdfStoredName);
          if (oldPath && fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
        current.pdfStoredName = uploaded.storedName;
        current.pdfOriginalName = uploaded.originalName;
        if (current.status !== 'Cancelled') {
          current.status = 'Ticket Issued';
        }
      } catch (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid PDF upload.' });
        return;
      }
    }

    current.updatedAt = new Date().toISOString();
    all[index] = current;
    saveRequests(all);

    res.json({ request: toPublicRecord(current) });
  });

  // Admin: view/download customer uploaded payment screenshot (admin-authenticated only)
  app.get('/api/admin/requests/:id/proof', requireAdmin, (req, res) => {
    const id = sanitizeString(req.params.id, 64);
    const all = loadRequests();
    const record = all.find((item) => item.id === id);

    if (!record || !record.paymentScreenshotStoredName) {
      res.status(404).json({ error: 'Payment screenshot not found for this request.' });
      return;
    }

    const imgPath = resolveConfinedImagePath(record.paymentScreenshotStoredName);
    if (!imgPath || !fs.existsSync(imgPath)) {
      res.status(404).json({ error: 'Payment screenshot file is missing on server.' });
      return;
    }

    const ext = record.paymentScreenshotStoredName.endsWith('.png') ? 'png' : 'jpeg';
    res.setHeader('Content-Type', `image/${ext}`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(imgPath);
  });

  // Admin: delete request record and clean up its PDF & payment screenshot
  app.delete('/api/admin/requests/:id', requireAdmin, (req, res) => {
    const id = sanitizeString(req.params.id, 64);
    const all = loadRequests();
    const index = all.findIndex((item) => item.id === id);

    if (index === -1) {
      res.status(404).json({ error: 'Booking request not found.' });
      return;
    }

    const [removed] = all.splice(index, 1);
    if (removed.pdfStoredName) {
      const oldPath = resolveConfinedPdfPath(removed.pdfStoredName);
      if (oldPath && fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    if (removed.paymentScreenshotStoredName) {
      const oldProofPath = resolveConfinedImagePath(removed.paymentScreenshotStoredName);
      if (oldProofPath && fs.existsSync(oldProofPath)) {
        fs.unlinkSync(oldProofPath);
      }
    }

    saveRequests(all);
    res.json({ deleted: true });
  });

  // Vite middleware in development, static dist serving in production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(ROOT_DIR, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SKY TRACK server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
