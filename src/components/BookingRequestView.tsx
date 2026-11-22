import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Gift,
  Home,
  ImagePlus,
  Mail,
  MessageCircle,
  Plus,
  Printer,
  Share2,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import {
  AGENCY_CONTACT,
  BERTH_PREFERENCES,
  ID_PROOF_OPTIONS,
  type AdvancePaymentChoice,
  type BerthPreference,
  type BookingRequestRecord,
  type GenderType,
  type IdProofType,
  type LanguageCode,
  type PassengerDetail,
  type ServiceType,
} from '../types';
import {
  buildMailtoUrl,
  buildRequestMessageText,
  buildUpiPayloadWithAmount,
  buildWhatsAppUrl,
  describePaymentProof,
  formatInrAmount,
  formatReadableDate,
  getPerPassengerAdvanceToken,
  launchSafeExternalLink,
} from '../utils/bookingFormat';
import { downloadOfficialRequestReceipt } from '../utils/officialReceiptGenerator';
import {
  clearSavedPassengerProfile,
  loadSavedPassengerProfile,
  savePassengerProfile,
  type SavedPassengerProfile,
} from '../utils/savedPassengers';

export interface BookingScreenContext {
  serviceType: ServiceType;
  trainNumber: string;
  trainName: string;
  fromLabel: string;
  toLabel: string;
  defaultBoarding: string;
  journeyDate: string;
  returnDate?: string;
  travelClass: string;
  quota: string;
  extraPreferences?: string;
  isAdvanceOpeningPriority?: boolean;
}

interface BookingFormScreenProps {
  context: BookingScreenContext;
  language: LanguageCode;
  hasTrainResults: boolean;
  onBack: () => void;
  onExitHome: () => void;
  onSubmitted: (record: BookingRequestRecord) => void;
}

function createEmptyPassenger(): PassengerDetail {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    age: '',
    gender: 'Male',
    berthPreference: 'No Preference',
    idProofType: '',
  };
}

export function BookingFormScreen({
  context,
  language,
  hasTrainResults,
  onBack,
  onExitHome,
  onSubmitted,
}: BookingFormScreenProps) {
  const t = TRANSLATIONS[language];
  const isTrain = context.serviceType === 'train';

  const [passengers, setPassengers] = useState<PassengerDetail[]>([createEmptyPassenger()]);
  const [mobile, setMobile] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [email, setEmail] = useState('');
  const [boardingStation, setBoardingStation] = useState(context.defaultBoarding);

  // Smart Flexibility Instructions
  const [allowAlternateTrain, setAllowAlternateTrain] = useState(false);
  const [allowClassUpgrade, setAllowClassUpgrade] = useState(false);

  // Customer Referral Discount Box (₹50 Off Service Charge)
  const [referredBy, setReferredBy] = useState('');
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Repeat Passenger Auto-Fill (Browser Local Storage)
  const [savedProfile, setSavedProfile] = useState<SavedPassengerProfile | null>(() =>
    loadSavedPassengerProfile()
  );
  const [autoFilledNotice, setAutoFilledNotice] = useState(false);

  // Optional Advance Token Payment Choice & 3 Flexible Proof Options
  const [advanceChoice, setAdvanceChoice] =
    useState<AdvancePaymentChoice>('pay-after-confirmation');
  const [paymentReference, setPaymentReference] = useState('');
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string>('');
  const [screenshotFileName, setScreenshotFileName] = useState<string>('');
  const [screenshotError, setScreenshotError] = useState<string>('');
  const [willShareProofOnWhatsApp, setWillShareProofOnWhatsApp] = useState(false);
  const [copiedUpiId, setCopiedUpiId] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [submittingChannel, setSubmittingChannel] = useState<'whatsapp' | 'email' | null>(null);

  const tokenMeta = getPerPassengerAdvanceToken(context.serviceType, context.travelClass);
  const totalAdvanceToken = tokenMeta.perPassenger * passengers.length;
  const upiDeepLink = buildUpiPayloadWithAmount(totalAdvanceToken);
  const cleanedUtr = paymentReference.replace(/\D/g, '').slice(0, 12);
  const isUtrValid = /^\d{12}$/.test(cleanedUtr);
  const hasScreenshot = screenshotDataUrl.length > 0;
  const hasAnyValidProof = hasScreenshot || isUtrValid || willShareProofOnWhatsApp;
  const isAdvanceBlocked = advanceChoice === 'advance-token' && !hasAnyValidProof;

  useEffect(() => {
    setBoardingStation(context.defaultBoarding);
  }, [context.defaultBoarding]);

  function handleScreenshotFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setScreenshotError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const validMime = file.type === 'image/jpeg' || file.type === 'image/png';
    const validExt = /\.(jpe?g|png)$/i.test(file.name);
    if (!validMime && !validExt) {
      setScreenshotError('Please select a JPG or PNG payment screenshot image.');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setScreenshotError('Screenshot image must be under 5 MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (result.startsWith('data:image/')) {
        setScreenshotDataUrl(result);
        setScreenshotFileName(file.name);
      } else {
        setScreenshotError('Could not read the selected image file. Please try another JPG/PNG.');
      }
    };
    reader.onerror = () => {
      setScreenshotError('Failed to read image file. Please try again.');
    };
    reader.readAsDataURL(file);
  }

  function handleClearScreenshot() {
    setScreenshotDataUrl('');
    setScreenshotFileName('');
    setScreenshotError('');
  }

  async function handleCopyUpiId() {
    try {
      await navigator.clipboard.writeText(AGENCY_CONTACT.upiId);
      setCopiedUpiId(true);
      setTimeout(() => setCopiedUpiId(false), 2500);
    } catch {
      setCopiedUpiId(false);
    }
  }

  function handleAutoFillSavedPassenger() {
    if (!savedProfile) return;
    const hydrated: PassengerDetail[] = savedProfile.passengers.map((p, idx) => ({
      id: `saved-${Date.now()}-${idx}`,
      name: p.name,
      age: p.age,
      gender: p.gender,
      berthPreference: p.berthPreference,
      idProofType: p.idProofType,
    }));
    setPassengers(hydrated);
    if (savedProfile.mobile) setMobile(savedProfile.mobile);
    if (savedProfile.alternatePhone) setAlternatePhone(savedProfile.alternatePhone);
    if (savedProfile.email) setEmail(savedProfile.email);
    setAutoFilledNotice(true);
    setTimeout(() => setAutoFilledNotice(false), 3000);
  }

  function handleForgetSavedPassenger() {
    clearSavedPassengerProfile();
    setSavedProfile(null);
    setAutoFilledNotice(false);
  }

  async function handleCopyPortalLink() {
    try {
      const shareText = `Book Train, Flight & Bus tickets easily with SKY TRACK (Zaveri Bazar, South Mumbai): ${window.location.origin}`;
      await navigator.clipboard.writeText(shareText);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2500);
    } catch {
      setCopiedShareLink(false);
    }
  }

  function updatePassenger(
    id: string,
    field: keyof Omit<PassengerDetail, 'id'>,
    value: string
  ) {
    setPassengers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  }

  function addPassenger() {
    if (passengers.length >= 6) return;
    setPassengers((prev) => [...prev, createEmptyPassenger()]);
  }

  function removePassenger(id: string) {
    if (passengers.length <= 1) return;
    setPassengers((prev) => prev.filter((p) => p.id !== id));
  }

  function validateForm(): string | null {
    for (let i = 0; i < passengers.length; i += 1) {
      const p = passengers[i];
      if (!p.name.trim()) {
        return `Please enter the full name for Passenger ${i + 1}.`;
      }
      const ageNum = Number(p.age);
      if (!p.age.trim() || !Number.isFinite(ageNum) || ageNum < 1 || ageNum > 120) {
        return `Please enter a valid age (1–120) for Passenger ${i + 1}.`;
      }
    }

    const cleanedMobile = mobile.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanedMobile)) {
      return 'Please enter a valid 10-digit WhatsApp mobile number.';
    }

    if (alternatePhone.trim()) {
      const cleanedAlt = alternatePhone.replace(/\D/g, '').slice(-10);
      if (!/^[6-9]\d{9}$/.test(cleanedAlt)) {
        return 'Alternate phone number must be a valid 10-digit mobile number.';
      }
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return 'Please enter a valid email address.';
    }

    if (!boardingStation.trim()) {
      return isTrain
        ? 'Please specify your boarding station.'
        : 'Please specify your boarding city / airport.';
    }

    if (advanceChoice === 'advance-token' && !hasAnyValidProof) {
      return "Please complete at least ONE payment proof option (Upload Payment Screenshot, enter 12-digit UTR, or tick the WhatsApp screenshot checkbox) to proceed, or select 'Skip Advance & Pay on Call/Cash'.";
    }

    return null;
  }

  async function handleSubmit(channel: 'whatsapp' | 'email') {
    setErrorMessage('');
    const validationErr = validateForm();
    if (validationErr) {
      setErrorMessage(validationErr);
      return;
    }

    setSubmittingChannel(channel);
    try {
      const cleanedMobile = mobile.replace(/\D/g, '').slice(-10);
      const cleanedAlt = alternatePhone.trim()
        ? alternatePhone.replace(/\D/g, '').slice(-10)
        : undefined;

      // Save passenger profile locally for 1-tap Repeat Passenger Auto-Fill on future visits
      savePassengerProfile({
        passengers,
        mobile: cleanedMobile,
        alternatePhone: cleanedAlt,
        email: email.trim() || undefined,
      });

      const payload = {
        serviceType: context.serviceType,
        trainNumber: context.trainNumber,
        trainName: context.trainName,
        fromStation: context.fromLabel,
        toStation: context.toLabel,
        boardingStation: boardingStation.trim(),
        journeyDate: context.journeyDate,
        returnDate: context.returnDate,
        travelClass: context.travelClass,
        quota: context.quota,
        extraPreferences: context.extraPreferences,
        allowAlternateTrain: isTrain ? allowAlternateTrain : false,
        allowClassUpgrade: isTrain ? allowClassUpgrade : false,
        isAdvanceOpeningPriority: Boolean(context.isAdvanceOpeningPriority),
        referredBy: referredBy.trim() || undefined,
        advancePaymentChoice: advanceChoice,
        passengers: passengers.map((p) => ({
          name: p.name.trim(),
          age: Math.round(Number(p.age)),
          gender: p.gender,
          berthPreference: p.berthPreference,
          idProofType: p.idProofType || undefined,
        })),
        mobile: cleanedMobile,
        alternatePhone: cleanedAlt,
        email: email.trim() || undefined,
        paymentReference:
          advanceChoice === 'advance-token' && isUtrValid ? cleanedUtr : undefined,
        paymentScreenshotBase64:
          advanceChoice === 'advance-token' && hasScreenshot ? screenshotDataUrl : undefined,
        paymentScreenshotOriginalName:
          advanceChoice === 'advance-token' && hasScreenshot ? screenshotFileName : undefined,
        willShareProofOnWhatsApp:
          advanceChoice === 'advance-token' ? willShareProofOnWhatsApp : false,
        deliveryChannel: channel,
      };

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as {
        request?: BookingRequestRecord;
        error?: string;
      };

      if (!res.ok || !data.request) {
        throw new Error(data.error || 'Could not submit your booking request. Please try again.');
      }

      if (channel === 'whatsapp') {
        launchSafeExternalLink(buildWhatsAppUrl(data.request));
      } else {
        launchSafeExternalLink(buildMailtoUrl(data.request));
      }

      onSubmitted(data.request);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong while submitting your request.'
      );
    } finally {
      setSubmittingChannel(null);
    }
  }

  const serviceBadgeText =
    context.serviceType === 'flight'
      ? 'Flight Ticket Request'
      : context.serviceType === 'bus'
      ? 'Bus Ticket Request'
      : 'Train Ticket Request';

  return (
    <section className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* Step 3 Top Action Bar */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-bold text-[#213D77] bg-white hover:bg-slate-50 border border-slate-300 rounded-md inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>{isTrain && hasTrainResults ? t.backToTrains : t.backToSearch}</span>
        </button>

        <span className="hidden sm:inline text-xs font-semibold text-slate-500">
          Step 3 of 4 · Passenger &amp; Payment Details
        </span>

        <button
          type="button"
          onClick={onExitHome}
          className="min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
        >
          <Home className="w-3.5 h-3.5 shrink-0" />
          <span>{t.exitHome}</span>
        </button>
      </div>

      {/* Booking Form Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {/* Selected Journey Header */}
        <div className="bg-[#213D77] text-white px-4 sm:px-6 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[11px] font-semibold text-[#FB792B]">
              Step 3 of 4 · {serviceBadgeText}
            </div>
            {context.isAdvanceOpeningPriority && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-200 bg-white/10 border border-amber-300/40 px-2 py-0.5 rounded">
                <CalendarClock className="w-3.5 h-3.5 text-[#FB792B]" />
                <span>[ADVANCE OPENING PRIORITY]</span>
              </span>
            )}
          </div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight mt-0.5">
            {isTrain
              ? context.trainNumber === 'CUSTOM'
                ? context.trainName
                : `${context.trainNumber} · ${context.trainName}`
              : context.trainName}
          </h1>
          <p className="text-xs text-white/90 mt-1">
            {context.fromLabel} → {context.toLabel} · {formatReadableDate(context.journeyDate)} ·{' '}
            <span className="font-mono font-semibold">{context.travelClass}</span>
            {isTrain ? ` · ${context.quota}` : ''}
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit('whatsapp');
          }}
          className="p-4 sm:p-6 space-y-5"
        >
          {/* One-Click Repeat Passenger Auto-Fill Bar (Local Storage) */}
          {savedProfile && (
            <div className="p-3 sm:p-3.5 bg-[#F4F7FC] border border-[#213D77]/25 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                <UserCheck className="w-4 h-4 text-[#213D77] shrink-0 mt-0.5 sm:mt-0" />
                <div className="text-xs text-slate-700 leading-snug">
                  <span className="font-bold text-[#213D77]">Saved Traveler Found: </span>
                  <span className="font-semibold text-slate-900">
                    {savedProfile.passengers[0].name}
                    {savedProfile.passengers.length > 1
                      ? ` (+${savedProfile.passengers.length - 1} more)`
                      : ''}
                  </span>
                  {savedProfile.mobile && (
                    <span className="font-mono text-slate-600">
                      {' '}
                      · +91 {savedProfile.mobile}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleAutoFillSavedPassenger}
                  className="min-h-[38px] px-3.5 py-1.5 bg-[#213D77] hover:bg-[#182D59] text-white text-xs font-bold rounded-md inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#FB792B]" />
                  <span>
                    {autoFilledNotice ? 'Details Auto-Filled!' : 'Auto-Fill Saved Passenger'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleForgetSavedPassenger}
                  className="text-[11px] font-medium text-slate-500 hover:text-red-700 underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* 1. Passenger Details Section */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm font-bold text-[#213D77]">
                  1. Passenger Details (As per Government Photo ID)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add up to 6 passengers. ID Proof Type is optional for Tatkal / Flight readiness.
                </p>
              </div>
              {passengers.length < 6 && (
                <button
                  type="button"
                  onClick={addPassenger}
                  className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#213D77] bg-[#F4F7FC] hover:bg-[#213D77] hover:text-white border border-[#213D77]/25 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Passenger</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {passengers.map((passenger, index) => (
                <div
                  key={passenger.id}
                  className="p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-md"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">
                      Passenger {index + 1}
                    </span>
                    {passengers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePassenger(passenger.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:text-red-800 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-12 gap-2.5 sm:gap-3">
                    <div className="col-span-2 sm:col-span-5">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={passenger.name}
                        onChange={(e) => updatePassenger(passenger.id, 'name', e.target.value)}
                        placeholder="e.g., Rajesh Sharma"
                        className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Age *
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={120}
                        value={passenger.age}
                        onChange={(e) => updatePassenger(passenger.id, 'age', e.target.value)}
                        placeholder="34"
                        className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Gender *
                      </label>
                      <select
                        value={passenger.gender}
                        onChange={(e) =>
                          updatePassenger(passenger.id, 'gender', e.target.value as GenderType)
                        }
                        className="w-full h-10 px-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Transgender">Transgender</option>
                      </select>
                    </div>

                    <div className="col-span-2 sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {t.idProofLabel}
                      </label>
                      <select
                        value={passenger.idProofType}
                        onChange={(e) =>
                          updatePassenger(
                            passenger.id,
                            'idProofType',
                            e.target.value as IdProofType
                          )
                        }
                        className="w-full h-10 px-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                      >
                        {ID_PROOF_OPTIONS.map((opt) => (
                          <option key={opt.label} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {isTrain && (
                      <div className="col-span-2 sm:col-span-4">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Berth Preference
                        </label>
                        <select
                          value={passenger.berthPreference}
                          onChange={(e) =>
                            updatePassenger(
                              passenger.id,
                              'berthPreference',
                              e.target.value as BerthPreference
                            )
                          }
                          className="w-full h-10 px-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                        >
                          {BERTH_PREFERENCES.map((pref) => (
                            <option key={pref} value={pref}>
                              {pref}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Smart Flexibility Checkboxes (Train Bookings) */}
            {isTrain && (
              <div className="mt-3.5 p-3.5 bg-white border border-slate-200 rounded-md space-y-2.5">
                <div className="text-xs font-bold text-[#213D77]">{t.flexibilityTitle}</div>
                <label className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowAlternateTrain}
                    onChange={(e) => setAllowAlternateTrain(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#213D77] rounded cursor-pointer"
                  />
                  <span>{t.allowAlternateTrainLabel}</span>
                </label>
                <label className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowClassUpgrade}
                    onChange={(e) => setAllowClassUpgrade(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#213D77] rounded cursor-pointer"
                  />
                  <span>{t.allowClassUpgradeLabel}</span>
                </label>
              </div>
            )}
          </div>

          {/* 2. Contact & Boarding Details */}
          <div className="pt-4 border-t border-slate-200">
            <h2 className="text-sm font-bold text-[#213D77] mb-3">
              2. Contact &amp; Boarding Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Mobile Number (WhatsApp) *
                </label>
                <div className="flex items-center">
                  <span className="h-10 px-3 inline-flex items-center text-xs font-mono font-semibold text-slate-600 bg-slate-100 border border-r-0 border-slate-300 rounded-l-md">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit WhatsApp number"
                    className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-r-md focus:outline-none focus:border-[#213D77]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alternate Phone (Optional)
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={alternatePhone}
                  onChange={(e) =>
                    setAlternatePhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                  }
                  placeholder="Secondary contact number"
                  className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address (Optional — for ticket PDF copy)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@example.com"
                  className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isTrain ? 'Boarding Station *' : 'Boarding Airport / Pickup City *'}
                </label>
                <input
                  type="text"
                  required
                  value={boardingStation}
                  onChange={(e) => setBoardingStation(e.target.value)}
                  placeholder={isTrain ? 'Station name & code' : 'Departure city / point'}
                  className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                />
              </div>
            </div>

            {/* Customer Referral Discount Box (₹50 Off Service Charge) */}
            <div className="mt-4 p-3.5 bg-amber-50/70 border border-amber-200 rounded-md space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="referred-by-input"
                  className="text-xs font-bold text-[#213D77] inline-flex items-center gap-1.5"
                >
                  <Gift className="w-4 h-4 text-[#FB792B] shrink-0" />
                  <span>
                    Referred By (Friend&apos;s Name or Mobile — Get ₹50 Off Service Charge on Next
                    Booking)
                  </span>
                </label>
              </div>

              <input
                id="referred-by-input"
                type="text"
                maxLength={100}
                value={referredBy}
                onChange={(e) => setReferredBy(e.target.value)}
                placeholder="Optional — e.g., Suresh Bhai / 9820XXXXXX"
                className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <p className="text-[11px] sm:text-xs text-slate-600 leading-snug">
                  Share this SKY TRACK portal link with friends, family &amp; co-workers — both you
                  and your friend save ₹50 on agency service charges.
                </p>
                <button
                  type="button"
                  onClick={handleCopyPortalLink}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#213D77] bg-white hover:bg-[#213D77] hover:text-white border border-slate-300 rounded transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Share2 className="w-3 h-3" />
                  <span>{copiedShareLink ? 'Portal Link Copied!' : 'Copy Share Link'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Advance Booking Option (Optional) — Choice A & Choice B */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div>
              <h2 className="text-sm font-bold text-[#213D77]">
                3. {t.advanceSectionTitle}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">{t.advanceSectionSub}</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* Choice A: Optional Advance Token */}
              <div
                className={`p-3.5 sm:p-4 rounded-md border transition-colors ${
                  advanceChoice === 'advance-token'
                    ? 'bg-[#F4F7FC] border-[#213D77]'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="advancePaymentChoice"
                    value="advance-token"
                    checked={advanceChoice === 'advance-token'}
                    onChange={() => setAdvanceChoice('advance-token')}
                    className="mt-1 w-4 h-4 accent-[#213D77] cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[#213D77]">{t.choiceATitle}</span>
                      <span className="font-mono text-sm font-extrabold text-[#FB792B] tabular-nums">
                        {formatInrAmount(totalAdvanceToken)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{t.choiceADesc}</p>
                    <div className="text-xs font-mono text-[#213D77] mt-1.5 tabular-nums">
                      Calculated Token: {passengers.length}{' '}
                      {passengers.length === 1 ? 'Passenger' : 'Passengers'} ×{' '}
                      {formatInrAmount(tokenMeta.perPassenger)} ({tokenMeta.categoryLabel}) ={' '}
                      <strong>{formatInrAmount(totalAdvanceToken)}</strong>
                    </div>
                  </div>
                </label>

                {advanceChoice === 'advance-token' && (
                  <div className="mt-3.5 pt-3.5 border-t border-[#213D77]/15 grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
                    {/* Official Uploaded PhonePe Business QR + Merchant & UPI Details */}
                    <div className="sm:col-span-5 flex flex-col items-center">
                      <div className="w-full max-w-[230px] bg-white border border-slate-200 rounded-lg p-2.5 shadow-xs">
                        <img
                          src={AGENCY_CONTACT.upiQrImagePath}
                          alt="PhonePe Business QR Code for Sky Track (Q210984848@ybl)"
                          className="w-full h-auto object-contain rounded"
                        />
                      </div>

                      <div className="w-full max-w-[230px] mt-2.5 p-2.5 bg-white border border-slate-200 rounded-md space-y-1.5 text-center">
                        <div className="text-xs text-slate-600">
                          Merchant Name:{' '}
                          <strong className="text-[#213D77] font-bold">
                            {AGENCY_CONTACT.merchantName}
                          </strong>
                        </div>
                        <div className="text-xs text-slate-600">
                          Official UPI ID:{' '}
                          <strong className="font-mono text-[#213D77] font-bold select-all">
                            {AGENCY_CONTACT.upiId}
                          </strong>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyUpiId}
                          className="w-full min-h-[34px] px-2.5 py-1 bg-[#F4F7FC] hover:bg-[#213D77] text-[#213D77] hover:text-white border border-[#213D77]/25 rounded text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {copiedUpiId ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>UPI ID Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy UPI ID</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Direct Mobile UPI Deep-Link Pay Button & UTR Reference Input */}
                    <div className="sm:col-span-7 space-y-3.5">
                      <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2.5">
                        <div className="text-xs font-bold text-[#213D77]">
                          Paying on Mobile? Tap Directly to Open Your UPI App
                        </div>
                        <a
                          href={upiDeepLink}
                          className="w-full min-h-[44px] px-4 py-2.5 bg-[#FB792B] hover:bg-[#E06319] text-white text-xs sm:text-sm font-bold rounded-md inline-flex items-center justify-center gap-2 transition-colors text-center"
                        >
                          <Smartphone className="w-4 h-4 shrink-0" />
                          <span>
                            Pay {formatInrAmount(totalAdvanceToken)} via PhonePe / GPay / UPI App
                          </span>
                        </a>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          Automatically pre-fills{' '}
                          <strong className="font-mono text-slate-800">
                            {formatInrAmount(totalAdvanceToken)}
                          </strong>{' '}
                          to <strong className="text-slate-800">{AGENCY_CONTACT.merchantName}</strong>{' '}
                          (<span className="font-mono">{AGENCY_CONTACT.upiId}</span>) in PhonePe,
                          Google Pay, Paytm, or BHIM UPI.
                        </p>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {t.choiceABalanceNote}
                      </p>

                      {/* 3 Flexible Payment Proof Options — Complete ANY ONE */}
                      <div className="p-3 sm:p-3.5 bg-white border border-slate-200 rounded-md space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                          <span className="text-xs font-extrabold text-[#213D77]">
                            Submit Payment Proof (Complete ANY ONE Option Below) *
                          </span>
                          {hasAnyValidProof ? (
                            <span className="text-[11px] font-bold text-emerald-700 inline-flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Proof Option Ready</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-red-700">
                              Required to Submit
                            </span>
                          )}
                        </div>

                        {/* Option 1 (Easiest): Upload Payment Screenshot (JPG / PNG) */}
                        <div
                          className={`p-2.5 rounded-md border transition-colors ${
                            hasScreenshot
                              ? 'bg-emerald-50/60 border-emerald-400'
                              : 'bg-slate-50/70 border-slate-200'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[#213D77]">
                              Option 1 (Easiest): Upload Payment Screenshot (JPG / PNG)
                            </span>
                            {hasScreenshot && (
                              <button
                                type="button"
                                onClick={handleClearScreenshot}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 hover:text-red-900 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>

                          {!hasScreenshot ? (
                            <label className="mt-2 min-h-[42px] px-3 py-2 bg-white hover:bg-[#F4F7FC] border border-dashed border-[#213D77]/45 rounded-md flex items-center justify-center gap-2 text-xs font-bold text-[#213D77] cursor-pointer transition-colors">
                              <ImagePlus className="w-4 h-4 text-[#FB792B] shrink-0" />
                              <span>Tap to Attach PhonePe / GPay Screenshot</span>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                                onChange={handleScreenshotFileChange}
                                className="sr-only"
                              />
                            </label>
                          ) : (
                            <div className="mt-2 flex items-center gap-3">
                              <img
                                src={screenshotDataUrl}
                                alt="Uploaded payment screenshot preview"
                                className="w-16 h-16 object-cover rounded border border-emerald-300 bg-white shrink-0"
                              />
                              <div className="min-w-0 text-xs">
                                <div className="font-bold text-emerald-800">
                                  Screenshot Attached
                                </div>
                                <div className="text-[11px] text-slate-600 truncate">
                                  {screenshotFileName}
                                </div>
                              </div>
                            </div>
                          )}

                          {screenshotError && (
                            <p role="alert" className="mt-1.5 text-[11px] font-semibold text-red-700">
                              {screenshotError}
                            </p>
                          )}
                        </div>

                        {/* Option 2: Enter 12-Digit UTR / Transaction ID */}
                        <div
                          className={`p-2.5 rounded-md border transition-colors ${
                            isUtrValid
                              ? 'bg-emerald-50/60 border-emerald-400'
                              : 'bg-slate-50/70 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <label
                              htmlFor="optional-utr-input"
                              className="block text-xs font-bold text-[#213D77]"
                            >
                              Option 2: Enter 12-Digit UTR / Transaction ID
                            </label>
                            <span
                              className={`font-mono text-[11px] font-bold tabular-nums ${
                                isUtrValid
                                  ? 'text-emerald-700'
                                  : cleanedUtr.length > 0
                                  ? 'text-amber-700'
                                  : 'text-slate-500'
                              }`}
                            >
                              {cleanedUtr.length}/12 digits
                            </span>
                          </div>
                          <input
                            id="optional-utr-input"
                            type="text"
                            inputMode="numeric"
                            maxLength={12}
                            value={cleanedUtr}
                            onChange={(e) =>
                              setPaymentReference(e.target.value.replace(/\D/g, '').slice(0, 12))
                            }
                            placeholder="12-digit numeric UTR (e.g., 412345678901)"
                            className={`w-full h-10 px-3 text-sm font-mono tabular-nums bg-white border rounded-md focus:outline-none ${
                              isUtrValid
                                ? 'border-emerald-600 focus:border-emerald-700'
                                : 'border-slate-300 focus:border-[#213D77]'
                            }`}
                          />
                        </div>

                        {/* Option 3: Direct WhatsApp Proof Checkbox */}
                        <label
                          className={`p-2.5 rounded-md border flex items-start gap-2.5 cursor-pointer transition-colors ${
                            willShareProofOnWhatsApp
                              ? 'bg-emerald-50/60 border-emerald-400'
                              : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={willShareProofOnWhatsApp}
                            onChange={(e) => setWillShareProofOnWhatsApp(e.target.checked)}
                            className="mt-0.5 w-4 h-4 accent-[#213D77] rounded cursor-pointer shrink-0"
                          />
                          <div className="text-xs leading-snug">
                            <span className="font-bold text-[#213D77]">
                              Option 3 (Direct WhatsApp Proof):{' '}
                            </span>
                            <span className="text-slate-800 font-medium">
                              I have paid — I will attach the payment screenshot directly in
                              WhatsApp chat
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Choice B: Skip Advance & Pay After Agent Confirmation */}
              <div
                className={`p-3.5 sm:p-4 rounded-md border transition-colors ${
                  advanceChoice === 'pay-after-confirmation'
                    ? 'bg-[#F4F7FC] border-[#213D77]'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="advancePaymentChoice"
                    value="pay-after-confirmation"
                    checked={advanceChoice === 'pay-after-confirmation'}
                    onChange={() => setAdvanceChoice('pay-after-confirmation')}
                    className="mt-1 w-4 h-4 accent-[#213D77] cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[#213D77]">{t.choiceBTitle}</span>
                      <span className="font-mono text-xs font-bold text-emerald-800">
                        ₹0 Upfront
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{t.choiceBDesc}</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Confirmation Note */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-start gap-2 text-xs text-slate-700">
              <ShieldCheck className="w-4 h-4 text-[#213D77] shrink-0 mt-0.5" />
              <span>
                Note: Exact ticket fare will be confirmed by our agent after checking live availability. You can pay via PhonePe / UPI or Cash after agent confirmation.
              </span>
            </div>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-red-200 rounded-md text-xs sm:text-sm font-medium text-red-800"
            >
              {errorMessage}
            </div>
          )}

          {isAdvanceBlocked && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-red-300 rounded-md flex items-start gap-2 text-xs font-semibold text-red-800"
            >
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>
                Please complete at least ONE payment proof option above (Upload Payment Screenshot,
                enter 12-digit UTR, or check the WhatsApp screenshot option) to proceed, or select
                &apos;Skip Advance &amp; Pay on Call/Cash&apos;.
              </span>
            </div>
          )}

          {/* Two Prominent Direct Delivery Submit Buttons */}
          <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              disabled={submittingChannel !== null || isAdvanceBlocked}
              onClick={() => handleSubmit('whatsapp')}
              className="h-12 px-5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed text-white text-sm font-bold rounded-md inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>
                {submittingChannel === 'whatsapp'
                  ? 'Preparing WhatsApp...'
                  : t.sendWhatsAppBtn}
              </span>
            </button>

            <button
              type="button"
              disabled={submittingChannel !== null || isAdvanceBlocked}
              onClick={() => handleSubmit('email')}
              className="h-12 px-5 bg-[#FB792B] hover:bg-[#E06319] disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed text-white text-sm font-bold rounded-md inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Mail className="w-4 h-4 shrink-0" />
              <span>
                {submittingChannel === 'email' ? 'Creating Request Slip...' : t.sendEmailBtn}
              </span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

interface ConfirmationReceiptScreenProps {
  record: BookingRequestRecord;
  language: LanguageCode;
  onBookAnotherHome: () => void;
  onTrackRequest: (mobile: string) => void;
}

export function ConfirmationReceiptScreen({
  record,
  language,
  onBookAnotherHome,
  onTrackRequest,
}: ConfirmationReceiptScreenProps) {
  const t = TRANSLATIONS[language];
  const [copiedSlip, setCopiedSlip] = useState(false);
  const isTrain = !record.serviceType || record.serviceType === 'train';

  async function handleCopySlip() {
    try {
      await navigator.clipboard.writeText(buildRequestMessageText(record));
      setCopiedSlip(true);
      setTimeout(() => setCopiedSlip(false), 2500);
    } catch {
      setCopiedSlip(false);
    }
  }

  return (
    <section className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* Step 4 Top Bar */}
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-emerald-800 inline-flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>Step 4 of 4 · Confirmation Receipt Ready</span>
        </span>

        <button
          type="button"
          onClick={onBookAnotherHome}
          className="min-h-[40px] px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#213D77] hover:bg-[#182D59] rounded-md inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
        >
          <Home className="w-4 h-4 shrink-0" />
          <span>{t.bookAnotherHome}</span>
        </button>
      </div>

      {/* Confirmation Slip Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[#213D77] text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              Booking Request Slip — Registered
            </h1>
            <p className="text-xs text-white/85 mt-0.5">
              Screenshot or save this receipt. Our Zaveri Bazar agent will verify live availability and confirm your exact fare.
            </p>
          </div>
          <div className="bg-white/10 border border-white/25 rounded-md px-3.5 py-1.5 text-right">
            <div className="text-[10px] font-medium text-white/80">Reference ID</div>
            <div className="font-mono text-sm sm:text-base font-bold text-white tabular-nums">
              {record.referenceId}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {/* Structured Official Printable Slip */}
          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <div className="font-extrabold text-[#213D77]">
                  SKY TRACK · MSME Udyam Registered Travel Agency
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  {AGENCY_CONTACT.fullAddress}
                </div>
              </div>
              <div className="font-mono text-slate-700 sm:text-right">
                <div className="font-bold text-[#213D77]">
                  {AGENCY_CONTACT.primaryPhoneDisplay} / {AGENCY_CONTACT.secondaryPhoneDisplay}
                </div>
                <div className="text-[11px] text-slate-600">{AGENCY_CONTACT.email}</div>
              </div>
            </div>

            {record.isAdvanceOpeningPriority && (
              <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-xs font-bold text-amber-950 flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-[#FB792B] shrink-0" />
                <span>
                  [ADVANCE OPENING PRIORITY] — Festival / 60-Day Advance Opening Pre-Booking
                </span>
              </div>
            )}

            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm border-b border-slate-100">
              <div>
                <div className="text-xs text-slate-500">
                  {isTrain ? 'Train' : 'Service Details'}
                </div>
                <div className="font-semibold text-slate-900 mt-0.5">
                  {isTrain
                    ? record.trainNumber === 'CUSTOM'
                      ? record.trainName
                      : `${record.trainNumber} — ${record.trainName}`
                    : record.trainName}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">
                  Journey Date · Class{isTrain ? ' · Quota' : ''}
                </div>
                <div className="font-semibold text-slate-900 mt-0.5">
                  {formatReadableDate(record.journeyDate)}
                  {record.returnDate
                    ? ` (Return: ${formatReadableDate(record.returnDate)})`
                    : ''}{' '}
                  · <span className="font-mono">{record.travelClass}</span>
                  {isTrain ? ` · ${record.quota}` : ''}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Route</div>
                <div className="font-semibold text-slate-900 mt-0.5">
                  {record.fromStation} → {record.toStation}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">
                  {isTrain ? 'Boarding Station' : 'Boarding Point / Preferences'}
                </div>
                <div className="font-semibold text-slate-900 mt-0.5">
                  {record.boardingStation}
                  {record.extraPreferences ? ` · ${record.extraPreferences}` : ''}
                </div>
              </div>
            </div>

            {(record.allowAlternateTrain || record.allowClassUpgrade) && (
              <div className="px-4 py-2.5 bg-[#F4F7FC] border-b border-slate-100 text-xs text-[#213D77]">
                <strong>Agent Instructions: </strong>
                {[
                  record.allowAlternateTrain ? 'Alternate train on same route allowed' : null,
                  record.allowClassUpgrade
                    ? 'Class upgrade allowed if preferred class is unavailable'
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            )}

            <div className="p-4 border-b border-slate-100">
              <div className="text-xs font-semibold text-slate-500 mb-2">
                Passenger List ({record.passengers.length})
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-500">
                      <th className="py-1.5 pr-3 font-medium">#</th>
                      <th className="py-1.5 pr-3 font-medium">Passenger Name</th>
                      <th className="py-1.5 pr-3 font-medium">Age</th>
                      <th className="py-1.5 pr-3 font-medium">Gender</th>
                      {isTrain && <th className="py-1.5 pr-3 font-medium">Berth</th>}
                      <th className="py-1.5 font-medium">ID Proof</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {record.passengers.map((p, i) => (
                      <tr key={`${p.name}-${i}`}>
                        <td className="py-2 pr-3 font-mono text-xs text-slate-500 tabular-nums">
                          {i + 1}
                        </td>
                        <td className="py-2 pr-3 font-semibold text-slate-900">{p.name}</td>
                        <td className="py-2 pr-3 font-mono tabular-nums text-slate-700">
                          {p.age}
                        </td>
                        <td className="py-2 pr-3 text-slate-700">{p.gender}</td>
                        {isTrain && (
                          <td className="py-2 pr-3 text-slate-700">{p.berthPreference}</td>
                        )}
                        <td className="py-2 text-slate-600">{p.idProofType || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-slate-50/70 space-y-3 text-xs text-slate-700">
              {/* Prominent PENDING AGENT VERIFICATION Badge (NEVER displays "Paid") */}
              <div className="p-2.5 bg-amber-100 border border-amber-400 rounded-md flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span className="font-extrabold text-amber-950 leading-snug">
                  PAYMENT STATUS: PENDING AGENT VERIFICATION (Not a final payment receipt until
                  verified in bank)
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-slate-500">Payment Option: </span>
                  <strong className="text-[#213D77]">
                    {record.advancePaymentChoice === 'advance-token' &&
                    record.advanceTokenAmount
                      ? `Optional Advance Token (${formatInrAmount(record.advanceTokenAmount)})`
                      : 'Pay on Call / Cash (₹0 Advance Paid)'}
                  </strong>
                </div>
                <span className="font-semibold text-[#213D77]">
                  Request Status: Pending Agent Verification
                </span>
              </div>

              {record.advancePaymentChoice === 'advance-token' && (
                <div>
                  <span className="text-slate-500">Payment Proof: </span>
                  <strong className="text-amber-950">{describePaymentProof(record)}</strong>
                </div>
              )}

              {record.referredBy && (
                <div className="text-emerald-800 font-semibold flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-[#FB792B] shrink-0" />
                  <span>
                    Referred By: {record.referredBy} (Eligible for ₹50 Off Service Charge)
                  </span>
                </div>
              )}

              <div>
                <span className="text-slate-500">WhatsApp Mobile: </span>
                <strong className="font-mono text-slate-900">+91 {record.mobile}</strong>
                {record.email && (
                  <>
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="text-slate-500">Email: </span>
                    <strong className="text-slate-900">{record.email}</strong>
                  </>
                )}
              </div>

              {/* Mandatory Acknowledgment-Only Disclaimer */}
              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-[11px] sm:text-xs font-semibold text-red-900 leading-relaxed">
                Note: This slip is only a Booking Request Acknowledgment, NOT a payment receipt.
                Advance payment is valid only after Sky Track verifies the UTR / screenshot in our
                bank statement.
              </div>
            </div>
          </div>

          {/* Primary Official Receipt Download + Action Buttons */}
          <div className="no-print space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => downloadOfficialRequestReceipt(record)}
                className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 bg-[#213D77] hover:bg-[#182D59] text-white text-xs sm:text-sm font-bold rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#FB792B]" />
                <span>Download Official Request Receipt</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-800 hover:bg-slate-50 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Slip</span>
              </button>

              <a
                href={buildWhatsAppUrl(record)}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Open WhatsApp</span>
              </a>

              <a
                href={buildMailtoUrl(record)}
                className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 border border-[#213D77] text-[#213D77] hover:bg-[#F4F7FC] text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap"
              >
                <Mail className="w-4 h-4" />
                <span>Open Email App</span>
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCopySlip}
                className="min-h-[40px] inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedSlip ? 'Copied Details' : 'Copy Request Text'}</span>
              </button>

              <button
                type="button"
                onClick={() => onTrackRequest(record.mobile)}
                className="min-h-[40px] inline-flex items-center gap-2 px-4 py-2 bg-[#FB792B] hover:bg-[#E06319] text-white text-xs font-bold rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                <span>Track / Download Ticket PDF</span>
              </button>

              <button
                type="button"
                onClick={onBookAnotherHome}
                className="min-h-[40px] sm:ml-auto inline-flex items-center gap-2 px-4 py-2 border border-[#213D77] text-[#213D77] hover:bg-[#F4F7FC] text-xs font-bold rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>{t.bookAnotherHome}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
