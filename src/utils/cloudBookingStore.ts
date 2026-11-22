import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from 'firebase/storage';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
  storage,
} from '../firebase';
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
import {
  readFileAsDataUrl,
  trackLocalBookingRequests,
  createLocalBookingRequest,
  type CreateLocalBookingInput,
} from './localBookingStore';

export interface CloudAdminLockConfig {
  adminId: string;
  passwordSalt: string;
  passwordHash: string;
  updatedByUid: string;
}

interface LookupTicketEntry {
  id: string;
  referenceId: string;
  trainNumber: string;
  trainName: string;
  fromStation: string;
  toStation: string;
  journeyDate: string;
  travelClass: string;
  quota: string;
  passengerSummary: string;
  status: RequestStatus;
  pnrNumber: string;
  agentRemark: string;
  hasTicketPdf: boolean;
  pdfOriginalName: string;
  ticketPdfUrl: string;
  ticketPdfStorage: 'storage' | 'firestore' | 'none';
  updatedAtIso: string;
}

const MAX_FIRESTORE_PDF_CHARS = 920_000; // Safely below Firestore's 1 MB document limit (~690 KB raw PDF)
const MAX_FIRESTORE_PROOF_CHARS = 480_000;

function clip(value: string | undefined, maxLen: number): string {
  return (value || '').trim().slice(0, maxLen);
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}

function timestampToIso(val: unknown, fallbackIso?: string): string {
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as Timestamp).toDate === 'function') {
    return (val as Timestamp).toDate().toISOString();
  }
  if (typeof val === 'string' && val.length >= 10) return val;
  return fallbackIso || new Date().toISOString();
}

function docDataToBookingRecord(id: string, data: Record<string, unknown>): BookingRequestRecord {
  const createdAtIso = timestampToIso(data.createdAt, data.createdAtIso as string | undefined);
  const updatedAtIso = timestampToIso(data.updatedAt, data.updatedAtIso as string | undefined);

  return {
    id: (data.id as string) || id,
    referenceId: (data.referenceId as string) || '',
    createdAt: createdAtIso,
    updatedAt: updatedAtIso,
    serviceType: (data.serviceType as ServiceType) || 'train',
    trainNumber: (data.trainNumber as string) || 'CUSTOM',
    trainName: (data.trainName as string) || 'Indian Railways Express',
    fromStation: (data.fromStation as string) || '',
    toStation: (data.toStation as string) || '',
    boardingStation: (data.boardingStation as string) || '',
    journeyDate: (data.journeyDate as string) || '',
    returnDate: (data.returnDate as string) || undefined,
    travelClass: (data.travelClass as string) || '',
    quota: (data.quota as string) || 'GENERAL',
    extraPreferences: (data.extraPreferences as string) || undefined,
    allowAlternateTrain: Boolean(data.allowAlternateTrain),
    allowClassUpgrade: Boolean(data.allowClassUpgrade),
    isAdvanceOpeningPriority: Boolean(data.isAdvanceOpeningPriority),
    referredBy: (data.referredBy as string) || undefined,
    advancePaymentChoice:
      (data.advancePaymentChoice as AdvancePaymentChoice) || 'pay-after-confirmation',
    advanceTokenAmount: Number(data.advanceTokenAmount) || 0,
    paymentProofMethod: (data.paymentProofMethod as PaymentProofMethod) || undefined,
    hasPaymentScreenshot: Boolean(data.hasPaymentScreenshot),
    paymentScreenshotOriginalName: (data.paymentScreenshotOriginalName as string) || undefined,
    paymentScreenshotUrl: (data.paymentScreenshotUrl as string) || undefined,
    passengers: Array.isArray(data.passengers)
      ? (data.passengers as BookingRequestRecord['passengers'])
      : [],
    mobile: (data.mobile as string) || '',
    alternatePhone: (data.alternatePhone as string) || undefined,
    email: (data.email as string) || undefined,
    paymentReference: (data.paymentReference as string) || undefined,
    deliveryChannel:
      (data.deliveryChannel as BookingRequestRecord['deliveryChannel']) || 'whatsapp',
    status: (data.status as RequestStatus) || 'Pending Verification',
    pnrNumber: (data.pnrNumber as string) || undefined,
    agentRemark: (data.agentRemark as string) || undefined,
    hasTicketPdf: Boolean(data.hasTicketPdf),
    pdfOriginalName: (data.pdfOriginalName as string) || undefined,
    ticketPdfUrl: (data.ticketPdfUrl as string) || undefined,
    ticketPdfStorage:
      (data.ticketPdfStorage as BookingRequestRecord['ticketPdfStorage']) || 'none',
  };
}

function lookupEntryToRecord(mobile: string, entry: LookupTicketEntry): BookingRequestRecord {
  const passengerNames = (entry.passengerSummary || 'Passenger')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    id: entry.id,
    referenceId: entry.referenceId,
    createdAt: entry.updatedAtIso || new Date().toISOString(),
    updatedAt: entry.updatedAtIso || new Date().toISOString(),
    serviceType: 'train',
    trainNumber: entry.trainNumber,
    trainName: entry.trainName,
    fromStation: entry.fromStation,
    toStation: entry.toStation,
    boardingStation: entry.fromStation,
    journeyDate: entry.journeyDate,
    travelClass: entry.travelClass,
    quota: entry.quota,
    passengers: passengerNames.map((name) => ({
      name,
      age: 30,
      gender: 'Male' as GenderType,
      berthPreference: 'No Preference' as BerthPreference,
    })),
    mobile,
    deliveryChannel: 'whatsapp',
    status: entry.status,
    pnrNumber: entry.pnrNumber || undefined,
    agentRemark: entry.agentRemark || undefined,
    hasTicketPdf: Boolean(entry.hasTicketPdf),
    pdfOriginalName: entry.pdfOriginalName || undefined,
    ticketPdfUrl: entry.ticketPdfUrl || undefined,
    ticketPdfStorage: entry.ticketPdfStorage || 'none',
  };
}

function buildLookupEntry(rec: BookingRequestRecord): LookupTicketEntry {
  const passengerSummary = rec.passengers
    .map((p) => p.name)
    .join(', ')
    .slice(0, 300);

  return {
    id: clip(rec.id, 128),
    referenceId: clip(rec.referenceId, 32),
    trainNumber: clip(rec.trainNumber || 'CONFIRMED', 32),
    trainName: clip(rec.trainName || 'Indian Railways Express', 120),
    fromStation: clip(rec.fromStation, 120),
    toStation: clip(rec.toStation, 120),
    journeyDate: clip(rec.journeyDate, 20),
    travelClass: clip(rec.travelClass, 64),
    quota: clip(rec.quota || 'GENERAL', 32),
    passengerSummary: passengerSummary || 'Passenger',
    status: rec.status,
    pnrNumber: clip(rec.pnrNumber, 20),
    agentRemark: clip(rec.agentRemark, 300),
    hasTicketPdf: Boolean(rec.hasTicketPdf),
    pdfOriginalName: clip(rec.pdfOriginalName, 120),
    ticketPdfUrl: clip(rec.ticketPdfUrl, 1000),
    ticketPdfStorage: rec.ticketPdfStorage || 'none',
    updatedAtIso: rec.updatedAt || new Date().toISOString(),
  };
}

// ============================================================
// 1. Customer Booking Submission (Firestore + Local Cache)
// ============================================================
export async function submitBookingRequestToCloud(
  input: CreateLocalBookingInput
): Promise<BookingRequestRecord> {
  // First validate & save locally so same-device UX is instant and validated
  const { record } = createLocalBookingRequest(input);

  const hasScreenshot =
    input.advancePaymentChoice === 'advance-token' &&
    typeof input.paymentScreenshotDataUrl === 'string' &&
    input.paymentScreenshotDataUrl.startsWith('data:image/');

  let paymentScreenshotUrl: string | undefined;

  if (hasScreenshot && input.paymentScreenshotDataUrl) {
    // 1. Try Firebase Storage first
    try {
      const res = await fetch(input.paymentScreenshotDataUrl);
      const blob = await res.blob();
      const safeExt = blob.type === 'image/png' ? 'png' : 'jpg';
      const proofRef = storageRef(storage, `payment-proofs/${record.id}/proof.${safeExt}`);
      await uploadBytes(proofRef, blob, {
        contentType: blob.type === 'image/png' ? 'image/png' : 'image/jpeg',
      });
      paymentScreenshotUrl = await getDownloadURL(proofRef);
    } catch {
      // 2. Seamless Firestore fallback for compressed payment screenshot
      if (input.paymentScreenshotDataUrl.length <= MAX_FIRESTORE_PROOF_CHARS) {
        try {
          await setDoc(doc(db, 'paymentProofs', record.id), {
            bookingId: record.id,
            referenceId: record.referenceId,
            originalName: clip(record.paymentScreenshotOriginalName || 'payment-proof.jpg', 120),
            imageDataUrl: input.paymentScreenshotDataUrl,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          console.warn('Could not upload payment screenshot to Firestore fallback:', err);
        }
      }
    }
  }

  const firestoreDoc = stripUndefined({
    id: clip(record.id, 128),
    referenceId: clip(record.referenceId, 32),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdAtIso: clip(record.createdAt, 40),
    updatedAtIso: clip(record.updatedAt, 40),
    serviceType: record.serviceType || 'train',
    trainNumber: clip(record.trainNumber, 32),
    trainName: clip(record.trainName, 120),
    fromStation: clip(record.fromStation, 120),
    toStation: clip(record.toStation, 120),
    boardingStation: clip(record.boardingStation, 120),
    journeyDate: clip(record.journeyDate, 20),
    returnDate: record.returnDate ? clip(record.returnDate, 20) : undefined,
    travelClass: clip(record.travelClass, 64),
    quota: clip(record.quota, 32),
    extraPreferences: record.extraPreferences ? clip(record.extraPreferences, 200) : undefined,
    allowAlternateTrain: Boolean(record.allowAlternateTrain),
    allowClassUpgrade: Boolean(record.allowClassUpgrade),
    isAdvanceOpeningPriority: Boolean(record.isAdvanceOpeningPriority),
    referredBy: record.referredBy ? clip(record.referredBy, 100) : undefined,
    advancePaymentChoice: record.advancePaymentChoice || 'pay-after-confirmation',
    advanceTokenAmount: Number(record.advanceTokenAmount) || 0,
    paymentProofMethod: record.paymentProofMethod,
    hasPaymentScreenshot: Boolean(record.hasPaymentScreenshot),
    paymentScreenshotOriginalName: record.paymentScreenshotOriginalName
      ? clip(record.paymentScreenshotOriginalName, 120)
      : undefined,
    paymentScreenshotUrl: paymentScreenshotUrl ? clip(paymentScreenshotUrl, 1000) : undefined,
    passengers: record.passengers.slice(0, 6).map((p) =>
      stripUndefined({
        name: clip(p.name, 80),
        age: Math.max(1, Math.min(120, Math.round(Number(p.age)))),
        gender: p.gender,
        berthPreference: p.berthPreference,
        idProofType: p.idProofType || undefined,
      })
    ),
    mobile: clip(record.mobile, 10),
    alternatePhone: record.alternatePhone ? clip(record.alternatePhone, 10) : undefined,
    email: record.email ? clip(record.email, 120) : undefined,
    paymentReference: record.paymentReference ? clip(record.paymentReference, 20) : undefined,
    deliveryChannel: record.deliveryChannel,
    status: 'Pending Verification',
    hasTicketPdf: false,
    ticketPdfStorage: 'none',
  });

  const path = `bookings/${record.id}`;
  try {
    await setDoc(doc(db, 'bookings', record.id), firestoreDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  return {
    ...record,
    paymentScreenshotUrl,
  };
}

// ============================================================
// 2. Admin Real-Time Bookings Listener (Admin-Auth Only)
// ============================================================
export function subscribeToCloudBookings(
  onUpdate: (records: BookingRequestRecord[]) => void,
  onError: (message: string) => void
): Unsubscribe {
  const path = 'bookings';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const records = snap.docs.map((d) =>
        docDataToBookingRecord(d.id, d.data() as Record<string, unknown>)
      );
      onUpdate(records);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(
          wrapped instanceof Error ? wrapped.message : 'Unable to sync bookings from Firestore.'
        );
      }
    }
  );
}

// ============================================================
// 3. Helper: Upload Confirmed Ticket PDF (Firebase Storage + Firestore Fallback)
// ============================================================
async function uploadTicketPdfToCloud(
  bookingId: string,
  referenceId: string,
  mobile: string,
  pdfFile: File
): Promise<{
  ticketPdfUrl: string;
  ticketPdfStorage: 'storage' | 'firestore';
  pdfOriginalName: string;
}> {
  if (pdfFile.type !== 'application/pdf' && !pdfFile.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Only PDF files (.pdf) can be uploaded as confirmed tickets.');
  }
  if (pdfFile.size > 5 * 1024 * 1024) {
    throw new Error('Confirmed ticket PDF must be under 5 MB.');
  }

  const safeName = clip(pdfFile.name || `SKYTRACK-${referenceId}.pdf`, 120);

  // Attempt 1: Firebase Storage (supports up to 5 MB)
  try {
    const fileRef = storageRef(storage, `tickets/${mobile}/SKYTRACK-${referenceId}.pdf`);
    await uploadBytes(fileRef, pdfFile, {
      contentType: 'application/pdf',
      contentDisposition: `attachment; filename="SKYTRACK-${referenceId}.pdf"`,
    });
    const downloadUrl = await getDownloadURL(fileRef);
    return {
      ticketPdfUrl: clip(downloadUrl, 1000),
      ticketPdfStorage: 'storage',
      pdfOriginalName: safeName,
    };
  } catch (storageErr) {
    console.warn(
      'Firebase Storage upload unavailable, falling back to Firestore PDF document:',
      storageErr
    );
  }

  // Attempt 2: Seamless Firestore PDF document fallback (works on 100% free Spark plan for IRCTC PDFs <= 690 KB)
  const pdfDataUrl = await readFileAsDataUrl(pdfFile);
  if (pdfDataUrl.length > MAX_FIRESTORE_PDF_CHARS) {
    throw new Error(
      'This PDF is larger than 680 KB and Firebase Storage is not enabled on this project yet. Either compress the PDF under 680 KB, or enable Firebase Storage in your Firebase Console.'
    );
  }

  const pdfPath = `ticketPdfs/${bookingId}`;
  try {
    await setDoc(doc(db, 'ticketPdfs', bookingId), {
      bookingId: clip(bookingId, 128),
      referenceId: clip(referenceId, 32),
      mobile: clip(mobile, 10),
      pdfOriginalName: safeName,
      pdfDataUrl,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, pdfPath);
  }

  return {
    ticketPdfUrl: '',
    ticketPdfStorage: 'firestore',
    pdfOriginalName: safeName,
  };
}

// ============================================================
// 4. Sync Customer Lookup Docs (/ticketLookups/{mobile} & /ticketByRef/{ref})
// ============================================================
async function syncCustomerTicketLookups(record: BookingRequestRecord): Promise<void> {
  const entry = buildLookupEntry(record);

  // Update per-mobile lookup doc (/ticketLookups/{mobile})
  const mobilePath = `ticketLookups/${record.mobile}`;
  try {
    const mobileRef = doc(db, 'ticketLookups', record.mobile);
    const existingSnap = await getDoc(mobileRef);
    let tickets: LookupTicketEntry[] = [];
    if (existingSnap.exists()) {
      const raw = existingSnap.data().tickets;
      if (Array.isArray(raw)) {
        tickets = (raw as LookupTicketEntry[]).filter((t) => t.id !== record.id);
      }
    }
    const nextTickets = [entry, ...tickets].slice(0, 25);
    await setDoc(mobileRef, {
      mobile: record.mobile,
      tickets: nextTickets,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, mobilePath);
  }

  // Update per-reference lookup doc (/ticketByRef/{referenceId})
  const refPath = `ticketByRef/${record.referenceId}`;
  try {
    await setDoc(
      doc(db, 'ticketByRef', record.referenceId),
      stripUndefined({
        referenceId: entry.referenceId,
        id: entry.id,
        mobile: record.mobile,
        trainNumber: entry.trainNumber,
        trainName: entry.trainName,
        fromStation: entry.fromStation,
        toStation: entry.toStation,
        journeyDate: entry.journeyDate,
        travelClass: entry.travelClass,
        quota: entry.quota,
        passengerSummary: entry.passengerSummary,
        status: entry.status,
        pnrNumber: entry.pnrNumber || undefined,
        agentRemark: entry.agentRemark || undefined,
        hasTicketPdf: entry.hasTicketPdf,
        pdfOriginalName: entry.pdfOriginalName || undefined,
        ticketPdfUrl: entry.ticketPdfUrl || undefined,
        ticketPdfStorage: entry.ticketPdfStorage,
        updatedAt: serverTimestamp(),
      })
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, refPath);
  }
}

// ============================================================
// 5. Admin Update Status / PNR / Upload Ticket PDF
// ============================================================
export async function updateCloudBookingRecord(
  current: BookingRequestRecord,
  updates: {
    status: RequestStatus;
    pnrNumber: string;
    agentRemark: string;
  },
  pdfFile?: File
): Promise<BookingRequestRecord> {
  let hasTicketPdf = current.hasTicketPdf;
  let pdfOriginalName = current.pdfOriginalName;
  let ticketPdfUrl = current.ticketPdfUrl;
  let ticketPdfStorage = current.ticketPdfStorage || 'none';
  let nextStatus = updates.status;

  if (pdfFile) {
    const uploaded = await uploadTicketPdfToCloud(
      current.id,
      current.referenceId,
      current.mobile,
      pdfFile
    );
    hasTicketPdf = true;
    pdfOriginalName = uploaded.pdfOriginalName;
    ticketPdfUrl = uploaded.ticketPdfUrl || undefined;
    ticketPdfStorage = uploaded.ticketPdfStorage;
    if (nextStatus === 'Pending Verification') {
      nextStatus = 'Ticket Issued';
    }
  }

  const nowIso = new Date().toISOString();
  const bookingPath = `bookings/${current.id}`;
  try {
    await updateDoc(
      doc(db, 'bookings', current.id),
      stripUndefined({
        status: nextStatus,
        pnrNumber: clip(updates.pnrNumber, 20),
        agentRemark: clip(updates.agentRemark, 300),
        hasTicketPdf,
        pdfOriginalName: pdfOriginalName ? clip(pdfOriginalName, 120) : '',
        ticketPdfUrl: ticketPdfUrl ? clip(ticketPdfUrl, 1000) : '',
        ticketPdfStorage,
        updatedAt: serverTimestamp(),
        updatedAtIso: nowIso,
      })
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, bookingPath);
  }

  const updatedRecord: BookingRequestRecord = {
    ...current,
    status: nextStatus,
    pnrNumber: clip(updates.pnrNumber, 20) || undefined,
    agentRemark: clip(updates.agentRemark, 300) || undefined,
    hasTicketPdf,
    pdfOriginalName,
    ticketPdfUrl,
    ticketPdfStorage,
    updatedAt: nowIso,
  };

  await syncCustomerTicketLookups(updatedRecord);
  return updatedRecord;
}

// ============================================================
// 6. Admin Direct Ticket Upload (Walk-in / WhatsApp customers)
// ============================================================
export async function createDirectCloudTicket(
  input: {
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
  },
  pdfFile: File
): Promise<BookingRequestRecord> {
  const cleanedMobile = input.mobile.replace(/\D/g, '').slice(-10);
  if (!/^[6-9]\d{9}$/.test(cleanedMobile)) {
    throw new Error('Enter a valid 10-digit customer mobile number.');
  }
  if (!input.passengerName.trim()) {
    throw new Error('Please enter the lead passenger name.');
  }

  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `st-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  const referenceId = `ST-${yyyy}${mm}${dd}-${suffix}`;
  const nowIso = now.toISOString();

  // Upload PDF first (Firebase Storage or Firestore fallback)
  const uploaded = await uploadTicketPdfToCloud(id, referenceId, cleanedMobile, pdfFile);

  const tokenMeta = getPerPassengerAdvanceToken('train', input.travelClass);
  void tokenMeta;

  const firestoreDoc = stripUndefined({
    id,
    referenceId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
    serviceType: 'train',
    trainNumber: clip(input.trainNumber || 'CONFIRMED', 32),
    trainName: clip(input.trainName || 'Indian Railways Express', 120),
    fromStation: clip(input.fromStation, 120),
    toStation: clip(input.toStation, 120),
    boardingStation: clip(input.fromStation, 120),
    journeyDate: clip(input.journeyDate, 20),
    travelClass: clip(input.travelClass, 64),
    quota: clip(input.quota || 'GENERAL', 32),
    advancePaymentChoice: 'pay-after-confirmation',
    advanceTokenAmount: 0,
    passengers: [
      {
        name: clip(input.passengerName, 80),
        age: 30,
        gender: 'Male',
        berthPreference: 'No Preference',
      },
    ],
    mobile: cleanedMobile,
    deliveryChannel: 'admin-direct',
    status: 'Ticket Issued',
    pnrNumber: input.pnrNumber ? clip(input.pnrNumber, 20) : undefined,
    agentRemark: input.agentRemark ? clip(input.agentRemark, 300) : undefined,
    hasTicketPdf: true,
    pdfOriginalName: uploaded.pdfOriginalName,
    ticketPdfUrl: uploaded.ticketPdfUrl || undefined,
    ticketPdfStorage: uploaded.ticketPdfStorage,
  });

  const bookingPath = `bookings/${id}`;
  try {
    await setDoc(doc(db, 'bookings', id), firestoreDoc);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, bookingPath);
  }

  const record: BookingRequestRecord = {
    id,
    referenceId,
    createdAt: nowIso,
    updatedAt: nowIso,
    serviceType: 'train',
    trainNumber: clip(input.trainNumber || 'CONFIRMED', 32),
    trainName: clip(input.trainName || 'Indian Railways Express', 120),
    fromStation: clip(input.fromStation, 120),
    toStation: clip(input.toStation, 120),
    boardingStation: clip(input.fromStation, 120),
    journeyDate: clip(input.journeyDate, 20),
    travelClass: clip(input.travelClass, 64),
    quota: clip(input.quota || 'GENERAL', 32),
    advancePaymentChoice: 'pay-after-confirmation',
    advanceTokenAmount: 0,
    passengers: [
      {
        name: clip(input.passengerName, 80),
        age: 30,
        gender: 'Male',
        berthPreference: 'No Preference',
      },
    ],
    mobile: cleanedMobile,
    deliveryChannel: 'admin-direct',
    status: 'Ticket Issued',
    pnrNumber: input.pnrNumber ? clip(input.pnrNumber, 20) : undefined,
    agentRemark: input.agentRemark ? clip(input.agentRemark, 300) : undefined,
    hasTicketPdf: true,
    pdfOriginalName: uploaded.pdfOriginalName,
    ticketPdfUrl: uploaded.ticketPdfUrl || undefined,
    ticketPdfStorage: uploaded.ticketPdfStorage,
  };

  await syncCustomerTicketLookups(record);
  return record;
}

// ============================================================
// 7. Admin Delete Booking & Cleanup Cloud Artifacts
// ============================================================
export async function deleteCloudBookingRecord(record: BookingRequestRecord): Promise<void> {
  const bookingPath = `bookings/${record.id}`;
  try {
    await deleteDoc(doc(db, 'bookings', record.id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, bookingPath);
  }

  // Remove from ticketLookups/{mobile}
  try {
    const mobileRef = doc(db, 'ticketLookups', record.mobile);
    const snap = await getDoc(mobileRef);
    if (snap.exists()) {
      const existingTickets = Array.isArray(snap.data().tickets)
        ? (snap.data().tickets as LookupTicketEntry[])
        : [];
      const remaining = existingTickets.filter((t) => t.id !== record.id);
      if (remaining.length === 0) {
        await deleteDoc(mobileRef);
      } else {
        await setDoc(mobileRef, {
          mobile: record.mobile,
          tickets: remaining,
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (err) {
    console.warn('Could not clean up ticketLookups entry:', err);
  }

  // Best-effort cleanup of ticketByRef, ticketPdfs, paymentProofs, and Storage object
  await Promise.allSettled([
    deleteDoc(doc(db, 'ticketByRef', record.referenceId)),
    deleteDoc(doc(db, 'ticketPdfs', record.id)),
    deleteDoc(doc(db, 'paymentProofs', record.id)),
    record.ticketPdfStorage === 'storage'
      ? deleteObject(
          storageRef(storage, `tickets/${record.mobile}/SKYTRACK-${record.referenceId}.pdf`)
        )
      : Promise.resolve(),
  ]);
}

// ============================================================
// 8. Customer Cross-Device Track & Download Ticket PDF
// ============================================================
export async function trackCloudTicketRequests(rawQuery: string): Promise<BookingRequestRecord[]> {
  const cleaned = rawQuery.trim();
  if (!cleaned) {
    throw new Error('Please enter your 10-digit mobile number or Booking Reference ID.');
  }

  const upper = cleaned.toUpperCase();
  const cloudRecords: BookingRequestRecord[] = [];

  if (upper.startsWith('ST-')) {
    const path = `ticketByRef/${upper}`;
    try {
      const snap = await getDoc(doc(db, 'ticketByRef', upper));
      if (snap.exists()) {
        const d = snap.data() as Record<string, unknown>;
        cloudRecords.push(
          lookupEntryToRecord((d.mobile as string) || '', {
            id: (d.id as string) || upper,
            referenceId: (d.referenceId as string) || upper,
            trainNumber: (d.trainNumber as string) || 'CONFIRMED',
            trainName: (d.trainName as string) || 'Indian Railways Express',
            fromStation: (d.fromStation as string) || '',
            toStation: (d.toStation as string) || '',
            journeyDate: (d.journeyDate as string) || '',
            travelClass: (d.travelClass as string) || '',
            quota: (d.quota as string) || 'GENERAL',
            passengerSummary: (d.passengerSummary as string) || '',
            status: (d.status as RequestStatus) || 'Pending Verification',
            pnrNumber: (d.pnrNumber as string) || '',
            agentRemark: (d.agentRemark as string) || '',
            hasTicketPdf: Boolean(d.hasTicketPdf),
            pdfOriginalName: (d.pdfOriginalName as string) || '',
            ticketPdfUrl: (d.ticketPdfUrl as string) || '',
            ticketPdfStorage:
              (d.ticketPdfStorage as 'storage' | 'firestore' | 'none') || 'none',
            updatedAtIso: timestampToIso(d.updatedAt),
          })
        );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  } else {
    const digits = cleaned.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(digits)) {
      throw new Error('Please enter a valid 10-digit mobile number or Reference ID (e.g., ST-...).');
    }
    const path = `ticketLookups/${digits}`;
    try {
      const snap = await getDoc(doc(db, 'ticketLookups', digits));
      if (snap.exists()) {
        const rawTickets = snap.data().tickets;
        if (Array.isArray(rawTickets)) {
          for (const entry of rawTickets as LookupTicketEntry[]) {
            cloudRecords.push(lookupEntryToRecord(digits, entry));
          }
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  }

  // Merge any same-device locally submitted pending requests not yet published by Admin
  let localFallback: BookingRequestRecord[] = [];
  try {
    localFallback = trackLocalBookingRequests(cleaned);
  } catch {
    localFallback = [];
  }

  const seenRefs = new Set(cloudRecords.map((r) => r.referenceId));
  for (const loc of localFallback) {
    if (!seenRefs.has(loc.referenceId)) {
      cloudRecords.push(loc);
    }
  }

  return cloudRecords;
}

export async function downloadCloudTicketPdf(record: BookingRequestRecord): Promise<void> {
  // 1. Direct Firebase Storage URL
  if (record.ticketPdfUrl && record.ticketPdfUrl.startsWith('https://')) {
    const link = document.createElement('a');
    link.href = record.ticketPdfUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = `SKYTRACK-${record.referenceId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // 2. Firestore PDF blob document fallback
  const path = `ticketPdfs/${record.id}`;
  let dataUrl = '';
  try {
    const snap = await getDoc(doc(db, 'ticketPdfs', record.id));
    if (snap.exists()) {
      dataUrl = (snap.data().pdfDataUrl as string) || '';
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }

  if (!dataUrl) {
    throw new Error(
      'Confirmed ticket PDF is not uploaded yet. Please check back shortly or message SKY TRACK on WhatsApp (+91 8169607855).'
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

export async function fetchCloudPaymentScreenshot(record: BookingRequestRecord): Promise<string> {
  if (record.paymentScreenshotUrl && record.paymentScreenshotUrl.startsWith('https://')) {
    return record.paymentScreenshotUrl;
  }
  const path = `paymentProofs/${record.id}`;
  try {
    const snap = await getDoc(doc(db, 'paymentProofs', record.id));
    if (snap.exists()) {
      const dataUrl = (snap.data().imageDataUrl as string) || '';
      if (dataUrl.startsWith('data:image/')) {
        return dataUrl;
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
  throw new Error('Payment screenshot not found in cloud storage for this booking.');
}

// ============================================================
// 9. Cloud Admin Console Credentials Lock (Salted SHA-256 in Firestore)
// ============================================================
function generateRandomSaltHex(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function computeSaltedCredentialHash(
  adminId: string,
  password: string,
  salt: string
): Promise<string> {
  const normalized = `${salt}::${adminId.trim().toLowerCase()}::${password}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(normalized);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv-${(hash >>> 0).toString(16).padStart(16, '0')}`;
}

export async function fetchCloudAdminLockConfig(): Promise<CloudAdminLockConfig | null> {
  const path = 'adminConfig/consoleLock';
  try {
    const snap = await getDoc(doc(db, 'adminConfig', 'consoleLock'));
    if (!snap.exists()) return null;
    const d = snap.data() as Record<string, unknown>;
    return {
      adminId: (d.adminId as string) || 'skytrack',
      passwordSalt: (d.passwordSalt as string) || '',
      passwordHash: (d.passwordHash as string) || '',
      updatedByUid: (d.updatedByUid as string) || '',
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function saveCloudAdminLockConfig(
  adminId: string,
  newPassword: string
): Promise<CloudAdminLockConfig> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Please sign in with your authorized SKY TRACK Google account first.');
  }

  const cleanId = adminId.trim();
  if (!/^[a-zA-Z0-9_.\-]{3,64}$/.test(cleanId)) {
    throw new Error('Admin ID must be 3–64 characters (letters, numbers, dot, dash, underscore).');
  }
  if (newPassword.length < 6) {
    throw new Error('Admin password must be at least 6 characters long.');
  }

  const salt = generateRandomSaltHex();
  const hash = await computeSaltedCredentialHash(cleanId, newPassword, salt);

  const path = 'adminConfig/consoleLock';
  try {
    await setDoc(doc(db, 'adminConfig', 'consoleLock'), {
      adminId: cleanId,
      passwordSalt: salt,
      passwordHash: hash,
      updatedByUid: user.uid,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }

  return {
    adminId: cleanId,
    passwordSalt: salt,
    passwordHash: hash,
    updatedByUid: user.uid,
  };
}

export async function verifyCloudAdminLockCredentials(
  config: CloudAdminLockConfig,
  inputAdminId: string,
  inputPassword: string
): Promise<boolean> {
  if (inputAdminId.trim().toLowerCase() !== config.adminId.trim().toLowerCase()) {
    return false;
  }
  const candidateHash = await computeSaltedCredentialHash(
    config.adminId,
    inputPassword,
    config.passwordSalt
  );
  return candidateHash === config.passwordHash;
}
