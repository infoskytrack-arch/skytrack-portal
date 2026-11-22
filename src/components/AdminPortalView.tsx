import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  ArrowLeft,
  CheckCircle2,
  Cloud,
  Download,
  FileUp,
  Image,
  KeyRound,
  Lock,
  LogOut,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import {
  AUTHORIZED_ADMIN_EMAILS,
  auth,
  googleProvider,
  isAuthorizedAdminUser,
} from '../firebase';
import {
  QUOTA_OPTIONS,
  TRAVEL_CLASSES,
  type BookingRequestRecord,
  type QuotaType,
  type RequestStatus,
  type SelectableClassCode,
} from '../types';
import {
  describePaymentProof,
  formatReadableDate,
  getTomorrowIsoDate,
} from '../utils/bookingFormat';
import {
  createDirectCloudTicket,
  deleteCloudBookingRecord,
  downloadCloudTicketPdf,
  fetchCloudPaymentScreenshot,
  subscribeToCloudBookings,
  updateCloudBookingRecord,
} from '../utils/cloudBookingStore';

const STATUS_OPTIONS: RequestStatus[] = [
  'Pending Verification',
  'Fare Confirmed',
  'Ticket Issued',
  'Cancelled',
];

const ADMIN_PIN_SALT = 'skytrack-admin-pin-v1::';
const ADMIN_PIN_SHA256 =
  '92d4626c6ba10b15ad7451cb37a71b38a29282168d281376ad8e10370e67483a';
const ADMIN_PIN_FALLBACK = 'fnv-025cb49d';

async function verifyAdminPin(pin: string): Promise<boolean> {
  const salted = `${ADMIN_PIN_SALT}${pin}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(salted);
    const buffer = await crypto.subtle.digest('SHA-256', encoded);
    const hex = Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return hex === ADMIN_PIN_SHA256;
  }
  let hash = 0x811c9dc5;
  for (let i = 0; i < salted.length; i += 1) {
    hash ^= salted.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv-${(hash >>> 0).toString(16).padStart(8, '0')}` === ADMIN_PIN_FALLBACK;
}

function extractReadableError(err: unknown, fallback: string): string {
  if (!(err instanceof Error)) return fallback;
  try {
    const parsed = JSON.parse(err.message) as { error?: string };
    if (parsed?.error) return parsed.error;
  } catch {
    // not JSON
  }
  return err.message || fallback;
}

export function AdminPortalView() {
  // Step 1: 4-Digit Security PIN Gate (always required first on opening Admin)
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [verifyingPin, setVerifyingPin] = useState(false);

  // Step 2: Authorized Google Account Verification (enforced by Firestore Security Rules)
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isGoogleVerified, setIsGoogleVerified] = useState(false);
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Cloud Bookings Data (only subscribed when both Step 1 PIN + Step 2 Google Auth pass)
  const [requests, setRequests] = useState<BookingRequestRecord[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const [proofPreview, setProofPreview] = useState<{
    requestId: string;
    referenceId: string;
    imageUrl: string;
  } | null>(null);

  // Inline edits per request row
  const [draftEdits, setDraftEdits] = useState<
    Record<
      string,
      {
        status: RequestStatus;
        pnrNumber: string;
        agentRemark: string;
      }
    >
  >({});
  const [savingRowId, setSavingRowId] = useState<string | null>(null);

  // Direct ticket upload form (for walk-in / WhatsApp customers)
  const [showDirectForm, setShowDirectForm] = useState(false);
  const [directMobile, setDirectMobile] = useState('');
  const [directPassenger, setDirectPassenger] = useState('');
  const [directFrom, setDirectFrom] = useState('HOWRAH JN - HWH');
  const [directTo, setDirectTo] = useState('MUMBAI CSMT - CSMT');
  const [directDate, setDirectDate] = useState(getTomorrowIsoDate());
  const [directTrainNumber, setDirectTrainNumber] = useState('');
  const [directTrainName, setDirectTrainName] = useState('');
  const [directClass, setDirectClass] = useState<SelectableClassCode>('3A');
  const [directQuota, setDirectQuota] = useState<QuotaType>('GENERAL');
  const [directPnr, setDirectPnr] = useState('');
  const [directRemark, setDirectRemark] = useState('');
  const [directFile, setDirectFile] = useState<File | null>(null);
  const [submittingDirect, setSubmittingDirect] = useState(false);

  const isAuthorizedAdmin = isAuthorizedAdminUser(firebaseUser);
  const isAdminDashboardUnlocked = isPinVerified && isGoogleVerified && isAuthorizedAdmin;

  // Monitor Firebase Auth state (never auto-unlocks dashboard without completing Step 1 & Step 2)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user || !isAuthorizedAdminUser(user)) {
        setIsGoogleVerified(false);
        setRequests([]);
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to real-time Firestore bookings ONLY when Step 1 PIN + Step 2 Google Admin are verified
  useEffect(() => {
    if (!isAdminDashboardUnlocked) {
      setRequests([]);
      return;
    }

    setLoadingList(true);
    setActionError('');

    const unsubscribe = subscribeToCloudBookings(
      (items) => {
        setRequests(items);
        setDraftEdits((prev) => {
          const next = { ...prev };
          for (const rec of items) {
            if (!next[rec.id]) {
              next[rec.id] = {
                status: rec.status,
                pnrNumber: rec.pnrNumber || '',
                agentRemark: rec.agentRemark || '',
              };
            }
          }
          return next;
        });
        setLoadingList(false);
      },
      (errMsg) => {
        setActionError(errMsg);
        setLoadingList(false);
      }
    );

    return () => unsubscribe();
  }, [isAdminDashboardUnlocked]);

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPinError('');
    setAuthError('');

    const cleanedPin = pinInput.replace(/\D/g, '');
    if (cleanedPin.length !== 4) {
      setPinError('Please enter the 4-digit Admin Security PIN.');
      return;
    }

    setVerifyingPin(true);
    try {
      const valid = await verifyAdminPin(cleanedPin);
      if (!valid) {
        setPinError('Incorrect 4-digit PIN. Access denied.');
        setPinInput('');
        return;
      }
      setPinInput('');
      setPinError('');
      setIsPinVerified(true);
    } finally {
      setVerifyingPin(false);
    }
  }

  function handleBackToPinLock() {
    setIsPinVerified(false);
    setIsGoogleVerified(false);
    setPinInput('');
    setPinError('');
    setAuthError('');
  }

  async function handleGoogleAdminSignIn() {
    if (!isPinVerified) return;
    setAuthError('');
    setGoogleAuthLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (!isAuthorizedAdminUser(result.user)) {
        await signOut(auth);
        setIsGoogleVerified(false);
        setAuthError(
          `Access Denied: "${result.user.email || 'This account'}" is not authorized for SKY TRACK Admin. Please sign in with an authorized agency Google account (${AUTHORIZED_ADMIN_EMAILS.join(' or ')}).`
        );
        return;
      }
      setFirebaseUser(result.user);
      setIsGoogleVerified(true);
    } catch (err) {
      setAuthError(
        extractReadableError(
          err,
          'Google Sign-In was cancelled or blocked. Please allow the sign-in popup and try again.'
        )
      );
    } finally {
      setGoogleAuthLoading(false);
    }
  }

  async function handleFullSignOut() {
    setIsPinVerified(false);
    setIsGoogleVerified(false);
    setPinInput('');
    setPinError('');
    setAuthError('');
    setRequests([]);
    setProofPreview(null);
    setShowDirectForm(false);
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
  }

  async function handleRowSave(rec: BookingRequestRecord, pdfFile?: File) {
    if (!isAdminDashboardUnlocked) return;
    setSavingRowId(rec.id);
    setActionError('');
    setFeedbackMsg('');
    try {
      const draft = draftEdits[rec.id] || {
        status: rec.status,
        pnrNumber: rec.pnrNumber || '',
        agentRemark: rec.agentRemark || '',
      };

      const updated = await updateCloudBookingRecord(
        rec,
        {
          status: draft.status,
          pnrNumber: draft.pnrNumber,
          agentRemark: draft.agentRemark,
        },
        pdfFile
      );

      setDraftEdits((prev) => ({
        ...prev,
        [rec.id]: {
          status: updated.status,
          pnrNumber: updated.pnrNumber || '',
          agentRemark: updated.agentRemark || '',
        },
      }));

      setFeedbackMsg(
        pdfFile
          ? `Confirmed ticket PDF published to cloud for ${updated.referenceId}! Customer can now enter mobile ${updated.mobile} from ANY phone and download it immediately.`
          : `Updated booking ${updated.referenceId} and synced to customer tracking.`
      );
    } catch (err) {
      setActionError(extractReadableError(err, 'Failed to update booking record.'));
    } finally {
      setSavingRowId(null);
    }
  }

  async function handleDirectTicketSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdminDashboardUnlocked) return;
    setActionError('');
    setFeedbackMsg('');

    const cleanedMobile = directMobile.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanedMobile)) {
      setActionError('Enter a valid 10-digit customer mobile number.');
      return;
    }
    if (!directFile) {
      setActionError('Please select the confirmed ticket PDF file to upload.');
      return;
    }

    setSubmittingDirect(true);
    try {
      const created = await createDirectCloudTicket(
        {
          mobile: cleanedMobile,
          passengerName: directPassenger.trim(),
          fromStation: directFrom.trim(),
          toStation: directTo.trim(),
          journeyDate: directDate,
          trainNumber: directTrainNumber.trim() || 'CONFIRMED',
          trainName: directTrainName.trim() || 'Indian Railways Express',
          travelClass: directClass,
          quota: directQuota,
          pnrNumber: directPnr.trim(),
          agentRemark: directRemark.trim(),
        },
        directFile
      );

      setShowDirectForm(false);
      setDirectMobile('');
      setDirectPassenger('');
      setDirectTrainNumber('');
      setDirectTrainName('');
      setDirectPnr('');
      setDirectRemark('');
      setDirectFile(null);
      setFeedbackMsg(
        `Ticket PDF published to cloud! Customer can now open "Track & Download PDF" on ANY phone, enter mobile ${created.mobile} (or Ref ${created.referenceId}), and download their ticket immediately.`
      );
    } catch (err) {
      setActionError(extractReadableError(err, 'Could not upload confirmed ticket PDF.'));
    } finally {
      setSubmittingDirect(false);
    }
  }

  async function handleDelete(rec: BookingRequestRecord) {
    if (!isAdminDashboardUnlocked) return;
    setActionError('');
    setFeedbackMsg('');
    try {
      await deleteCloudBookingRecord(rec);
      if (proofPreview?.requestId === rec.id) {
        setProofPreview(null);
      }
      setFeedbackMsg(`Removed booking record ${rec.referenceId} from cloud.`);
    } catch (err) {
      setActionError(extractReadableError(err, 'Could not delete booking record.'));
    }
  }

  async function handleAdminDownloadPdf(rec: BookingRequestRecord) {
    setActionError('');
    try {
      await downloadCloudTicketPdf(rec);
    } catch (err) {
      setActionError(extractReadableError(err, 'Download failed.'));
    }
  }

  async function handleViewPaymentScreenshot(rec: BookingRequestRecord) {
    setActionError('');
    try {
      const imageUrl = await fetchCloudPaymentScreenshot(rec);
      setProofPreview({
        requestId: rec.id,
        referenceId: rec.referenceId,
        imageUrl,
      });
    } catch (err) {
      setActionError(extractReadableError(err, 'Unable to load payment screenshot from cloud.'));
    }
  }

  // ============================================================
  // STEP 1 OF 2 — IMMEDIATE 4-DIGIT PIN LOCK SCREEN
  // ============================================================
  if (!isPinVerified) {
    return (
      <section className="max-w-md mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-[#213D77] text-white px-6 py-5">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FB792B] mb-1">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Step 1 of 2 · Admin Security PIN</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Enter 4-Digit Admin PIN</h1>
            <p className="text-xs text-white/85 mt-1 leading-relaxed">
              SKY TRACK Admin access requires a 4-digit security PIN before proceeding to
              authorized Google Account verification.
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="p-6 space-y-5">
            <div>
              <label
                htmlFor="skytrack-admin-pin"
                className="block text-xs font-semibold text-slate-700 mb-2"
              >
                4-Digit Security PIN *
              </label>

              {/* 4-Digit Visual Indicator */}
              <div className="grid grid-cols-4 gap-2.5 mb-3" aria-hidden="true">
                {[0, 1, 2, 3].map((slot) => {
                  const filled = slot < pinInput.length;
                  return (
                    <div
                      key={slot}
                      className={`h-11 rounded-md border flex items-center justify-center transition-colors ${
                        filled
                          ? 'border-[#213D77] bg-[#F4F7FC]'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full transition-transform ${
                          filled ? 'bg-[#213D77] scale-100' : 'bg-slate-300 scale-75'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              <input
                id="skytrack-admin-pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                required
                autoFocus
                autoComplete="one-time-code"
                value={pinInput}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPinInput(digits);
                  if (pinError) setPinError('');
                }}
                placeholder="Enter 4-digit PIN"
                className="w-full h-11 px-3.5 text-center font-mono text-lg tracking-[0.5em] bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
              />
            </div>

            {pinError && (
              <div
                role="alert"
                className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-xs font-semibold text-red-700"
              >
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={verifyingPin || pinInput.length !== 4}
              className="w-full h-11 px-4 bg-[#FB792B] hover:bg-[#E06319] disabled:opacity-50 text-white text-sm font-bold rounded-md inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{verifyingPin ? 'Verifying PIN...' : 'Verify PIN & Continue'}</span>
            </button>

            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              Authorized SKY TRACK staff only. Step 2 will verify your agency Google account.
            </p>
          </form>
        </div>
      </section>
    );
  }

  // ============================================================
  // STEP 2 OF 2 — AUTHORIZED GOOGLE ACCOUNT VERIFICATION
  // ============================================================
  if (!isGoogleVerified || !firebaseUser || !isAuthorizedAdmin) {
    return (
      <section className="max-w-md mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-[#213D77] text-white px-6 py-5">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FB792B]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Step 2 of 2 · Google Account Verification</span>
              </span>
              <button
                type="button"
                onClick={handleBackToPinLock}
                className="inline-flex items-center gap-1 text-[11px] text-white/85 hover:text-white underline cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back to PIN</span>
              </button>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Verify Authorized Google Account</h1>
            <p className="text-xs text-white/85 mt-1 leading-relaxed">
              PIN accepted. Sign in with an authorized SKY TRACK Google account to unlock cloud
              bookings and ticket PDF uploads.
            </p>
          </div>

          <div className="p-6 space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Step 1 Complete · 4-Digit Security PIN Verified</span>
            </div>

            {firebaseUser && !isAuthorizedAdmin && (
              <div
                role="alert"
                className="p-3.5 bg-red-50 border border-red-200 rounded-md flex items-start gap-2.5 text-xs text-red-800"
              >
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Unauthorized Account</strong>
                  <span>
                    Signed in as <span className="font-mono">{firebaseUser.email}</span>, which does
                    not have SKY TRACK Admin permissions.
                  </span>
                </div>
              </div>
            )}

            {authError && (
              <div
                role="alert"
                className="p-3 bg-red-50 border border-red-200 rounded-md text-xs font-medium text-red-700 leading-relaxed"
              >
                {authError}
              </div>
            )}

            <div className="p-3.5 bg-[#F4F7FC] border border-[#213D77]/20 rounded-md text-xs text-slate-700 space-y-1.5">
              <div className="font-bold text-[#213D77] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#FB792B]" />
                <span>Authorized Agency Accounts</span>
              </div>
              <p className="leading-relaxed">
                Sign in with{' '}
                <span className="font-mono font-semibold">{AUTHORIZED_ADMIN_EMAILS[0]}</span> or{' '}
                <span className="font-mono font-semibold">{AUTHORIZED_ADMIN_EMAILS[1]}</span> to
                unlock the Admin Dashboard.
              </p>
            </div>

            <button
              type="button"
              disabled={googleAuthLoading}
              onClick={handleGoogleAdminSignIn}
              className="w-full h-11 px-4 bg-[#213D77] hover:bg-[#182D59] disabled:opacity-60 text-white text-sm font-bold rounded-md inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4 text-[#FB792B]" />
              <span>
                {googleAuthLoading
                  ? 'Opening Google Sign-In...'
                  : 'Sign In with Authorized Google Account'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleBackToPinLock}
              className="w-full h-10 px-4 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-md cursor-pointer"
            >
              Return to PIN Lock Screen
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ============================================================
  // UNLOCKED CLOUD ADMIN PORTAL
  // ============================================================
  const filteredRequests = requests.filter((rec) => {
    if (statusFilter !== 'ALL' && rec.status !== statusFilter) return false;
    if (!searchFilter.trim()) return true;
    const q = searchFilter.trim().toLowerCase();
    return (
      rec.mobile.includes(q) ||
      rec.referenceId.toLowerCase().includes(q) ||
      rec.trainName.toLowerCase().includes(q) ||
      rec.fromStation.toLowerCase().includes(q) ||
      rec.toStation.toLowerCase().includes(q) ||
      rec.passengers.some((p) => p.name.toLowerCase().includes(q))
    );
  });

  const pendingCount = requests.filter((r) => r.status === 'Pending Verification').length;
  const issuedCount = requests.filter((r) => r.hasTicketPdf).length;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      {/* Top Admin Header */}
      <div className="bg-[#213D77] text-white rounded-lg px-5 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 mb-1">
            <Cloud className="w-3.5 h-3.5" />
            <span>
              Firebase Cloud Synced ·{' '}
              <strong className="font-mono text-white">{firebaseUser.email}</strong>
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">
            SKY TRACK Admin — Cloud Booking Requests &amp; Ticket PDF Upload
          </h1>
          <p className="text-xs text-white/80 mt-0.5">
            Upload a customer&apos;s confirmed IRCTC PDF ticket from your phone or PC — customers
            can immediately download it from any phone using their 10-digit mobile number.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDirectForm((prev) => !prev)}
            className="min-h-[38px] inline-flex items-center gap-1.5 px-4 py-2 bg-[#FB792B] hover:bg-[#E06319] text-white text-xs font-bold rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Direct Ticket PDF</span>
          </button>

          <button
            type="button"
            onClick={handleFullSignOut}
            className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock &amp; Sign Out</span>
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500">Total Cloud Booking Requests</div>
          <div className="font-mono text-2xl font-bold text-[#213D77] tabular-nums mt-1">
            {requests.length}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500">Pending Availability Check</div>
          <div className="font-mono text-2xl font-bold text-[#FB792B] tabular-nums mt-1">
            {pendingCount}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500">Confirmed PDFs Published</div>
          <div className="font-mono text-2xl font-bold text-emerald-700 tabular-nums mt-1">
            {issuedCount}
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-md text-xs sm:text-sm font-medium text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="p-3.5 bg-red-50 border border-red-200 rounded-md text-xs sm:text-sm font-medium text-red-800"
        >
          {actionError}
        </div>
      )}

      {/* Direct Ticket PDF Upload Drawer (Walk-in / WhatsApp customers) */}
      {showDirectForm && (
        <form
          onSubmit={handleDirectTicketSubmit}
          className="bg-white border border-slate-200 rounded-lg p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-base font-bold text-[#213D77]">
                Upload Confirmed Ticket PDF for Customer Mobile
              </h2>
              <p className="text-xs text-slate-500">
                Upload from your phone or PC — the customer can immediately enter their 10-digit
                mobile number on their own phone in &quot;Track &amp; Download PDF&quot; to download
                this ticket.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDirectForm(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Mobile (10-digit) *
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                value={directMobile}
                onChange={(e) => setDirectMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9820123456"
                className="w-full h-10 px-3 text-sm font-mono bg-white border border-slate-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lead Passenger Name *
              </label>
              <input
                type="text"
                required
                value={directPassenger}
                onChange={(e) => setDirectPassenger(e.target.value)}
                placeholder="Full Name"
                className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                From Station *
              </label>
              <input
                type="text"
                required
                value={directFrom}
                onChange={(e) => setDirectFrom(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                To Station *
              </label>
              <input
                type="text"
                required
                value={directTo}
                onChange={(e) => setDirectTo(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Journey Date *
              </label>
              <input
                type="date"
                required
                value={directDate}
                onChange={(e) => setDirectDate(e.target.value)}
                className="w-full h-10 px-3 text-sm font-mono bg-white border border-slate-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Train Number
              </label>
              <input
                type="text"
                value={directTrainNumber}
                onChange={(e) => setDirectTrainNumber(e.target.value)}
                placeholder="e.g., 12810"
                className="w-full h-10 px-3 text-sm font-mono bg-white border border-slate-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Train Name
              </label>
              <input
                type="text"
                value={directTrainName}
                onChange={(e) => setDirectTrainName(e.target.value)}
                placeholder="e.g., HOWRAH MAIL"
                className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PNR Number
              </label>
              <input
                type="text"
                value={directPnr}
                onChange={(e) => setDirectPnr(e.target.value)}
                placeholder="10-digit PNR"
                className="w-full h-10 px-3 text-sm font-mono bg-white border border-slate-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Class</label>
              <select
                value={directClass}
                onChange={(e) => setDirectClass(e.target.value as SelectableClassCode)}
                className="w-full h-10 px-2.5 text-sm bg-white border border-slate-300 rounded-md"
              >
                {TRAVEL_CLASSES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quota</label>
              <select
                value={directQuota}
                onChange={(e) => setDirectQuota(e.target.value as QuotaType)}
                className="w-full h-10 px-2.5 text-sm bg-white border border-slate-300 rounded-md"
              >
                {QUOTA_OPTIONS.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirmed Ticket PDF (Max 5 MB) *
              </label>
              <input
                type="file"
                required
                accept="application/pdf,.pdf"
                onChange={(e) => setDirectFile(e.target.files?.[0] ?? null)}
                className="w-full h-10 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md file:mr-3 file:px-3 file:py-1 file:rounded file:border-0 file:bg-[#213D77] file:text-white file:text-xs file:font-semibold"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Agent Note (Optional)
              </label>
              <input
                type="text"
                value={directRemark}
                onChange={(e) => setDirectRemark(e.target.value)}
                placeholder="e.g., Confirmed B3/24 Lower Berth. Carry original ID."
                className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md"
              />
            </div>
            <button
              type="submit"
              disabled={submittingDirect}
              className="h-10 px-6 bg-[#213D77] hover:bg-[#182D59] disabled:opacity-60 text-white text-sm font-bold rounded-md whitespace-nowrap cursor-pointer"
            >
              {submittingDirect ? 'Publishing to Cloud...' : 'Publish Ticket PDF to Cloud'}
            </button>
          </div>
        </form>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter by mobile, Ref ID, passenger, station..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['ALL', ...STATUS_OPTIONS].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === status
                  ? 'bg-[#213D77] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {status === 'ALL' ? 'All Requests' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Management List */}
      {loadingList ? (
        <div className="bg-white border border-slate-200 rounded-lg py-12 text-center text-sm text-slate-500">
          Syncing live booking requests from Firebase Cloud...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg py-12 text-center text-sm text-slate-500">
          {requests.length === 0
            ? 'No cloud booking requests yet. Customer requests from any device and direct ticket PDF uploads will appear here live.'
            : 'No requests match your current filter.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((rec) => {
            const draft = draftEdits[rec.id] || {
              status: rec.status,
              pnrNumber: rec.pnrNumber || '',
              agentRemark: rec.agentRemark || '',
            };
            const isSaving = savingRowId === rec.id;

            return (
              <article
                key={rec.id}
                className="bg-white border border-slate-200 rounded-lg overflow-hidden"
              >
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
                    <span className="font-mono font-bold text-[#213D77]">{rec.referenceId}</span>
                    <span className="text-slate-300" aria-hidden="true">
                      |
                    </span>
                    <span className="font-mono font-semibold text-slate-900">
                      +91 {rec.mobile}
                    </span>
                    <span className="text-slate-300" aria-hidden="true">
                      |
                    </span>
                    <span className="font-semibold text-slate-800">
                      {rec.fromStation} → {rec.toStation}
                    </span>
                    <span className="text-slate-300" aria-hidden="true">
                      |
                    </span>
                    <span className="text-slate-600">{formatReadableDate(rec.journeyDate)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(rec)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:text-red-900 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
                    <div>
                      <span className="text-slate-500">
                        {rec.serviceType === 'flight'
                          ? 'Flight: '
                          : rec.serviceType === 'bus'
                          ? 'Bus: '
                          : 'Train: '}
                      </span>
                      <strong className="text-slate-900">
                        {rec.serviceType && rec.serviceType !== 'train'
                          ? rec.trainName
                          : rec.trainNumber === 'CUSTOM'
                          ? rec.trainName
                          : `${rec.trainNumber} — ${rec.trainName}`}
                      </strong>{' '}
                      · <strong className="font-mono">{rec.travelClass}</strong>
                      {(!rec.serviceType || rec.serviceType === 'train') && ` · ${rec.quota}`}
                      {rec.extraPreferences && ` · ${rec.extraPreferences}`}
                      {rec.isAdvanceOpeningPriority && (
                        <div className="mt-1 font-bold text-[#FB792B]">
                          [ADVANCE OPENING PRIORITY]
                        </div>
                      )}
                      {rec.referredBy && (
                        <div className="mt-0.5 font-semibold text-emerald-800">
                          Referred By: {rec.referredBy} (₹50 Off Service Charge)
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500">Passengers ({rec.passengers.length}): </span>
                      <strong className="text-slate-900">
                        {rec.passengers
                          .map((p) => {
                            const idTag = p.idProofType ? `, ID: ${p.idProofType}` : '';
                            return `${p.name} (${p.age}/${p.gender[0]}, ${p.berthPreference}${idTag})`;
                          })
                          .join('; ')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Payment Option: </span>
                      <strong className="text-[#213D77]">
                        {rec.advancePaymentChoice === 'advance-token' && rec.advanceTokenAmount
                          ? `Optional Advance Token (₹${rec.advanceTokenAmount.toLocaleString('en-IN')}) — PENDING VERIFICATION`
                          : 'Pay on Call / Cash (₹0 Advance Paid)'}
                      </strong>
                    </div>
                    {(rec.allowAlternateTrain || rec.allowClassUpgrade) && (
                      <div>
                        <span className="text-slate-500">Flexibility: </span>
                        <strong className="text-slate-900">
                          {[
                            rec.allowAlternateTrain ? 'Alternate Train OK' : null,
                            rec.allowClassUpgrade ? 'Class Upgrade OK' : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </strong>
                      </div>
                    )}
                    {rec.advancePaymentChoice === 'advance-token' && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span>
                          <span className="text-slate-500">Payment Proof: </span>
                          <strong className="text-amber-900">{describePaymentProof(rec)}</strong>
                        </span>
                        {rec.hasPaymentScreenshot && (
                          <button
                            type="button"
                            onClick={() => handleViewPaymentScreenshot(rec)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F4F7FC] hover:bg-[#213D77] text-[#213D77] hover:text-white border border-[#213D77]/25 rounded text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            <Image className="w-3.5 h-3.5" />
                            <span>View Screenshot</span>
                          </button>
                        )}
                      </div>
                    )}
                    {proofPreview?.requestId === rec.id && (
                      <div className="md:col-span-2 p-3 bg-slate-50 border border-slate-300 rounded-md">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-bold text-[#213D77]">
                            Uploaded Payment Screenshot — {proofPreview.referenceId}
                          </span>
                          <button
                            type="button"
                            onClick={() => setProofPreview(null)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-red-700 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Close Preview</span>
                          </button>
                        </div>
                        <img
                          src={proofPreview.imageUrl}
                          alt={`Payment screenshot for ${proofPreview.referenceId}`}
                          className="max-h-80 w-auto object-contain rounded border border-slate-200 bg-white"
                        />
                      </div>
                    )}
                    {rec.email && (
                      <div>
                        <span className="text-slate-500">Email: </span>
                        <strong className="text-slate-900">{rec.email}</strong>
                      </div>
                    )}
                  </div>

                  {/* Admin Controls */}
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Booking Status
                      </label>
                      <select
                        value={draft.status}
                        onChange={(e) =>
                          setDraftEdits((prev) => ({
                            ...prev,
                            [rec.id]: { ...draft, status: e.target.value as RequestStatus },
                          }))
                        }
                        className="w-full h-9 px-2.5 text-xs font-semibold bg-white border border-slate-300 rounded-md"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        PNR Number
                      </label>
                      <input
                        type="text"
                        value={draft.pnrNumber}
                        onChange={(e) =>
                          setDraftEdits((prev) => ({
                            ...prev,
                            [rec.id]: { ...draft, pnrNumber: e.target.value },
                          }))
                        }
                        placeholder="10-digit PNR"
                        className="w-full h-9 px-2.5 text-xs font-mono bg-white border border-slate-300 rounded-md"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Agent Note for Customer
                      </label>
                      <input
                        type="text"
                        value={draft.agentRemark}
                        onChange={(e) =>
                          setDraftEdits((prev) => ({
                            ...prev,
                            [rec.id]: { ...draft, agentRemark: e.target.value },
                          }))
                        }
                        placeholder="Coach/berth or confirmation note"
                        className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded-md"
                      />
                    </div>

                    <div className="md:col-span-3 flex flex-wrap items-center gap-2 justify-end">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleRowSave(rec)}
                        className="h-9 px-3.5 bg-[#213D77] hover:bg-[#182D59] disabled:opacity-60 text-white text-xs font-bold rounded-md transition-colors whitespace-nowrap cursor-pointer"
                      >
                        {isSaving ? 'Saving...' : 'Save Status'}
                      </button>

                      <label className="h-9 px-3 bg-[#FB792B] hover:bg-[#E06319] text-white text-xs font-bold rounded-md inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer">
                        <FileUp className="w-3.5 h-3.5" />
                        <span>{rec.hasTicketPdf ? 'Replace PDF' : 'Upload PDF'}</span>
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleRowSave(rec, f);
                            e.target.value = '';
                          }}
                        />
                      </label>

                      {rec.hasTicketPdf && (
                        <button
                          type="button"
                          onClick={() => handleAdminDownloadPdf(rec)}
                          className="h-9 px-3 border border-emerald-700 text-emerald-800 hover:bg-emerald-50 text-xs font-semibold rounded-md inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
