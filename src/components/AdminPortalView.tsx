import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileUp,
  Image,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
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

const STATUS_OPTIONS: RequestStatus[] = [
  'Pending Verification',
  'Fare Confirmed',
  'Ticket Issued',
  'Cancelled',
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes(',') ? result.split(',').pop() || '' : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read selected PDF file.'));
    reader.readAsDataURL(file);
  });
}

export function AdminPortalView() {
  // Token kept strictly in React memory (never persisted to localStorage)
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<{
    loaded: boolean;
    configured: boolean;
    mode: 'env' | 'claimed' | 'unconfigured';
  }>({ loaded: false, configured: true, mode: 'unconfigured' });

  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [requests, setRequests] = useState<BookingRequestRecord[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const [proofPreview, setProofPreview] = useState<{
    requestId: string;
    referenceId: string;
    objectUrl: string;
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

  useEffect(() => {
    fetch('/api/admin/status')
      .then((res) => res.json())
      .then((data: { configured: boolean; mode: 'env' | 'claimed' | 'unconfigured' }) => {
        setAuthStatus({ loaded: true, configured: data.configured, mode: data.mode });
      })
      .catch(() => {
        setAuthStatus({ loaded: true, configured: true, mode: 'env' });
      });
  }, []);

  const fetchRequests = useCallback(async (token: string) => {
    setLoadingList(true);
    setActionError('');
    try {
      const res = await fetch('/api/admin/requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        setAdminToken(null);
        setAuthError('Session expired. Please sign in again.');
        return;
      }
      const data = (await res.json()) as { requests?: BookingRequestRecord[]; error?: string };
      if (!res.ok) throw new Error(data.error || 'Could not fetch booking requests.');
      const items = data.requests ?? [];
      setRequests(items);
      const nextDrafts: Record<
        string,
        { status: RequestStatus; pnrNumber: string; agentRemark: string }
      > = {};
      for (const rec of items) {
        nextDrafts[rec.id] = {
          status: rec.status,
          pnrNumber: rec.pnrNumber || '',
          agentRemark: rec.agentRemark || '',
        };
      }
      setDraftEdits(nextDrafts);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to load requests.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (adminToken) {
      fetchRequests(adminToken);
    }
  }, [adminToken, fetchRequests]);

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    const pwd = passwordInput.trim();
    if (!pwd) {
      setAuthError('Please enter your admin password.');
      return;
    }

    if (!authStatus.configured) {
      if (pwd.length < 6) {
        setAuthError('Please choose a password of at least 6 characters.');
        return;
      }
      if (pwd !== confirmPasswordInput.trim()) {
        setAuthError('Passwords do not match.');
        return;
      }
    }

    setAuthLoading(true);
    try {
      const endpoint = authStatus.configured ? '/api/admin/login' : '/api/admin/setup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        throw new Error(data.error || 'Authentication failed.');
      }
      setAdminToken(data.token);
      setAuthStatus((prev) => ({
        ...prev,
        configured: true,
        mode: prev.mode === 'unconfigured' ? 'claimed' : prev.mode,
      }));
      setPasswordInput('');
      setConfirmPasswordInput('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRowSave(recId: string, pdfFile?: File) {
    if (!adminToken) return;
    setSavingRowId(recId);
    setActionError('');
    setFeedbackMsg('');
    try {
      const draft = draftEdits[recId];
      const payload: Record<string, unknown> = {
        status: draft?.status,
        pnrNumber: draft?.pnrNumber ?? '',
        agentRemark: draft?.agentRemark ?? '',
      };

      if (pdfFile) {
        if (pdfFile.type !== 'application/pdf' && !pdfFile.name.toLowerCase().endsWith('.pdf')) {
          throw new Error('Only PDF files (.pdf) can be uploaded as tickets.');
        }
        if (pdfFile.size > 5 * 1024 * 1024) {
          throw new Error('Ticket PDF must be under 5 MB.');
        }
        payload.pdfBase64 = await fileToBase64(pdfFile);
        payload.pdfOriginalName = pdfFile.name;
      }

      const res = await fetch(`/api/admin/requests/${encodeURIComponent(recId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { request?: BookingRequestRecord; error?: string };
      if (!res.ok || !data.request) {
        throw new Error(data.error || 'Could not update booking record.');
      }

      setRequests((prev) => prev.map((r) => (r.id === recId ? data.request! : r)));
      setDraftEdits((prev) => ({
        ...prev,
        [recId]: {
          status: data.request!.status,
          pnrNumber: data.request!.pnrNumber || '',
          agentRemark: data.request!.agentRemark || '',
        },
      }));
      setFeedbackMsg(
        pdfFile
          ? `Confirmed ticket PDF uploaded for ${data.request.referenceId}. Customer can now download it via mobile ${data.request.mobile}.`
          : `Updated booking ${data.request.referenceId}.`
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setSavingRowId(null);
    }
  }

  async function handleDirectTicketSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!adminToken) return;
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
    if (directFile.size > 5 * 1024 * 1024) {
      setActionError('Ticket PDF must be under 5 MB.');
      return;
    }

    setSubmittingDirect(true);
    try {
      const pdfBase64 = await fileToBase64(directFile);
      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
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
          pdfBase64,
          pdfOriginalName: directFile.name,
        }),
      });
      const data = (await res.json()) as { request?: BookingRequestRecord; error?: string };
      if (!res.ok || !data.request) {
        throw new Error(data.error || 'Could not upload ticket.');
      }

      setRequests((prev) => [data.request!, ...prev]);
      setDraftEdits((prev) => ({
        ...prev,
        [data.request!.id]: {
          status: data.request!.status,
          pnrNumber: data.request!.pnrNumber || '',
          agentRemark: data.request!.agentRemark || '',
        },
      }));
      setShowDirectForm(false);
      setDirectMobile('');
      setDirectPassenger('');
      setDirectTrainNumber('');
      setDirectTrainName('');
      setDirectPnr('');
      setDirectRemark('');
      setDirectFile(null);
      setFeedbackMsg(
        `Ticket PDF uploaded! Customer can now download it using mobile ${data.request.mobile} (Ref: ${data.request.referenceId}).`
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setSubmittingDirect(false);
    }
  }

  async function handleDelete(recId: string, refId: string) {
    if (!adminToken) return;
    setActionError('');
    try {
      const res = await fetch(`/api/admin/requests/${encodeURIComponent(recId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error('Could not delete record.');
      setRequests((prev) => prev.filter((r) => r.id !== recId));
      setFeedbackMsg(`Removed booking record ${refId}.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Delete failed.');
    }
  }

  async function handleAdminDownloadPdf(rec: BookingRequestRecord) {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(rec.id)}/download`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error('Could not download PDF.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SKYTRACK-${rec.referenceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Download failed.');
    }
  }

  async function handleViewPaymentScreenshot(rec: BookingRequestRecord) {
    if (!adminToken) return;
    setActionError('');
    try {
      const res = await fetch(`/api/admin/requests/${encodeURIComponent(rec.id)}/proof`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) {
        throw new Error('Could not load uploaded payment screenshot.');
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setProofPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev.objectUrl);
        return { requestId: rec.id, referenceId: rec.referenceId, objectUrl };
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to view payment screenshot.');
    }
  }

  function closeProofPreview() {
    setProofPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev.objectUrl);
      return null;
    });
  }

  // Unauthenticated View (First-run Setup OR Standard Login)
  if (!adminToken) {
    return (
      <section className="max-w-md mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-[#213D77] text-white px-6 py-5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#FB792B] mb-1">
              <Lock className="w-3.5 h-3.5" />
              <span>SKY TRACK Staff Access</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              {!authStatus.loaded
                ? 'Checking Admin Access...'
                : authStatus.configured
                ? 'Agent / Admin Sign In'
                : 'First-Time Admin Password Setup'}
            </h1>
            <p className="text-xs text-white/85 mt-1">
              {authStatus.configured
                ? 'Sign in to manage booking requests and upload confirmed ticket PDFs.'
                : 'Initialize your SKY TRACK admin password (e.g., skytrack2026) to lock the ticket upload console.'}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="p-6 space-y-4">
            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                {authStatus.configured ? 'Admin Password' : 'Create Admin Password'}
              </label>
              <input
                id="admin-password"
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder={authStatus.configured ? 'Enter admin password' : 'Minimum 6 characters'}
                className="w-full h-11 px-3.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
              />
            </div>

            {authStatus.loaded && !authStatus.configured && (
              <div>
                <label
                  htmlFor="admin-password-confirm"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Confirm Admin Password
                </label>
                <input
                  id="admin-password-confirm"
                  type="password"
                  required
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full h-11 px-3.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                />
              </div>
            )}

            {authError && (
              <div
                role="alert"
                className="p-3 bg-red-50 border border-red-200 rounded text-xs font-medium text-red-700"
              >
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading || !authStatus.loaded}
              className="w-full h-11 bg-[#213D77] hover:bg-[#182D59] disabled:opacity-60 text-white text-sm font-bold rounded-md transition-colors cursor-pointer"
            >
              {authLoading
                ? 'Verifying...'
                : authStatus.configured
                ? 'Sign In to Admin Portal'
                : 'Set Password & Sign In'}
            </button>
          </form>
        </div>
      </section>
    );
  }

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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      {/* Top Admin Header */}
      <div className="bg-[#213D77] text-white rounded-lg px-6 py-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            SKY TRACK Admin — Booking Requests &amp; Ticket PDF Upload
          </h1>
          <p className="text-xs text-white/80 mt-0.5">
            Update request statuses, add PNR numbers, and upload confirmed IRCTC PDF tickets for instant customer download.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowDirectForm((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FB792B] hover:bg-[#E06319] text-white text-xs font-bold rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Direct Ticket PDF</span>
          </button>

          <button
            type="button"
            onClick={() => fetchRequests(adminToken)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAdminToken(null);
              setRequests([]);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500">Total Booking Requests</div>
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
          <div className="text-xs font-medium text-slate-500">Confirmed PDFs Uploaded</div>
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
                Use this for phone or walk-in bookings so the customer can download their PDF from the Track tab.
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
              {submittingDirect ? 'Uploading...' : 'Save & Publish Ticket PDF'}
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
      {filteredRequests.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg py-12 text-center text-sm text-slate-500">
          {requests.length === 0
            ? 'No booking requests submitted yet. Customer requests and direct ticket uploads will appear here.'
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
                    onClick={() => handleDelete(rec.id, rec.referenceId)}
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
                            onClick={closeProofPreview}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-red-700 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Close Preview</span>
                          </button>
                        </div>
                        <img
                          src={proofPreview.objectUrl}
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
                        onClick={() => handleRowSave(rec.id)}
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
                            if (f) handleRowSave(rec.id, f);
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
