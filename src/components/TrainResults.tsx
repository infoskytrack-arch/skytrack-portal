import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CalendarClock,
  Clock,
  Home,
  ShieldCheck,
  TrainFront,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import {
  TRAVEL_CLASSES,
  type LanguageCode,
  type QuotaType,
  type SelectableClassCode,
  type Station,
  type TrainSchedule,
  type TravelClassCode,
} from '../types';
import { formatReadableDate } from '../utils/bookingFormat';

interface TrainResultsProps {
  language: LanguageCode;
  fromStation: Station;
  toStation: Station;
  journeyDate: string;
  quota: QuotaType;
  initialClassFilter: TravelClassCode;
  trains: TrainSchedule[];
  isAdvanceOpeningPriority?: boolean;
  onBackToSearch: () => void;
  onGoHome: () => void;
  onRequestBooking: (
    train: TrainSchedule,
    selectedClass: SelectableClassCode,
    customTrainNote?: string
  ) => void;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const PREFERRED_TIME_WINDOWS = [
  'Any Time',
  'Morning (5:00 AM – 12:00 PM)',
  'Afternoon (12:00 PM – 5:00 PM)',
  'Evening (5:00 PM – 9:00 PM)',
  'Night / Overnight (9:00 PM – 5:00 AM)',
] as const;

export function TrainResults({
  language,
  fromStation,
  toStation,
  journeyDate,
  quota,
  initialClassFilter,
  trains,
  isAdvanceOpeningPriority = false,
  onBackToSearch,
  onGoHome,
  onRequestBooking,
}: TrainResultsProps) {
  const t = TRANSLATIONS[language];
  const [selectedClassByTrain, setSelectedClassByTrain] = useState<
    Record<string, SelectableClassCode>
  >({});
  const [customTrainNote, setCustomTrainNote] = useState('');
  const [preferredTimeWindow, setPreferredTimeWindow] = useState<string>(
    PREFERRED_TIME_WINDOWS[0]
  );

  useEffect(() => {
    const nextDefaults: Record<string, SelectableClassCode> = {};
    for (const train of trains) {
      if (
        initialClassFilter !== 'ALL' &&
        train.classes.includes(initialClassFilter as SelectableClassCode)
      ) {
        nextDefaults[train.trainNumber] = initialClassFilter as SelectableClassCode;
      } else {
        nextDefaults[train.trainNumber] = train.classes[0] || '3A';
      }
    }
    setSelectedClassByTrain(nextDefaults);
  }, [trains, initialClassFilter]);

  const scheduledCount = trains.filter((tr) => !tr.isCustomOption).length;

  function getClassLabel(code: SelectableClassCode): string {
    return TRAVEL_CLASSES.find((c) => c.code === code)?.label ?? code;
  }

  function composeCustomNote(): string | undefined {
    const parts: string[] = [];
    if (customTrainNote.trim()) {
      parts.push(customTrainNote.trim());
    }
    if (preferredTimeWindow && preferredTimeWindow !== 'Any Time') {
      parts.push(`Preferred Time: ${preferredTimeWindow}`);
    }
    return parts.length > 0 ? parts.join(' | ') : undefined;
  }

  return (
    <section
      id="train-results-section"
      aria-label="Available Trains"
      className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6"
    >
      {/* Prominent Step 2 Top Action Bar */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBackToSearch}
          className="min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-bold text-[#213D77] bg-white hover:bg-slate-50 border border-slate-300 rounded-md inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>{t.backToSearch}</span>
        </button>

        <span className="hidden sm:inline text-xs font-semibold text-slate-500">
          Step 2 of 4 · Select Train &amp; Class
        </span>

        <button
          type="button"
          onClick={onGoHome}
          className="min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
        >
          <Home className="w-3.5 h-3.5 shrink-0" />
          <span>Home</span>
        </button>
      </div>

      {/* IRCTC-style Search Summary Bar */}
      <div className="bg-[#213D77] text-white rounded-t-lg px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="font-mono font-bold text-sm sm:text-base tracking-tight">
            {fromStation.name} ({fromStation.code})
          </span>
          <ArrowRight className="w-4 h-4 text-[#FB792B] shrink-0" />
          <span className="font-mono font-bold text-sm sm:text-base tracking-tight">
            {toStation.name} ({toStation.code})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/90">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#FB792B]" />
            <span>{formatReadableDate(journeyDate)}</span>
          </span>
          <span className="text-white/40" aria-hidden="true">
            |
          </span>
          <span>
            Quota: <strong className="text-white">{quota}</strong>
          </span>
          <span className="text-white/40" aria-hidden="true">
            |
          </span>
          <span className="tabular-nums">
            {scheduledCount > 0
              ? `${scheduledCount} Matching Trains`
              : 'Express / Passenger Request'}
          </span>
        </div>
      </div>

      {isAdvanceOpeningPriority && (
        <div className="bg-amber-50 border-x border-b border-amber-200 px-4 sm:px-5 py-2 text-xs font-bold text-amber-950 flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-[#FB792B] shrink-0" />
          <span>
            [ADVANCE OPENING PRIORITY] Active — Your request will be tagged for Festival / 60-Day Advance Opening priority booking.
          </span>
        </div>
      )}

      {/* Compact Zero-Price Transparency Note */}
      <div className="bg-slate-50 border-x border-b border-slate-200 px-4 sm:px-5 py-2.5 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2 rounded-b-lg mb-4">
        <span className="inline-flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#213D77] shrink-0" />
          <span>
            Select your train &amp; class below — live availability and exact fare are confirmed by our Zaveri Bazar agent.
          </span>
        </span>
        <span className="text-[11px] font-semibold text-[#213D77] whitespace-nowrap">
          No Ticket Prices Shown Upfront
        </span>
      </div>

      {/* Train Cards Stack */}
      <div className="space-y-3.5">
        {trains.map((train) => {
          const activeClass =
            selectedClassByTrain[train.trainNumber] || train.classes[0] || '3A';

          return (
            <article
              key={`${train.trainNumber}-${train.fromCode}-${train.toCode}`}
              className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-[#213D77]/45 transition-colors"
            >
              {/* Train Header Row */}
              <div
                className={`px-4 sm:px-5 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 ${
                  train.isCustomOption ? 'bg-[#F4F7FC]' : 'bg-slate-50'
                }`}
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <TrainFront className="w-4 h-4 text-[#213D77] shrink-0" />
                  <h3 className="text-sm sm:text-base font-bold text-[#213D77]">
                    {train.trainName}
                  </h3>
                  {!train.isCustomOption && (
                    <span className="font-mono text-xs sm:text-sm font-semibold text-slate-600 tabular-nums">
                      ({train.trainNumber})
                    </span>
                  )}
                  <span className="text-xs text-slate-500">· {train.trainType}</span>
                  {train.matchedNote && (
                    <span className="text-xs font-medium text-[#213D77]">
                      · {train.matchedNote}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500">Runs:</span>
                  <div className="flex items-center gap-0.5 font-mono" aria-label="Running days">
                    {DAY_LABELS.map((day, idx) => (
                      <span
                        key={`${train.trainNumber}-d-${idx}`}
                        className={`w-4 text-center font-semibold ${
                          train.runsOn[idx] ? 'text-[#213D77]' : 'text-slate-300'
                        }`}
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Body: Schedule + Class Selection */}
              <div className="p-4 sm:p-5">
                {train.isCustomOption ? (
                  <div className="mb-4 space-y-3.5">
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {scheduledCount === 0
                        ? `Our Zaveri Bazar rail desk books confirmed tickets across all Indian Railways Express, Superfast, Mail, and Passenger trains operating between ${fromStation.name} (${fromStation.code}) and ${toStation.name} (${toStation.code}). Share your preferred timing or train name below (optional) and select your class.`
                        : `Prefer a different train number, connecting journey, or want our agent to find the best available confirmed berth between ${fromStation.name} (${fromStation.code}) and ${toStation.name} (${toStation.code})? Submit your request directly below.`}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="custom-time-window"
                          className="block text-xs font-semibold text-[#213D77] mb-1"
                        >
                          Preferred Departure Time (Optional)
                        </label>
                        <select
                          id="custom-time-window"
                          value={preferredTimeWindow}
                          onChange={(e) => setPreferredTimeWindow(e.target.value)}
                          className="w-full h-10 px-3 text-sm text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                        >
                          {PREFERRED_TIME_WINDOWS.map((win) => (
                            <option key={win} value={win}>
                              {win}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="custom-train-input"
                          className="block text-xs font-semibold text-[#213D77] mb-1"
                        >
                          Preferred Train Name / Number (Optional)
                        </label>
                        <input
                          id="custom-train-input"
                          type="text"
                          value={customTrainNote}
                          onChange={(e) => setCustomTrainNote(e.target.value)}
                          placeholder="e.g., 12951 Rajdhani or Any Fast Express"
                          className="w-full h-10 px-3 text-sm text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center pb-4 mb-4 border-b border-slate-100">
                    <div>
                      <div className="font-mono text-base sm:text-xl font-bold text-slate-900 tabular-nums">
                        {train.departureTime}
                      </div>
                      <div className="text-[11px] sm:text-xs font-medium text-slate-600 mt-0.5 truncate">
                        {train.fromName} ({train.fromCode})
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-mono text-slate-500 tabular-nums">
                        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span>{train.duration}</span>
                      </div>
                      <div className="w-full max-w-[140px] h-px bg-slate-300 my-1.5 relative">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#213D77] absolute -left-0.5 -top-[2.5px]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FB792B] absolute -right-0.5 -top-[2.5px]" />
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-slate-500 text-center">
                        {formatReadableDate(journeyDate)}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-base sm:text-xl font-bold text-slate-900 tabular-nums">
                        {train.arrivalTime}
                      </div>
                      <div className="text-[11px] sm:text-xs font-medium text-slate-600 mt-0.5 truncate">
                        {train.toName} ({train.toCode})
                      </div>
                    </div>
                  </div>
                )}

                {/* Selectable Class Tabs (NO Prices Shown) */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3.5">
                  <div className="flex-1">
                    <div className="text-[11px] sm:text-xs font-semibold text-slate-600 mb-2">
                      Select Travel Class (Agent checks live IRCTC availability):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {train.classes.map((cls) => {
                        const isSelected = activeClass === cls;
                        return (
                          <button
                            key={`${train.trainNumber}-${cls}`}
                            type="button"
                            onClick={() =>
                              setSelectedClassByTrain((prev) => ({
                                ...prev,
                                [train.trainNumber]: cls,
                              }))
                            }
                            className={`min-w-[104px] sm:min-w-[116px] px-3 py-2 rounded-md border text-left transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#213D77] border-[#213D77] text-white'
                                : 'bg-white border-slate-300 text-slate-800 hover:border-[#213D77]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs sm:text-sm font-bold">{cls}</span>
                              <span
                                className={`text-[10px] font-medium ${
                                  isSelected ? 'text-white/85' : 'text-slate-500'
                                }`}
                              >
                                {quota === 'TATKAL' || quota === 'PREMIUM TATKAL' ? 'TQ' : 'GN'}
                              </span>
                            </div>
                            <div
                              className={`text-[11px] font-semibold mt-0.5 whitespace-nowrap ${
                                isSelected ? 'text-[#FB792B]' : 'text-[#213D77]'
                              }`}
                            >
                              Check &amp; Request
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Primary Action Button */}
                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onRequestBooking(
                          train,
                          activeClass,
                          train.isCustomOption ? composeCustomNote() : undefined
                        )
                      }
                      className="w-full lg:w-auto h-11 px-6 bg-[#FB792B] hover:bg-[#E06319] text-white text-sm font-bold rounded-md transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Request Booking ({getClassLabel(activeClass)})
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
