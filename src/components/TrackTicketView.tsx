import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Lock,
  MessageCircle,
  Search,
  TrainFront,
  XCircle,
} from 'lucide-react';
import { AGENCY_CONTACT, type BookingRequestRecord } from '../types';
import { formatReadableDate } from '../utils/bookingFormat';
import {
  downloadCloudTicketPdf,
  trackCloudTicketRequests,
} from '../utils/cloudBookingStore';

interface TrackTicketViewProps {
  initialMobile?: string;
  onOpenAdmin: () => void;
  onGoHome?: () => void;
}

export function TrackTicketView({
  initialMobile = '',
  onOpenAdmin,
  onGoHome,
}: TrackTicketViewProps) {
  const [query, setQuery] = useState(initialMobile);
  const [results, setResults] = useState<BookingRequestRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function runLookup(rawQuery: string) {
    const cleaned = rawQuery.trim();
    if (!cleaned) {
      setError('Please enter your 10-digit mobile number or Booking Reference ID.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const matched = await trackCloudTicketRequests(cleaned);
      setResults(matched);
    } catch (err) {
      setResults(null);
      let friendly = 'Unable to search right now. Please try again.';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message) as { error?: string };
          friendly = parsed.error || err.message;
        } catch {
          friendly = err.message;
        }
      }
      setError(friendly);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPdf(rec: BookingRequestRecord) {
    setError('');
    setDownloadingId(rec.id);
    try {
      await downloadCloudTicketPdf(rec);
    } catch (err) {
      let friendly = 'Unable to download ticket PDF right now.';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message) as { error?: string };
          friendly = parsed.error || err.message;
        } catch {
          friendly = err.message;
        }
      }
      setError(friendly);
    } finally {
      setDownloadingId(null);
    }
  }

  useEffect(() => {
    if (initialMobile) {
      setQuery(initialMobile);
      runLookup(initialMobile);
    }
  }, [initialMobile]);

  function getStatusVisual(status: BookingRequestRecord['status']) {
    switch (status) {
      case 'Ticket Issued':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />,
          textClass: 'text-emerald-800 font-bold',
          label: 'Ticket Confirmed & Ready to Download',
        };
      case 'Fare Confirmed':
        return {
          icon: <Clock className="w-4 h-4 text-[#213D77] shrink-0" />,
          textClass: 'text-[#213D77] font-bold',
          label: 'Availability Checked — Fare Shared by Agent',
        };
      case 'Cancelled':
        return {
          icon: <XCircle className="w-4 h-4 text-red-700 shrink-0" />,
          textClass: 'text-red-700 font-bold',
          label: 'Cancelled',
        };
      default:
        return {
          icon: <Clock className="w-4 h-4 text-amber-700 shrink-0" />,
          textClass: 'text-amber-800 font-bold',
          label: 'Pending Live Availability Verification',
        };
    }
  }

  return (
    <section className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {onGoHome && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onGoHome}
            className="min-h-[40px] px-3 py-1.5 bg-white border border-slate-300 hover:border-[#213D77] text-[#213D77] text-xs font-bold rounded-md inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home / Search</span>
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-[#213D77] text-white px-4 sm:px-6 py-4 sm:py-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight">
              Track Request &amp; Download Confirmed Ticket
            </h1>
            <p className="text-xs sm:text-sm text-white/85 mt-1">
              Enter your registered 10-digit mobile number or Booking Reference ID to check status and download your confirmed IRCTC ticket PDF.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAdmin}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/25 rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Agent Ticket Upload Login</span>
          </button>
        </div>

        {/* Lookup Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runLookup(query);
          }}
          className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label htmlFor="track-mobile-input" className="sr-only">
                Mobile Number or Booking Reference ID
              </label>
              <input
                id="track-mobile-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter 10-digit Mobile Number (e.g., 9820123456) or Reference ID (ST-2026-...)"
                className="w-full h-12 px-4 text-sm font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77] focus:ring-2 focus:ring-[#213D77]/15"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-12 px-7 bg-[#FB792B] hover:bg-[#E06319] disabled:opacity-60 text-white text-sm font-bold rounded-md inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Searching...' : 'Find My Ticket'}</span>
            </button>
          </div>

          {error && (
            <p role="alert" className="mt-3 text-xs sm:text-sm font-medium text-red-700">
              {error}
            </p>
          )}
        </form>

        {/* Results */}
        <div className="p-6">
          {results === null ? (
            <div className="py-10 text-center max-w-md mx-auto">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h2 className="text-base font-bold text-slate-900">
                Ready to Download Your Confirmed Ticket?
              </h2>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                Once our Zaveri Bazar agent issues your ticket and uploads the PDF, enter your mobile number above to download it anytime.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-10 text-center max-w-md mx-auto">
              <TrainFront className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h2 className="text-base font-bold text-slate-900">No Matching Requests Found</h2>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                We couldn&apos;t find a booking request or uploaded ticket for{' '}
                <strong className="font-mono text-slate-900">{query}</strong>. If you booked over the phone, please confirm your mobile number with our desk on{' '}
                <a
                  href={`tel:+${AGENCY_CONTACT.primaryPhoneRaw}`}
                  className="font-semibold text-[#213D77] underline"
                >
                  {AGENCY_CONTACT.primaryPhoneDisplay}
                </a>
                .
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-500">
                Showing {results.length} booking {results.length === 1 ? 'record' : 'records'}
              </div>

              {results.map((rec) => {
                const statusUi = getStatusVisual(rec.status);

                return (
                  <article
                    key={rec.id}
                    className="border border-slate-200 rounded-lg overflow-hidden bg-white"
                  >
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
                        <span className="font-mono font-bold text-[#213D77]">
                          {rec.referenceId}
                        </span>
                        <span className="text-slate-300" aria-hidden="true">
                          |
                        </span>
                        <span className="font-semibold text-slate-900">
                          {rec.trainNumber === 'CUSTOM'
                            ? rec.trainName
                            : `${rec.trainNumber} — ${rec.trainName}`}
                        </span>
                      </div>

                      <div className={`inline-flex items-center gap-1.5 text-xs ${statusUi.textClass}`}>
                        {statusUi.icon}
                        <span>{statusUi.label}</span>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
                      <div className="space-y-2 text-sm">
                        <div className="font-semibold text-slate-900">
                          {rec.fromStation} → {rec.toStation}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                          <span>Date: {formatReadableDate(rec.journeyDate)}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono font-semibold text-slate-800">
                            Class {rec.travelClass}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>Quota: {rec.quota}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            Passengers: {rec.passengers.map((p) => p.name).join(', ')}
                          </span>
                        </div>

                        {rec.pnrNumber && (
                          <div className="text-xs text-slate-700">
                            PNR Number:{' '}
                            <strong className="font-mono text-sm text-[#213D77] tabular-nums">
                              {rec.pnrNumber}
                            </strong>
                          </div>
                        )}

                        {rec.agentRemark && (
                          <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded px-3 py-2">
                            <strong className="text-slate-800">Agent Note: </strong>
                            {rec.agentRemark}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex flex-wrap items-center gap-2.5">
                        {rec.hasTicketPdf ? (
                          <button
                            type="button"
                            disabled={downloadingId === rec.id}
                            onClick={() => handleDownloadPdf(rec)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-sm font-bold rounded-md transition-colors whitespace-nowrap cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                            <span>
                              {downloadingId === rec.id
                                ? 'Downloading PDF...'
                                : 'Download Ticket PDF'}
                            </span>
                          </button>
                        ) : (
                          <a
                            href={`https://wa.me/${AGENCY_CONTACT.primaryPhoneRaw}?text=${encodeURIComponent(
                              `Hello SKY TRACK, checking status for Booking Ref: ${rec.referenceId} (Mobile: ${rec.mobile}).`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-800 hover:border-[#213D77] hover:text-[#213D77] text-xs font-semibold rounded-md transition-colors whitespace-nowrap"
                          >
                            <MessageCircle className="w-4 h-4 text-emerald-700" />
                            <span>Ask Agent on WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
