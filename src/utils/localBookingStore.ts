import {
  type AdvancePaymentChoice,
  type BerthPreference,
  type BookingRequestRecord,
  type GenderType,
  type IdProofType,
  type PaymentProofMethod,
  type RequestStatus,
  type ServiceType,
} from '../types';
import { getPerPassengerAdvanceToken } from './bookingFormat';

const STORAGE_KEYS = {
  REQUESTS: 'skytrack_booking_requests_v1',
  ADMIN_HASH: 'skytrack_admin_password_hash_v1',
  PROOF_PREFIX: 'skytrack_proof_',
  PDF_PREFIX: 'skytrack_pdf_',
} as const;

export interface CreateLocalBookingInput {
  serviceType: ServiceType;
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
  advancePaymentChoice: AdvancePaymentChoice;
  passengers: Array<{
    name: string;
    age: number;
    gender: GenderType;
    berthPreference: BerthPreference;
    idProofType?: IdProofType;
  }>;
  mobile: string;
  alternatePhone?: string;
  email?: string;
  paymentReference?: string;
  paymentScreenshotDataUrl?: string;
  paymentScreenshotOriginalName?: string;
  willShareProofOnWhatsApp?: boolean;
  deliveryChannel: 'whatsapp' | 'email';
}

export interface UpdateLocalBookingInput {
  status?: RequestStatus;
  pnrNumber?: string;
  agentRemark?: string;
  pdfDataUrl?: string;
  pdfOriginalName?: string;
}

export interface CreateDirectLocalTicketInput {
  mobile: string;
  passengerName: string;
  fromStation: string;
  toStation: string;
  journeyDate: string;
  trainNumber: string;
  trainName: string;
  travelClass: string;
  quota: string;
  pnrNumber?: string;
  agentRemark?: string;
  pdfDataUrl: string;
  pdfOriginalName: string;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `st-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function generateReferenceId(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `ST-${yyyy}${mm}${dd}-${suffix}`;
}

function readAllRaw(): BookingRequestRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.REQUESTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as BookingRequestRecord[];
  } catch {
    return [];
  }
}

function writeAllRaw(records: BookingRequestRecord[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
}

export function getAllLocalBookingRequests(): BookingRequestRecord[] {
  return readAllRaw().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createLocalBookingRequest(
  input: CreateLocalBookingInput
): { record: BookingRequestRecord; storageWarning?: string } {
  const cleanedMobile = input.mobile.replace(/\D/g, '').slice(-10);
  if (!/^[6-9]\d{9}$/.test(cleanedMobile)) {
    throw new Error('Please enter a valid 10-digit WhatsApp mobile number.');
  }

  if (!Array.isArray(input.passengers) || input.passengers.length === 0 || input.passengers.length > 6) {
    throw new Error('Please add between 1 and 6 passengers.');
  }

  const cleanedUtr = (input.paymentReference || '').replace(/\D/g, '').slice(0, 12);
  const hasValidUtr = /^\d{12}$/.test(cleanedUtr);
  const hasScreenshotInput =
    typeof input.paymentScreenshotDataUrl === 'string' &&
    input.paymentScreenshotDataUrl.startsWith('data:image/');
  const willShareOnWhatsApp = Boolean(input.willShareProofOnWhatsApp);

  let paymentProofMethod: PaymentProofMethod | undefined;
  if (input.advancePaymentChoice === 'advance-token') {
    if (!hasScreenshotInput && !hasValidUtr && !willShareOnWhatsApp) {
      throw new Error(
        "Please complete at least ONE payment proof option (Upload Payment Screenshot, enter 12-digit UTR, or tick the WhatsApp screenshot checkbox), or select 'Skip Advance & Pay on Call/Cash'."
      );
    }
    if (hasScreenshotInput) {
      paymentProofMethod = 'screenshot';
    } else if (hasValidUtr) {
      paymentProofMethod = 'utr';
    } else {
      paymentProofMethod = 'whatsapp-chat';
    }
  }

  const tokenMeta = getPerPassengerAdvanceToken(input.serviceType, input.travelClass);
  const advanceTokenAmount =
    input.advancePaymentChoice === 'advance-token'
      ? tokenMeta.perPassenger * input.passengers.length
      : 0;

  const id = generateId();
  const nowIso = new Date().toISOString();

  let screenshotSaved = false;
  let storageWarning: string | undefined;

  if (input.advancePaymentChoice === 'advance-token' && hasScreenshotInput && input.paymentScreenshotDataUrl) {
    try {
      window.localStorage.setItem(
        `${STORAGE_KEYS.PROOF_PREFIX}${id}`,
        input.paymentScreenshotDataUrl
      );
      screenshotSaved = true;
    } catch {
      screenshotSaved = false;
      storageWarning =
        'Browser storage is nearly full, so the screenshot preview could not be saved locally. Please also attach it directly in WhatsApp.';
    }
  }

  const record: BookingRequestRecord = {
    id,
    referenceId: generateReferenceId(),
    createdAt: nowIso,
    updatedAt: nowIso,
    serviceType: input.serviceType,
    trainNumber: input.trainNumber.trim() || 'CUSTOM',
    trainName: input.trainName.trim() || 'Any Best Available Train',
    fromStation: input.fromStation.trim(),
    toStation: input.toStation.trim(),
    boardingStation: input.boardingStation.trim(),
    journeyDate: input.journeyDate,
    returnDate: input.returnDate || undefined,
    travelClass: input.travelClass.trim(),
    quota: input.quota.trim() || 'GENERAL',
    extraPreferences: input.extraPreferences?.trim() || undefined,
    allowAlternateTrain: Boolean(input.allowAlternateTrain),
    allowClassUpgrade: Boolean(input.allowClassUpgrade),
    isAdvanceOpeningPriority: Boolean(input.isAdvanceOpeningPriority),
    referredBy: input.referredBy?.trim() || undefined,
    advancePaymentChoice: input.advancePaymentChoice,
    advanceTokenAmount,
    paymentProofMethod,
    hasPaymentScreenshot: screenshotSaved || hasScreenshotInput,
    paymentScreenshotOriginalName: hasScreenshotInput
      ? (input.paymentScreenshotOriginalName || 'payment-screenshot.jpg').slice(0, 120)
      : undefined,
    passengers: input.passengers.map((p) => ({
      name: p.name.trim(),
      age: Math.round(Number(p.age)),
      gender: p.gender,
      berthPreference: p.berthPreference,
      idProofType: p.idProofType || undefined,
    })),
    mobile: cleanedMobile,
    alternatePhone: input.alternatePhone?.trim() || undefined,
    email: input.email?.trim() || undefined,
    paymentReference:
      input.advancePaymentChoice === 'advance-token' && hasValidUtr ? cleanedUtr : undefined,
    deliveryChannel: input.deliveryChannel,
    status: 'Pending Verification',
    hasTicketPdf: false,
  };

  const existing = readAllRaw();
  const saved = writeAllRaw([record, ...existing]);
  if (!saved && !storageWarning) {
    storageWarning =
      'Local browser history storage is unavailable, but your booking request details are ready to send on WhatsApp/Email.';
  }

  return { record, storageWarning };
}

export function trackLocalBookingRequests(rawQuery: string): BookingRequestRecord[] {
  const cleaned = rawQuery.trim();
  if (!cleaned) {
    throw new Error('Please enter your 10-digit mobile number or Booking Reference ID.');
  }

  const all = getAllLocalBookingRequests();
  const upper = cleaned.toUpperCase();

  if (upper.startsWith('ST-')) {
    return all.filter((r) => r.referenceId.toUpperCase() === upper);
  }

  const digits = cleaned.replace(/\D/g, '').slice(-10);
  if (!/^[6-9]\d{9}$/.test(digits)) {
    throw new Error('Please enter a valid 10-digit mobile number or Reference ID (e.g., ST-...).');
  }

  return all.filter((r) => r.mobile === digits);
}

export function updateLocalBookingRequest(
  recId: string,
  updates: UpdateLocalBookingInput
): BookingRequestRecord {
  const all = readAllRaw();
  const idx = all.findIndex((r) => r.id === recId);
  if (idx === -1) {
    throw new Error('Booking record not found.');
  }

  const current = all[idx];
  let hasTicketPdf = current.hasTicketPdf;
  let pdfOriginalName = current.pdfOriginalName;
  let nextStatus = updates.status ?? current.status;

  if (updates.pdfDataUrl) {
    try {
      window.localStorage.setItem(`${STORAGE_KEYS.PDF_PREFIX}${recId}`, updates.pdfDataUrl);
    } catch {
      throw new Error(
        'Browser storage limit reached for this PDF. Try a smaller PDF (under 2 MB) or delete older uploaded tickets.'
      );
    }
    hasTicketPdf = true;
    pdfOriginalName = (updates.pdfOriginalName || `SKYTRACK-${current.referenceId}.pdf`).slice(0, 120);
    if (!updates.status || updates.status === 'Pending Verification') {
      nextStatus = 'Ticket Issued';
    }
  }

  const updated: BookingRequestRecord = {
    ...current,
    status: nextStatus,
    pnrNumber:
      typeof updates.pnrNumber === 'string'
        ? updates.pnrNumber.trim() || undefined
        : current.pnrNumber,
    agentRemark:
      typeof updates.agentRemark === 'string'
        ? updates.agentRemark.trim() || undefined
        : current.agentRemark,
    hasTicketPdf,
    pdfOriginalName,
    updatedAt: new Date().toISOString(),
  };

  all[idx] = updated;
  if (!writeAllRaw(all)) {
    throw new Error('Could not save updated booking record in browser storage.');
  }
  return updated;
}

export function createDirectLocalTicket(
  input: CreateDirectLocalTicketInput
): BookingRequestRecord {
  const cleanedMobile = input.mobile.replace(/\D/g, '').slice(-10);
  if (!/^[6-9]\d{9}$/.test(cleanedMobile)) {
    throw new Error('Enter a valid 10-digit customer mobile number.');
  }
  if (!input.passengerName.trim()) {
    throw new Error('Please enter the lead passenger name.');
  }
  if (!input.pdfDataUrl) {
    throw new Error('Please select the confirmed ticket PDF file to upload.');
  }

  const id = generateId();
  const referenceId = generateReferenceId();
  const nowIso = new Date().toISOString();

  try {
    window.localStorage.setItem(`${STORAGE_KEYS.PDF_PREFIX}${id}`, input.pdfDataUrl);
  } catch {
    throw new Error(
      'Browser storage limit reached for this PDF. Try a smaller PDF (under 2 MB) or delete older records.'
    );
  }

  const record: BookingRequestRecord = {
    id,
    referenceId,
    createdAt: nowIso,
    updatedAt: nowIso,
    serviceType: 'train',
    trainNumber: input.trainNumber.trim() || 'CONFIRMED',
    trainName: input.trainName.trim() || 'Indian Railways Express',
    fromStation: input.fromStation.trim(),
    toStation: input.toStation.trim(),
    boardingStation: input.fromStation.trim(),
    journeyDate: input.journeyDate,
    travelClass: input.travelClass,
    quota: input.quota,
    advancePaymentChoice: 'pay-after-confirmation',
    advanceTokenAmount: 0,
    passengers: [
      {
        name: input.passengerName.trim(),
        age: 30,
        gender: 'Male',
        berthPreference: 'No Preference',
      },
    ],
    mobile: cleanedMobile,
    deliveryChannel: 'admin-direct',
    status: 'Ticket Issued',
    pnrNumber: input.pnrNumber?.trim() || undefined,
    agentRemark: input.agentRemark?.trim() || undefined,
    hasTicketPdf: true,
    pdfOriginalName: (input.pdfOriginalName || `SKYTRACK-${referenceId}.pdf`).slice(0, 120),
  };

  const existing = readAllRaw();
  if (!writeAllRaw([record, ...existing])) {
    window.localStorage.removeItem(`${STORAGE_KEYS.PDF_PREFIX}${id}`);
    throw new Error('Could not save direct ticket record in browser storage.');
  }
  return record;
}

export function deleteLocalBookingRequest(recId: string): void {
  const remaining = readAllRaw().filter((r) => r.id !== recId);
  writeAllRaw(remaining);
  try {
    window.localStorage.removeItem(`${STORAGE_KEYS.PROOF_PREFIX}${recId}`);
    window.localStorage.removeItem(`${STORAGE_KEYS.PDF_PREFIX}${recId}`);
  } catch {
    // ignore storage cleanup errors
  }
}

export function getLocalPaymentScreenshot(recId: string): string | null {
  try {
    return window.localStorage.getItem(`${STORAGE_KEYS.PROOF_PREFIX}${recId}`);
  } catch {
    return null;
  }
}

export function downloadLocalTicketPdf(record: BookingRequestRecord): void {
  const dataUrl = window.localStorage.getItem(`${STORAGE_KEYS.PDF_PREFIX}${record.id}`);
  if (!dataUrl) {
    throw new Error(
      'This ticket PDF is not saved in this browser yet. Please ask the SKY TRACK agent on WhatsApp (+91 8169607855) for your PDF copy.'
    );
  }

  const base64Part = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const binaryString = window.atob(base64Part);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: 'application/pdf' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = `SKYTRACK-${record.referenceId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
}

/**
 * Compresses an uploaded JPG/PNG screenshot to a compact data URL (~60-150 KB)
 * so it previews crisply and fits cleanly inside browser localStorage.
 */
export function compressImageFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file. Please try again.'));
    reader.onload = () => {
      const originalDataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!originalDataUrl.startsWith('data:image/')) {
        reject(new Error('Could not read the selected image file. Please try another JPG/PNG.'));
        return;
      }

      const img = new window.Image();
      img.onload = () => {
        try {
          const maxDim = 1080;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width >= height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(originalDataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.78);
          resolve(compressed.length < originalDataUrl.length ? compressed : originalDataUrl);
        } catch {
          resolve(originalDataUrl);
        }
      };
      img.onerror = () => resolve(originalDataUrl);
      img.src = originalDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        reject(new Error('Failed to read selected file.'));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error('Failed to read selected file.'));
    reader.readAsDataURL(file);
  });
}

// ============================================================
// Client-side Admin Password Storage (SHA-256 via Web Crypto)
// ============================================================
async function hashAdminPassword(password: string): Promise<string> {
  const salted = `skytrack-mumbai-v1::${password}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const bytes = new TextEncoder().encode(salted);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback deterministic hash for non-HTTPS contexts
  let hash = 2166136261;
  for (let i = 0; i < salted.length; i += 1) {
    hash ^= salted.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv-${(hash >>> 0).toString(16)}`;
}

export function isLocalAdminConfigured(): boolean {
  try {
    return Boolean(window.localStorage.getItem(STORAGE_KEYS.ADMIN_HASH));
  } catch {
    return false;
  }
}

export async function setupLocalAdminPassword(password: string): Promise<void> {
  const trimmed = password.trim();
  if (trimmed.length < 6) {
    throw new Error('Please choose a password of at least 6 characters.');
  }
  const hashed = await hashAdminPassword(trimmed);
  window.localStorage.setItem(STORAGE_KEYS.ADMIN_HASH, hashed);
}

export async function verifyLocalAdminPassword(password: string): Promise<boolean> {
  const stored = window.localStorage.getItem(STORAGE_KEYS.ADMIN_HASH);
  if (!stored) return false;
  const hashed = await hashAdminPassword(password.trim());
  return hashed === stored;
}

export function resetLocalAdminPassword(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.ADMIN_HASH);
  } catch {
    // ignore
  }
}
