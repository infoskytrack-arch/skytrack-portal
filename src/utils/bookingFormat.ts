import { AGENCY_CONTACT, type BookingRequestRecord, type ServiceType } from '../types';

export function formatReadableDate(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return isoDate;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getTomorrowIsoDate(): string {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getFutureIsoDate(daysAhead: number): string {
  const now = new Date();
  now.setDate(now.getDate() + daysAhead);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const AC_TRAIN_CLASSES = new Set(['1A', '2A', '3A', '3E', 'CC']);

export function getPerPassengerAdvanceToken(
  serviceType: ServiceType,
  travelClass: string
): { perPassenger: number; categoryLabel: string } {
  if (serviceType === 'flight') {
    return { perPassenger: 2000, categoryLabel: 'Flight Priority Token' };
  }
  if (serviceType === 'bus') {
    const isNonAc = travelClass.toLowerCase().includes('non-ac');
    return isNonAc
      ? { perPassenger: 1000, categoryLabel: 'Non-AC Bus Token' }
      : { perPassenger: 2000, categoryLabel: 'AC Bus Token' };
  }
  // Train classes: ₹2,000 for AC (1A, 2A, 3A, 3E, CC), ₹1,000 for Sleeper / 2S
  if (AC_TRAIN_CLASSES.has(travelClass.toUpperCase())) {
    return { perPassenger: 2000, categoryLabel: 'AC Class Token' };
  }
  return { perPassenger: 1000, categoryLabel: 'Sleeper / 2S Token' };
}

export function formatInrAmount(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function buildUpiPayloadWithAmount(amount?: number): string {
  const pa = AGENCY_CONTACT.upiId;
  const pn = encodeURIComponent(AGENCY_CONTACT.merchantName);
  if (amount && amount > 0) {
    return `upi://pay?pa=${pa}&pn=${pn}&am=${amount}&cu=INR`;
  }
  return `upi://pay?pa=${pa}&pn=${pn}&cu=INR`;
}

export function describePaymentProof(req: BookingRequestRecord): string {
  if (req.advancePaymentChoice !== 'advance-token') {
    return 'Pay on Call / Cash (₹0 Advance Paid)';
  }
  if (req.paymentProofMethod === 'screenshot' || req.hasPaymentScreenshot) {
    return req.paymentReference
      ? `Screenshot Uploaded on Portal (UTR: ${req.paymentReference})`
      : 'Screenshot Uploaded on Portal';
  }
  if (req.paymentProofMethod === 'utr' || req.paymentReference) {
    return `UTR ${req.paymentReference}`;
  }
  return 'Customer will attach screenshot in this WhatsApp chat — Verify PhonePe Business before booking';
}

export function buildRequestMessageText(req: BookingRequestRecord): string {
  const service = req.serviceType || 'train';
  const baseHeading =
    service === 'flight'
      ? 'SKY TRACK — FLIGHT TICKET BOOKING REQUEST'
      : service === 'bus'
      ? 'SKY TRACK — BUS TICKET BOOKING REQUEST'
      : 'SKY TRACK — RAILWAY BOOKING REQUEST';

  const serviceHeading = req.isAdvanceOpeningPriority
    ? `*[ADVANCE OPENING PRIORITY] ${baseHeading}*`
    : `*${baseHeading}*`;

  const passengerLines = req.passengers
    .map((p, idx) => {
      const idStr = p.idProofType ? ` | ID: ${p.idProofType}` : '';
      const seatStr = service === 'train' ? ` | Berth: ${p.berthPreference}` : '';
      return `${idx + 1}. ${p.name} | Age: ${p.age} | ${p.gender}${seatStr}${idStr}`;
    })
    .join('\n');

  const flexibilityFlags: string[] = [];
  if (req.allowAlternateTrain) {
    flexibilityFlags.push('Allow Alternate Train on same route if seats are full');
  }
  if (req.allowClassUpgrade) {
    flexibilityFlags.push('Allow Class Upgrade (e.g., SL to 3A) if preferred class is unavailable');
  }

  const paymentLines =
    req.advancePaymentChoice === 'advance-token' && req.advanceTokenAmount
      ? [
          `Payment Option: Optional Advance Token (${formatInrAmount(req.advanceTokenAmount)})`,
          `Payment Proof: ${describePaymentProof(req)}`,
          `Payment Status: PENDING AGENT VERIFICATION (Not a final payment receipt until verified in bank)`,
        ]
      : ['Payment Option: Pay on Call / Cash (₹0 Advance Paid)'];

  const lines = [
    serviceHeading,
    req.isAdvanceOpeningPriority
      ? 'Priority Tag: [ADVANCE OPENING PRIORITY] (Festival / 60-Day Advance Opening Pre-Booking)'
      : null,
    `Reference ID: ${req.referenceId}`,
    `--------------------------------`,
    `Route: ${req.fromStation} -> ${req.toStation}`,
    service === 'train' ? `Boarding Station: ${req.boardingStation}` : `Boarding Point: ${req.boardingStation}`,
    `Journey Date: ${formatReadableDate(req.journeyDate)} (${req.journeyDate})`,
    req.returnDate ? `Return Date: ${formatReadableDate(req.returnDate)} (${req.returnDate})` : null,
    service === 'train'
      ? `Train: ${req.trainNumber === 'CUSTOM' ? 'Any Best Available Train' : `${req.trainNumber} - ${req.trainName}`}`
      : `Service: ${req.trainName}`,
    service === 'train'
      ? `Class: ${req.travelClass} | Quota: ${req.quota}`
      : `Preference / Class: ${req.travelClass}`,
    req.extraPreferences ? `Additional Preferences: ${req.extraPreferences}` : null,
    flexibilityFlags.length > 0 ? `Flexibility: ${flexibilityFlags.join(' ; ')}` : null,
    `--------------------------------`,
    `Passengers (${req.passengers.length}):`,
    passengerLines,
    `--------------------------------`,
    ...paymentLines,
    req.referredBy
      ? `Referred By: ${req.referredBy} (Eligible for ₹50 Off Service Charge)`
      : null,
    `Customer Mobile (WhatsApp): +91 ${req.mobile}`,
    req.alternatePhone ? `Alternate Phone: +91 ${req.alternatePhone}` : null,
    req.email ? `Email: ${req.email}` : null,
    `--------------------------------`,
    `Please verify live availability and confirm the exact fare so we can proceed.`,
  ].filter(Boolean);

  return lines.join('\n');
}

export function buildWhatsAppUrl(req: BookingRequestRecord): string {
  const text = buildRequestMessageText(req);
  return `https://wa.me/${AGENCY_CONTACT.primaryPhoneRaw}?text=${encodeURIComponent(text)}`;
}

export function buildMailtoUrl(req: BookingRequestRecord): string {
  const service = (req.serviceType || 'train').toUpperCase();
  const priorityPrefix = req.isAdvanceOpeningPriority ? '[ADVANCE OPENING PRIORITY] ' : '';
  const subject = `${priorityPrefix}${service} Booking Request [${req.referenceId}] — ${req.fromStation} to ${req.toStation} (${req.journeyDate})`;
  const body = buildRequestMessageText(req).replace(/\*/g, '');
  return `mailto:${AGENCY_CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function launchSafeExternalLink(url: string): void {
  if (!url.startsWith('https://') && !url.startsWith('mailto:') && !url.startsWith('tel:')) {
    return;
  }
  const anchor = document.createElement('a');
  anchor.href = url;
  if (url.startsWith('https://')) {
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
  }
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
