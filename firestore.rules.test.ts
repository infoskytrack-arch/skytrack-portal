/**
 * SKY TRACK Firestore Security Rules Verification Specification
 *
 * Documents and verifies all 12 adversarial ("Dirty Dozen") attack payloads
 * against firestore.rules to ensure PERMISSION_DENIED on every unauthorized
 * or malformed access pattern.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: { uid?: string; email?: string; email_verified?: boolean } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_SECURITY_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Public scrape of all bookings (PII protection)',
    operation: 'list',
    path: '/bookings',
    auth: null,
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Non-admin get of single booking document',
    operation: 'get',
    path: '/bookings/booking-123',
    auth: { uid: 'user-other', email: 'other@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow field injection on booking create',
    operation: 'create',
    path: '/bookings/booking-shadow',
    auth: null,
    payload: {
      id: 'booking-shadow',
      referenceId: 'ST-20261121-AB12',
      isVerifiedAdmin: true,
      status: 'Pending Verification',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'State shortcutting (creating booking as Ticket Issued)',
    operation: 'create',
    path: '/bookings/booking-shortcut',
    auth: null,
    payload: {
      id: 'booking-shortcut',
      referenceId: 'ST-20261121-AB13',
      status: 'Ticket Issued',
      hasTicketPdf: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Client-forged createdAt timestamp',
    operation: 'create',
    path: '/bookings/booking-time-spoof',
    auth: null,
    payload: {
      id: 'booking-time-spoof',
      createdAt: '2020-01-01T00:00:00.000Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Oversized passenger array / resource exhaustion',
    operation: 'create',
    path: '/bookings/booking-overflow',
    auth: null,
    payload: {
      id: 'booking-overflow',
      passengers: new Array(25).fill({ name: 'Spam', age: 30, gender: 'Male', berthPreference: 'Lower' }),
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Document ID poisoning with invalid characters',
    operation: 'create',
    path: '/bookings/..invalid$id!',
    auth: null,
    payload: { id: '..invalid$id!' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Unverified admin email spoofing attack',
    operation: 'list',
    path: '/bookings',
    auth: { uid: 'spoof-uid', email: 'infoskytracktravel@gmail.com', email_verified: false },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Non-admin forging confirmed ticket lookup',
    operation: 'create',
    path: '/ticketLookups/9820123456',
    auth: { uid: 'user-attacker', email: 'attacker@example.com', email_verified: true },
    payload: {
      mobile: '9820123456',
      tickets: [],
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Public enumeration of customer mobile numbers in ticketLookups',
    operation: 'list',
    path: '/ticketLookups',
    auth: null,
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Non-admin reading customer uploaded payment screenshot',
    operation: 'get',
    path: '/paymentProofs/booking-123',
    auth: { uid: 'user-other', email: 'other@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Privilege escalation into /admins or /adminConfig',
    operation: 'create',
    path: '/admins/user-attacker',
    auth: { uid: 'user-attacker', email: 'attacker@example.com', email_verified: true },
    payload: {
      uid: 'user-attacker',
      email: 'attacker@example.com',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
];
