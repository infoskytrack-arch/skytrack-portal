export type ServiceType = 'train' | 'flight' | 'bus';

export type LanguageCode = 'en' | 'bn' | 'hi';

export type TravelClassCode = 'ALL' | 'SL' | '3A' | '3E' | '2A' | '1A' | 'CC' | '2S';

export type SelectableClassCode = Exclude<TravelClassCode, 'ALL'>;

export type QuotaType =
  | 'GENERAL'
  | 'TATKAL'
  | 'PREMIUM TATKAL'
  | 'LADIES'
  | 'SENIOR CITIZEN';

export type GenderType = 'Male' | 'Female' | 'Transgender';

export type BerthPreference =
  | 'No Preference'
  | 'Lower'
  | 'Middle'
  | 'Upper'
  | 'Side Lower'
  | 'Side Upper'
  | 'Window Side';

export type IdProofType =
  | ''
  | 'Aadhaar Card'
  | 'Voter ID'
  | 'PAN Card'
  | 'Passport';

export type AdvancePaymentChoice = 'advance-token' | 'pay-after-confirmation';

export type PaymentProofMethod = 'screenshot' | 'utr' | 'whatsapp-chat';

export type RequestStatus =
  | 'Pending Verification'
  | 'Fare Confirmed'
  | 'Ticket Issued'
  | 'Cancelled';

export interface Station {
  code: string;
  name: string;
  city: string;
  state: string;
  popular?: boolean;
}

export interface TrainSchedule {
  trainNumber: string;
  trainName: string;
  fromCode: string;
  fromName: string;
  toCode: string;
  toName: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  runsOn: [boolean, boolean, boolean, boolean, boolean, boolean, boolean]; // Mon..Sun
  classes: SelectableClassCode[];
  trainType: string;
  routeStops?: string[];
  matchedNote?: string;
  isCustomOption?: boolean;
}

export interface PassengerDetail {
  id: string;
  name: string;
  age: string;
  gender: GenderType;
  berthPreference: BerthPreference;
  idProofType: IdProofType;
}

export interface BookingRequestRecord {
  id: string;
  referenceId: string;
  createdAt: string;
  updatedAt: string;
  serviceType?: ServiceType;
  trainNumber: string;
  trainName: string;
  fromStation: string;
  toStation: string;
  boardingStation: string;
  journeyDate: string;
  returnDate?: string;
  travelClass: string;
  quota: string;
  extraPreferences?: string;
  allowAlternateTrain?: boolean;
  allowClassUpgrade?: boolean;
  isAdvanceOpeningPriority?: boolean;
  referredBy?: string;
  advancePaymentChoice?: AdvancePaymentChoice;
  advanceTokenAmount?: number;
  paymentProofMethod?: PaymentProofMethod;
  hasPaymentScreenshot?: boolean;
  paymentScreenshotOriginalName?: string;
  passengers: Array<{
    name: string;
    age: number;
    gender: GenderType;
    berthPreference: BerthPreference;
    idProofType?: IdProofType;
  }>;
  mobile: string;
  alternatePhone?: string;
  email?: string;
  paymentReference?: string;
  deliveryChannel: 'whatsapp' | 'email' | 'admin-direct';
  status: RequestStatus;
  pnrNumber?: string;
  agentRemark?: string;
  hasTicketPdf: boolean;
  pdfOriginalName?: string;
}

export const TRAVEL_CLASSES: Array<{
  code: SelectableClassCode;
  label: string;
  shortLabel: string;
}> = [
  { code: 'SL', label: 'Sleeper (SL)', shortLabel: 'SL' },
  { code: '3A', label: 'AC 3 Tier (3A)', shortLabel: '3A' },
  { code: '3E', label: 'AC 3 Economy (3E)', shortLabel: '3E' },
  { code: '2A', label: 'AC 2 Tier (2A)', shortLabel: '2A' },
  { code: '1A', label: 'AC First Class (1A)', shortLabel: '1A' },
  { code: 'CC', label: 'AC Chair Car (CC)', shortLabel: 'CC' },
  { code: '2S', label: 'Second Sitting (2S)', shortLabel: '2S' },
];

export const QUOTA_OPTIONS: QuotaType[] = [
  'GENERAL',
  'TATKAL',
  'PREMIUM TATKAL',
  'LADIES',
  'SENIOR CITIZEN',
];

export const BERTH_PREFERENCES: BerthPreference[] = [
  'No Preference',
  'Lower',
  'Middle',
  'Upper',
  'Side Lower',
  'Side Upper',
  'Window Side',
];

export const ID_PROOF_OPTIONS: Array<{ value: IdProofType; label: string }> = [
  { value: '', label: 'Optional — Not Selected' },
  { value: 'Aadhaar Card', label: 'Aadhaar Card' },
  { value: 'Voter ID', label: 'Voter ID' },
  { value: 'PAN Card', label: 'PAN Card' },
  { value: 'Passport', label: 'Passport' },
];

export const AGENCY_CONTACT = {
  brandName: 'SKY TRACK',
  merchantName: 'Sky Track',
  tagline: 'Your Journey, Our Priority',
  locationShort: 'Zaveri Bazar, South Mumbai',
  fullAddress: 'Zaveri Bazar, Kalbadevi, South Mumbai — 400002, Maharashtra',
  primaryPhoneDisplay: '+91 8169607855',
  primaryPhoneRaw: '918169607855',
  secondaryPhoneDisplay: '+91 8976486426',
  secondaryPhoneRaw: '918976486426',
  email: 'infoskytracktravel@gmail.com',
  upiId: 'Q210984848@ybl',
  upiHandleDisplay: 'Q210984848@ybl (PhonePe / GPay / UPI)',
  upiQrPayload: 'upi://pay?pa=Q210984848@ybl&pn=Sky%20Track&cu=INR',
  upiQrImagePath: '/assets/aistudio/Q210984848_b9140cb0.png',
};
