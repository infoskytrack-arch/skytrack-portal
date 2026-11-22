import { AGENCY_CONTACT, type BookingRequestRecord } from '../types';
import { describePaymentProof, formatInrAmount, formatReadableDate } from './bookingFormat';

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i += 1) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Generates a crisp, official SKY TRACK Booking Request Receipt PNG completely offline
 * using HTML5 Canvas (zero external APIs, safe inside iframes, mobile & desktop compatible).
 */
export function downloadOfficialRequestReceipt(record: BookingRequestRecord): void {
  const isTrain = !record.serviceType || record.serviceType === 'train';
  const width = 900;
  const passengerRowHeight = 36;
  const extraBannerHeight = record.isAdvanceOpeningPriority ? 46 : 0;
  const referralHeight = record.referredBy ? 34 : 0;
  const height =
    780 +
    record.passengers.length * passengerRowHeight +
    extraBannerHeight +
    referralHeight;

  const scale = 2; // 2x high-DPI crisp print quality
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.scale(scale, scale);

  // Page Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Outer Frame Border
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, width - 36, height - 36);

  // Top Official Header Band (#213D77)
  ctx.fillStyle = '#213D77';
  ctx.fillRect(18, 18, width - 36, 126);

  // Accent Orange Stripe (#FB792B)
  ctx.fillStyle = '#FB792B';
  ctx.fillRect(18, 144, width - 36, 6);

  // Brand Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 30px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('SKY TRACK', 44, 62);

  ctx.fillStyle = '#FB792B';
  ctx.font = '700 13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('YOUR JOURNEY, OUR PRIORITY  •  BOOKING REQUEST ACKNOWLEDGMENT SLIP', 44, 84);

  // Udyam Registered Agency Badge (Top-Left Sub-line)
  drawRoundedRect(ctx, 44, 98, 286, 28, 4);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('MSME UDYAM REGISTERED TRAVEL AGENCY', 56, 116);

  // Unique Request ID Box (Top-Right)
  drawRoundedRect(ctx, width - 274, 38, 230, 86, 6);
  ctx.fillStyle = '#182D59';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '600 11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('UNIQUE REQUEST ID', width - 256, 60);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 22px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
  ctx.fillText(record.referenceId, width - 256, 88);

  const issuedStamp = new Date(record.createdAt || Date.now()).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(`Logged: ${issuedStamp}`, width - 256, 110);

  // Agency Office Contact Strip
  let y = 166;
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(36, y, width - 72, 54);
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.strokeRect(36, y, width - 72, 54);

  ctx.fillStyle = '#213D77';
  ctx.font = '700 12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(`Office: ${AGENCY_CONTACT.fullAddress}`, 52, y + 22);

  ctx.fillStyle = '#334155';
  ctx.font = '600 12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
  ctx.fillText(
    `Call / WhatsApp: ${AGENCY_CONTACT.primaryPhoneDisplay} / ${AGENCY_CONTACT.secondaryPhoneDisplay}   |   Email: ${AGENCY_CONTACT.email}`,
    52,
    y + 42
  );

  y += 70;

  // Optional Advance Opening Priority Strip
  if (record.isAdvanceOpeningPriority) {
    ctx.fillStyle = '#FFF7ED';
    ctx.fillRect(36, y, width - 72, 34);
    ctx.strokeStyle = '#FDBA74';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(36, y, width - 72, 34);

    ctx.fillStyle = '#9A3412';
    ctx.font = '800 13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(
      '[ADVANCE OPENING PRIORITY]  Festival / 60-Day Advance Opening Pre-Booking Request',
      52,
      y + 22
    );
    y += 46;
  }

  // Section 1: Selected Train / Route Details
  ctx.fillStyle = '#213D77';
  ctx.font = '800 14px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('1. JOURNEY & SERVICE DETAILS', 36, y + 14);
  y += 24;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(36, y, width - 72, 134);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.strokeRect(36, y, width - 72, 134);

  const trainDisplay = isTrain
    ? record.trainNumber === 'CUSTOM'
      ? record.trainName
      : `${record.trainNumber} — ${record.trainName}`
    : record.trainName;

  const col1X = 52;
  const col2X = 470;

  // Row 1
  ctx.fillStyle = '#64748B';
  ctx.font = '600 11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(isTrain ? 'SELECTED TRAIN' : 'SELECTED SERVICE', col1X, y + 22);
  ctx.fillText('JOURNEY DATE & CLASS', col2X, y + 22);

  ctx.fillStyle = '#0F172A';
  ctx.font = '700 14px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(trainDisplay.slice(0, 44), col1X, y + 42);
  ctx.fillText(
    `${formatReadableDate(record.journeyDate)}  •  ${record.travelClass}${
      isTrain ? ` (${record.quota})` : ''
    }`,
    col2X,
    y + 42
  );

  // Divider
  ctx.strokeStyle = '#F1F5F9';
  ctx.beginPath();
  ctx.moveTo(46, y + 58);
  ctx.lineTo(width - 46, y + 58);
  ctx.stroke();

  // Row 2
  ctx.fillStyle = '#64748B';
  ctx.font = '600 11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('ROUTE (FROM -> TO)', col1X, y + 78);
  ctx.fillText(isTrain ? 'BOARDING STATION' : 'BOARDING POINT / PREFERENCES', col2X, y + 78);

  ctx.fillStyle = '#0F172A';
  ctx.font = '700 14px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(`${record.fromStation}  →  ${record.toStation}`.slice(0, 46), col1X, y + 98);
  ctx.fillText(
    `${record.boardingStation}${record.extraPreferences ? ` (${record.extraPreferences})` : ''}`.slice(
      0,
      44
    ),
    col2X,
    y + 98
  );

  // Flexibility note inside journey card
  const flexText = [
    record.allowAlternateTrain ? 'Alternate Train Allowed' : null,
    record.allowClassUpgrade ? 'Class Upgrade Allowed' : null,
  ]
    .filter(Boolean)
    .join('  •  ');
  ctx.fillStyle = '#213D77';
  ctx.font = '600 11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(
    `Agent Flexibility: ${flexText || 'Exact selected train & class preferred'}`,
    col1X,
    y + 122
  );

  y += 154;

  // Section 2: Passenger List
  ctx.fillStyle = '#213D77';
  ctx.font = '800 14px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(`2. PASSENGER LIST (${record.passengers.length})`, 36, y + 14);
  y += 24;

  const tableHeight = 36 + record.passengers.length * passengerRowHeight;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(36, y, width - 72, tableHeight);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.strokeRect(36, y, width - 72, tableHeight);

  // Table Header
  ctx.fillStyle = '#F1F5F9';
  ctx.fillRect(37, y + 1, width - 74, 34);
  ctx.fillStyle = '#334155';
  ctx.font = '700 12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('#', 52, y + 22);
  ctx.fillText('PASSENGER NAME', 86, y + 22);
  ctx.fillText('AGE', 370, y + 22);
  ctx.fillText('GENDER', 436, y + 22);
  ctx.fillText(isTrain ? 'BERTH PREF.' : 'SERVICE', 540, y + 22);
  ctx.fillText('ID PROOF', 690, y + 22);

  // Table Rows
  record.passengers.forEach((p, idx) => {
    const rowTop = y + 36 + idx * passengerRowHeight;
    if (idx > 0) {
      ctx.strokeStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.moveTo(36, rowTop);
      ctx.lineTo(width - 36, rowTop);
      ctx.stroke();
    }
    ctx.fillStyle = '#64748B';
    ctx.font = '700 12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    ctx.fillText(String(idx + 1), 52, rowTop + 23);

    ctx.fillStyle = '#0F172A';
    ctx.font = '700 13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(p.name.slice(0, 30), 86, rowTop + 23);

    ctx.fillStyle = '#334155';
    ctx.font = '600 13px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    ctx.fillText(String(p.age), 370, rowTop + 23);

    ctx.font = '500 13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(p.gender, 436, rowTop + 23);
    ctx.fillText(isTrain ? p.berthPreference : (record.serviceType || 'train').toUpperCase(), 540, rowTop + 23);
    ctx.fillText(p.idProofType || 'Optional', 690, rowTop + 23);
  });

  y += tableHeight + 22;

  // Section 3: Contact, Payment Status & Referral
  ctx.fillStyle = '#213D77';
  ctx.font = '800 14px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('3. PAYMENT STATUS & CUSTOMER CONTACT', 36, y + 14);
  y += 24;

  const paymentBoxHeight = 152 + referralHeight;
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(36, y, width - 72, paymentBoxHeight);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.strokeRect(36, y, width - 72, paymentBoxHeight);

  // Prominent PENDING AGENT VERIFICATION Badge (NEVER shows "Paid")
  drawRoundedRect(ctx, 52, y + 14, width - 104, 34, 4);
  ctx.fillStyle = '#FEF3C7';
  ctx.fill();
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.fillStyle = '#92400E';
  ctx.font = '800 11.5px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(
    'PAYMENT STATUS: PENDING AGENT VERIFICATION (Not a final payment receipt until verified in bank)',
    64,
    y + 35
  );

  const isAdvanceToken =
    record.advancePaymentChoice === 'advance-token' && Boolean(record.advanceTokenAmount);
  const paymentOptionText = isAdvanceToken
    ? `Optional Advance Token (${formatInrAmount(record.advanceTokenAmount!)})`
    : 'Pay on Call / Cash (₹0 Advance Paid)';

  ctx.fillStyle = '#0F172A';
  ctx.font = '700 13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(`Payment Option: ${paymentOptionText}`, 52, y + 72);

  ctx.fillStyle = '#213D77';
  ctx.font = '700 11.5px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
  if (isAdvanceToken) {
    ctx.fillText(`Payment Proof: ${describePaymentProof(record)}`.slice(0, 96), 52, y + 96);
  } else {
    ctx.fillText(
      `Request Status: Pending Agent Availability & Exact Fare Confirmation`,
      52,
      y + 96
    );
  }

  ctx.fillStyle = '#334155';
  ctx.font = '600 12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
  const contactLine = [
    `WhatsApp Mobile: +91 ${record.mobile}`,
    record.email ? `Email: ${record.email}` : null,
  ]
    .filter(Boolean)
    .join('   |   ');
  ctx.fillText(contactLine.slice(0, 94), 52, y + 120);

  ctx.fillStyle = '#475569';
  ctx.font = '600 11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(
    `Official UPI Desk: ${AGENCY_CONTACT.merchantName} (${AGENCY_CONTACT.upiId})`,
    52,
    y + 140
  );

  if (record.referredBy) {
    ctx.fillStyle = '#065F46';
    ctx.font = '700 12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(
      `Referral Benefit Noted: Referred by "${record.referredBy}" — ₹50 Off Service Charge Eligible`,
      52,
      y + 166
    );
  }

  y += paymentBoxHeight + 18;

  // Mandatory Legal / Verification Disclaimer Box
  ctx.fillStyle = '#FEF2F2';
  ctx.fillRect(36, y, width - 72, 54);
  ctx.strokeStyle = '#FECACA';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(36, y, width - 72, 54);

  ctx.fillStyle = '#991B1B';
  ctx.font = '700 11.5px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const disclaimer =
    'Note: This slip is only a Booking Request Acknowledgment, NOT a payment receipt. Advance payment is valid only after Sky Track verifies the UTR in our bank statement.';
  const wrapped = wrapCanvasText(ctx, disclaimer, width - 104);
  wrapped.forEach((line, idx) => {
    ctx.fillText(line, 50, y + 22 + idx * 18);
  });

  // Trigger clean file download
  const dataUrl = canvas.toDataURL('image/png');
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = `SKYTRACK-Request-Acknowledgment-${record.referenceId}.png`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
