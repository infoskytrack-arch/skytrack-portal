import {
  TRAVEL_CLASSES,
  type AvailabilityCategory,
  type ClassAvailabilityQuote,
  type QuotaType,
  type SelectableClassCode,
  type Station,
  type TrainSchedule,
} from '../types';

const EARTH_RADIUS_KM = 6371;
// Calibrated against Indian Railways trunk track circuity (HWH->CSMT 1,661km GC * 1.185 = 1,968km)
const INDIAN_RAIL_CIRCUITY_FACTOR = 1.185;

// Standard IRCTC fare ordering for display
export const CLASS_DISPLAY_ORDER: SelectableClassCode[] = [
  'SL',
  '3E',
  '3A',
  '2A',
  '1A',
  'CC',
  '2S',
];

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Calculates realistic Indian Railways track distance (km) between any two stations
 * using Haversine great-circle distance multiplied by Indian Railways track circuity.
 */
export function calculateRailwayDistanceKm(from: Station, to: Station): number {
  if (from.code === to.code) return 0;

  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightKm = EARTH_RADIUS_KM * c;

  return Math.max(45, Math.round(straightKm * INDIAN_RAIL_CIRCUITY_FACTOR));
}

function roundToNearest5(value: number): number {
  return Math.round(value / 5) * 5;
}

/**
 * Deterministic 32-bit FNV-1a hash so availability numbers stay stable
 * across clicks for the same train + class + date + quota combination.
 */
function deterministicSeed(key: string): number {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Computes calendar days between today's local date and the selected YYYY-MM-DD journey date.
 */
export function getDaysUntilJourney(journeyDate: string, now: Date = new Date()): number {
  const parts = journeyDate.split('-').map((n) => Number.parseInt(n, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return 1;
  }
  const [year, month, day] = parts;
  const targetMidnight = new Date(year, month - 1, day, 0, 0, 0, 0);
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const diffMs = targetMidnight.getTime() - todayMidnight.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function getTrainFareMultipliers(trainType: string): {
  isSuperfast: boolean;
  baseMultiplier: number;
} {
  const normalized = trainType.toLowerCase();
  if (normalized.includes('vande bharat')) {
    return { isSuperfast: true, baseMultiplier: 1.42 };
  }
  if (normalized.includes('rajdhani') || normalized.includes('duronto')) {
    return { isSuperfast: true, baseMultiplier: 1.15 };
  }
  if (normalized.includes('humsafar')) {
    return { isSuperfast: true, baseMultiplier: 1.07 };
  }
  if (normalized.includes('superfast') || normalized.includes('sf')) {
    return { isSuperfast: true, baseMultiplier: 1.0 };
  }
  // Mail / Express / Passenger
  return { isSuperfast: false, baseMultiplier: 0.98 };
}

/**
 * Exact IRCTC-calibrated distance-based fare engine.
 * At ~1,968 km (Superfast Express, GENERAL):
 *   SL  = ₹800
 *   3E  = ₹2,005
 *   3A  = ₹2,120
 *   2A  = ₹3,020
 *   1A  = ₹5,090
 */
export function calculateGeneralClassFare(
  distanceKm: number,
  classCode: SelectableClassCode,
  trainType: string
): number {
  const dist = Math.max(45, distanceKm);
  const { isSuperfast, baseMultiplier } = getTrainFareMultipliers(trainType);

  let rawBase = 0;
  let reservation = 0;
  let superfastCharge = 0;
  let gstRate = 0;

  switch (classCode) {
    case 'SL':
      rawBase = Math.max(145, 75 + dist * 0.343);
      reservation = 20;
      superfastCharge = isSuperfast ? 30 : 0;
      gstRate = 0;
      break;
    case '3E':
      rawBase = Math.max(410, 185 + dist * 0.833);
      reservation = 40;
      superfastCharge = isSuperfast ? 45 : 0;
      gstRate = 0.05;
      break;
    case '3A':
      rawBase = Math.max(455, 200 + dist * 0.881);
      reservation = 40;
      superfastCharge = isSuperfast ? 45 : 0;
      gstRate = 0.05;
      break;
    case '2A':
      rawBase = Math.max(650, 265 + dist * 1.2785);
      reservation = 50;
      superfastCharge = isSuperfast ? 45 : 0;
      gstRate = 0.05;
      break;
    case '1A':
      rawBase = Math.max(1120, 445 + dist * 2.1685);
      reservation = 60;
      superfastCharge = isSuperfast ? 75 : 0;
      gstRate = 0.05;
      break;
    case 'CC':
      rawBase = Math.max(290, 140 + dist * 0.94);
      reservation = 40;
      superfastCharge = isSuperfast ? 45 : 0;
      gstRate = 0.05;
      break;
    case '2S':
      rawBase = Math.max(60, 35 + dist * 0.255);
      reservation = 15;
      superfastCharge = isSuperfast ? 15 : 0;
      gstRate = 0;
      break;
  }

  const adjustedBase = rawBase * (classCode === 'SL' || classCode === '2S' ? 1 : baseMultiplier);
  const preTax = adjustedBase + reservation + superfastCharge;
  const total = preTax * (1 + gstRate);
  return roundToNearest5(total);
}

/**
 * Quota-specific surcharge:
 * - TATKAL: strictly ₹400 to ₹500 extra on top of General fare
 * - PREMIUM TATKAL: strictly ₹550 to ₹800 extra on top of General fare
 * - GENERAL / LADIES / SENIOR CITIZEN: ₹0 extra
 */
export function getQuotaSurcharge(
  classCode: SelectableClassCode,
  quota: QuotaType
): { amount: number; note?: string } {
  if (quota === 'TATKAL') {
    const map: Record<SelectableClassCode, number> = {
      SL: 400,
      '2S': 400,
      CC: 425,
      '3E': 450,
      '3A': 450,
      '2A': 500,
      '1A': 500,
    };
    const amount = map[classCode];
    return { amount, note: `Incl. ₹${amount} Tatkal` };
  }

  if (quota === 'PREMIUM TATKAL') {
    const map: Record<SelectableClassCode, number> = {
      SL: 550,
      '2S': 550,
      CC: 600,
      '3E': 650,
      '3A': 680,
      '2A': 750,
      '1A': 800,
    };
    const amount = map[classCode];
    return { amount, note: `Incl. ₹${amount} Prem. Tatkal` };
  }

  return { amount: 0 };
}

export function getClassFullName(code: SelectableClassCode): string {
  return TRAVEL_CLASSES.find((c) => c.code === code)?.label ?? code;
}

export function sortClassesForDisplay(classes: SelectableClassCode[]): SelectableClassCode[] {
  const set = new Set(classes);
  return CLASS_DISPLAY_ORDER.filter((c) => set.has(c));
}

/**
 * Computes quota-aware fare & seat availability for a single train + class.
 */
export function computeClassAvailabilityQuote(params: {
  trainNumber: string;
  trainType: string;
  classCode: SelectableClassCode;
  distanceKm: number;
  journeyDate: string;
  quota: QuotaType;
  now?: Date;
}): ClassAvailabilityQuote {
  const {
    trainNumber,
    trainType,
    classCode,
    distanceKm,
    journeyDate,
    quota,
    now = new Date(),
  } = params;

  const baseFare = calculateGeneralClassFare(distanceKm, classCode, trainType);
  const surcharge = getQuotaSurcharge(classCode, quota);
  const totalFare = baseFare + surcharge.amount;
  const classLabel = getClassFullName(classCode);
  const seed = deterministicSeed(`${trainNumber}|${classCode}|${journeyDate}|${quota}`);

  // RULE 1: SENIOR CITIZEN — Exact calculated fare, strictly NOT AVAILABLE & BOOK disabled
  if (quota === 'SENIOR CITIZEN') {
    return {
      classCode,
      classLabel,
      baseFare,
      quotaSurcharge: 0,
      totalFare,
      statusText: 'NOT AVAILABLE',
      statusCategory: 'NOT_AVAILABLE',
      isBookable: false,
    };
  }

  // RULE 2: TATKAL & PREMIUM TATKAL — Local device clock before/after 10:00 AM
  if (quota === 'TATKAL' || quota === 'PREMIUM TATKAL') {
    const currentHour = now.getHours();
    if (currentHour < 10) {
      // Before 10:00 AM (e.g. 12:00 AM midnight or early morning): green AVAILABLE 16..32
      const seats = 16 + (seed % 17);
      return {
        classCode,
        classLabel,
        baseFare,
        quotaSurcharge: surcharge.amount,
        totalFare,
        statusText: `AVAILABLE ${seats}`,
        statusCategory: 'AVAILABLE',
        isBookable: true,
        surchargeNote: surcharge.note,
      };
    }

    // At or after 10:00 AM: realistic Tatkal Waiting List TQWL 12 or TQWL 13
    const tqwl = 12 + (seed % 2);
    return {
      classCode,
      classLabel,
      baseFare,
      quotaSurcharge: surcharge.amount,
      totalFare,
      statusText: `TQWL ${tqwl}`,
      statusCategory: 'WL',
      isBookable: true,
      surchargeNote: surcharge.note,
    };
  }

  // RULE 3: GENERAL (and LADIES) — Based on days away from today
  const daysAway = getDaysUntilJourney(journeyDate, now);
  let statusText: string;
  let statusCategory: AvailabilityCategory;

  if (daysAway <= 7) {
    // 1–7 days from today: realistic WL / RAC statuses (e.g., WL 14, WL 28, RAC 5)
    const isRac = classCode !== '1A' && seed % 3 === 0;
    if (isRac) {
      const racNum = 3 + (seed % 12); // RAC 3..14
      statusText = `RAC ${racNum}`;
      statusCategory = 'RAC';
    } else {
      const wlNum =
        classCode === '1A'
          ? 2 + (seed % 7) // WL 2..8
          : classCode === '2A'
          ? 8 + (seed % 18) // WL 8..25
          : 11 + (seed % 28); // WL 11..38
      statusText = `WL ${wlNum}`;
      statusCategory = 'WL';
    }
  } else if (daysAway <= 14) {
    // 8–14 days away: transitional low AVAILABLE or light RAC/WL
    const bucket = seed % 3;
    if (bucket === 0) {
      const seats = classCode === '1A' ? 3 + (seed % 5) : 6 + (seed % 16);
      statusText = `AVAILABLE ${seats}`;
      statusCategory = 'AVAILABLE';
    } else if (bucket === 1 && classCode !== '1A') {
      const racNum = 2 + (seed % 9);
      statusText = `RAC ${racNum}`;
      statusCategory = 'RAC';
    } else {
      const wlNum = classCode === '1A' ? 1 + (seed % 4) : 4 + (seed % 10);
      statusText = `WL ${wlNum}`;
      statusCategory = 'WL';
    }
  } else {
    // 15–60+ days away: strictly green AVAILABLE seats (e.g., AVAILABLE 42, AVAILABLE 85)
    const farBoost = Math.min(24, Math.floor((daysAway - 15) / 3));
    let seats: number;
    switch (classCode) {
      case '1A':
        seats = 6 + (seed % 10) + Math.floor(farBoost / 4);
        break;
      case '2A':
        seats = 20 + (seed % 26) + Math.floor(farBoost / 2);
        break;
      case '3A':
      case '3E':
        seats = 36 + (seed % 42) + farBoost;
        break;
      case 'SL':
        seats = 54 + (seed % 56) + farBoost;
        break;
      case 'CC':
      case '2S':
        seats = 42 + (seed % 48) + farBoost;
        break;
    }
    statusText = `AVAILABLE ${seats}`;
    statusCategory = 'AVAILABLE';
  }

  return {
    classCode,
    classLabel,
    baseFare,
    quotaSurcharge: surcharge.amount,
    totalFare,
    statusText,
    statusCategory,
    isBookable: true,
    surchargeNote: surcharge.note,
  };
}

export function getTrainAvailabilityQuotes(
  train: TrainSchedule,
  from: Station,
  to: Station,
  journeyDate: string,
  quota: QuotaType,
  now: Date = new Date()
): { distanceKm: number; quotes: ClassAvailabilityQuote[] } {
  const distanceKm = train.distanceKm ?? calculateRailwayDistanceKm(from, to);
  const orderedClasses = sortClassesForDisplay(train.classes);
  const quotes = orderedClasses.map((classCode) =>
    computeClassAvailabilityQuote({
      trainNumber: train.trainNumber,
      trainType: train.trainType,
      classCode,
      distanceKm,
      journeyDate,
      quota,
      now,
    })
  );

  return { distanceKm, quotes };
}

export function formatDeviceClockTime(now: Date = new Date()): string {
  return now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDurationFromMinutes(totalMinutes: number): string {
  const safeMin = Math.max(45, Math.round(totalMinutes));
  const hours = Math.floor(safeMin / 60);
  const mins = safeMin % 60;
  return `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;
}

/**
 * Parses a local YYYY-MM-DD string safely without UTC timezone drift.
 */
export function parseLocalIsoDate(isoDate: string): Date {
  const parts = isoDate.split('-').map((n) => Number.parseInt(n, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return new Date();
  }
  return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
}

export function formatLocalIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDaysToIsoDate(isoDate: string, deltaDays: number): string {
  const base = parseLocalIsoDate(isoDate);
  base.setDate(base.getDate() + deltaDays);
  return formatLocalIsoDate(base);
}

/**
 * Formats YYYY-MM-DD as "Sun, 22 Nov" (IRCTC Beta style).
 */
export function formatIrctcShortDayDate(isoDate: string): string {
  const d = parseLocalIsoDate(isoDate);
  const weekday = d.toLocaleDateString('en-IN', { weekday: 'short' });
  const dayNum = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleDateString('en-IN', { month: 'short' });
  return `${weekday}, ${dayNum} ${month}`;
}

/**
 * Computes arrival day offset (+0, +1, +2, etc.) and arrival date string
 * from departureTime ("14:05") and duration ("31h 15m").
 */
export function computeArrivalMeta(
  journeyDate: string,
  departureTime: string,
  duration: string
): { dayOffset: number; arrivalDateLabel: string; departureDateLabel: string } {
  const departureDateLabel = formatIrctcShortDayDate(journeyDate);

  const depMatch = /^(\d{1,2}):(\d{2})$/.exec(departureTime.trim());
  const durMatch = /(\d+)\s*h\s*(\d+)?\s*m?/i.exec(duration);

  if (!depMatch || !durMatch) {
    return {
      dayOffset: 0,
      arrivalDateLabel: departureDateLabel,
      departureDateLabel,
    };
  }

  const depMinutes = Number.parseInt(depMatch[1], 10) * 60 + Number.parseInt(depMatch[2], 10);
  const durHours = Number.parseInt(durMatch[1], 10);
  const durMins = durMatch[2] ? Number.parseInt(durMatch[2], 10) : 0;
  const totalMinutes = depMinutes + durHours * 60 + durMins;
  const dayOffset = Math.floor(totalMinutes / 1440);

  const arrivalIso = addDaysToIsoDate(journeyDate, dayOffset);
  return {
    dayOffset,
    arrivalDateLabel: formatIrctcShortDayDate(arrivalIso),
    departureDateLabel,
  };
}

/**
 * Builds a 7-day strip of selectable dates around the active journeyDate,
 * never going earlier than today's local date.
 */
export function buildSevenDayDateStrip(
  selectedIsoDate: string,
  todayIso: string
): Array<{ iso: string; dayShort: string; dateShort: string }> {
  const todayDate = parseLocalIsoDate(todayIso);
  const selectedDate = parseLocalIsoDate(selectedIsoDate);
  const diffFromToday = Math.round(
    (selectedDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Anchor start date so selected date is visible cleanly inside the 7-day bar
  const startOffset = diffFromToday <= 3 ? 0 : diffFromToday - 2;

  const strip: Array<{ iso: string; dayShort: string; dateShort: string }> = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() + startOffset + i);
    const iso = formatLocalIsoDate(d);
    const dayShort = d.toLocaleDateString('en-IN', { weekday: 'short' });
    const dayNum = String(d.getDate()).padStart(2, '0');
    const monthShort = d.toLocaleDateString('en-IN', { month: 'short' });
    strip.push({
      iso,
      dayShort,
      dateShort: `${dayNum} ${monthShort}`,
    });
  }
  return strip;
}

