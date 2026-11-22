import type { LanguageCode } from '../types';

export interface Translations {
  // Header & Nav
  navHomeSearch: string;
  navTrackPdf: string;
  navGuidePolicy: string;
  navAdmin: string;
  navBookTicket: string;
  navPopularRoutes: string;
  navTrackTicket: string;
  navAdminPortal: string;
  whatsappAgent: string;
  tickerNotice: string;
  tickerCallLine: string;
  backToSearch: string;
  backToTrains: string;
  exitHome: string;
  bookAnotherHome: string;

  // Service Tabs
  tabTrain: string;
  tabFlight: string;
  tabBus: string;

  // Search Card Headings & Labels
  bookTrainTitle: string;
  bookTrainSub: string;
  bookFlightTitle: string;
  bookFlightSub: string;
  bookBusTitle: string;
  bookBusSub: string;
  fromStation: string;
  toStation: string;
  fromAirport: string;
  toAirport: string;
  fromCity: string;
  toCity: string;
  journeyDate: string;
  returnDateOptional: string;
  allClasses: string;
  quota: string;
  cabinClass: string;
  baggageMealPref: string;
  busCoachPref: string;
  boardingTimePref: string;
  searchTrainsBtn: string;
  continueFlightBtn: string;
  continueBusBtn: string;
  zeroUpfrontNote: string;
  quickSearch: string;

  // Tatkal Alert Banner
  tatkalAlertTitle: string;
  tatkalAcRule: string;
  tatkalNonAcRule: string;

  // Hero Right Copy
  heroKicker: string;
  heroHeadline: string;
  heroDesc: string;
  heroPoint1: string;
  heroPoint2: string;
  heroPoint3: string;
  urgentHelpLabel: string;
  downloadTicketBtn: string;

  // Booking Form New Sections
  idProofLabel: string;
  flexibilityTitle: string;
  allowAlternateTrainLabel: string;
  allowClassUpgradeLabel: string;
  advanceSectionTitle: string;
  advanceSectionSub: string;
  choiceATitle: string;
  choiceADesc: string;
  choiceABalanceNote: string;
  choiceBTitle: string;
  choiceBDesc: string;
  utrLabel: string;
  sendWhatsAppBtn: string;
  sendEmailBtn: string;

  // How It Works (4-Step Guide), Trust & Cancellation Policy
  popularCorridorsHeading: string;
  popularCorridorsSub: string;
  howItWorksHeading: string;
  howItWorksSub: string;
  steps: Array<{ num: string; title: string; desc: string }>;
  msmeBadgeTitle: string;
  msmeBadgeSub: string;
  cancellationHeading: string;
  cancellationPoints: string[];
}

export const TRANSLATIONS: Record<LanguageCode, Translations> = {
  en: {
    navHomeSearch: 'Home / Search',
    navTrackPdf: 'Track & Download PDF',
    navGuidePolicy: 'How It Works & Policy',
    navAdmin: 'Admin',
    navBookTicket: 'Book Ticket',
    navPopularRoutes: 'Popular Routes',
    navTrackTicket: 'Track / Download Ticket',
    navAdminPortal: 'Admin Portal',
    whatsappAgent: 'WhatsApp Agent',
    tickerNotice:
      'Submit your booking request online — Our agent will verify live availability, confirm exact fare on call/WhatsApp, and issue your confirmed ticket.',
    tickerCallLine:
      'Call +91 8169607855 / +91 8976486426 for Tatkal, Flight & Bus Reservations — Zaveri Bazar, Mumbai',
    backToSearch: 'Back to Search',
    backToTrains: 'Back to Train List',
    exitHome: 'Exit / Home',
    bookAnotherHome: 'Book Another Ticket / Home',

    tabTrain: 'Train Ticket Request',
    tabFlight: 'Flight Ticket Request',
    tabBus: 'Bus Ticket Request',

    bookTrainTitle: 'BOOK TICKET',
    bookTrainSub: 'All-India Rail Booking Request',
    bookFlightTitle: 'FLIGHT TICKET REQUEST',
    bookFlightSub: 'Domestic & International Air Desk',
    bookBusTitle: 'BUS TICKET REQUEST',
    bookBusSub: 'Intercity AC Sleeper & Volvo Desk',
    fromStation: 'From Station',
    toStation: 'To Station',
    fromAirport: 'From Airport / City',
    toAirport: 'To Airport / City',
    fromCity: 'From City',
    toCity: 'To City',
    journeyDate: 'Journey Date',
    returnDateOptional: 'Return Date (Optional)',
    allClasses: 'All Classes',
    quota: 'Quota',
    cabinClass: 'Cabin Class',
    baggageMealPref: 'Extra Baggage / Meal Preference',
    busCoachPref: 'AC Sleeper / Seater Preference',
    boardingTimePref: 'Preferred Departure Window',
    searchTrainsBtn: 'Search Trains',
    continueFlightBtn: 'Continue to Passenger Details',
    continueBusBtn: 'Continue to Passenger Details',
    zeroUpfrontNote: 'Zero upfront fare shown — Agent confirms exact availability & fare first',
    quickSearch: 'Quick Search:',

    tatkalAlertTitle: 'Tatkal & Premium Tatkal Booking Window Timings',
    tatkalAcRule:
      'AC Tatkal (1A, 2A, 3A, CC) booking starts at 10:00 AM (1 day before journey) — Submit request before 9:30 AM.',
    tatkalNonAcRule:
      'Non-AC Tatkal (SL, 2S) booking starts at 11:00 AM (1 day before journey) — Submit request before 10:30 AM.',

    heroKicker: 'MSME UDYAM REGISTERED AGENCY · ZAVERI BAZAR, MUMBAI',
    heroHeadline: 'Your Journey, Our Priority.',
    heroDesc:
      'Submit your Indian Railways, Flight, or Intercity Bus booking request in under a minute. SKY TRACK verifies live availability before confirming the exact fare directly with you.',
    heroPoint1:
      'All-India railway stations covered — dedicated desk for Howrah, Mumbai, Jaipur, Surat & Ahmedabad.',
    heroPoint2:
      'Pay via PhonePe / UPI or Cash after agent confirmation, or choose optional advance token for priority processing.',
    heroPoint3:
      'Download your confirmed ticket PDF anytime using your registered 10-digit mobile number.',
    urgentHelpLabel: 'Need urgent Tatkal, Flight, or Bus help?',
    downloadTicketBtn: 'Download Confirmed Ticket',

    idProofLabel: 'ID Proof Type (Optional)',
    flexibilityTitle: 'Agent Flexibility Instructions (Optional)',
    allowAlternateTrainLabel: 'Allow Alternate Train on same route if seats are full',
    allowClassUpgradeLabel: 'Allow Class Upgrade (e.g., SL to 3A) if preferred class is unavailable',
    advanceSectionTitle: 'Advance Booking Option (Optional)',
    advanceSectionSub:
      'Exact full ticket fare is confirmed by our agent after checking live availability. Choose how you wish to proceed:',
    choiceATitle: 'Pay Optional Advance Token Now (Fast Priority Processing)',
    choiceADesc:
      '₹2,000 per passenger for AC classes (1A, 2A, 3A, 3E, CC / Flight / AC Bus) or ₹1,000 per passenger for Sleeper / Second Sitting (SL, 2S / Non-AC Bus).',
    choiceABalanceNote:
      'The remaining balance (or any refund if unavailable) will be settled transparently after ticket confirmation.',
    choiceBTitle: 'Skip Advance & Pay After Agent Confirmation (On Call / Cash)',
    choiceBDesc:
      'Submit your booking request with ₹0 upfront payment. Pay via PhonePe / UPI or Cash at our Zaveri Bazar office once our agent confirms live seat availability.',
    utrLabel: 'UTR / Transaction ID (Optional if already transferred)',
    sendWhatsAppBtn: 'Send Booking Request via WhatsApp',
    sendEmailBtn: 'Send Booking Request via Email',

    popularCorridorsHeading: 'Frequently Requested Railway Corridors',
    popularCorridorsSub:
      'Click any major route below to view scheduled trains immediately, or search any station across Indian Railways above.',
    howItWorksHeading: 'How Sky Track Booking Works',
    howItWorksSub:
      'A clear 4-step process designed for confirmed ticketing without upfront fare guesswork.',
    steps: [
      {
        num: '01',
        title: 'Submit Request',
        desc: 'Select Train, Flight, or Bus, fill passenger & flexibility details, and send your request via WhatsApp or Email.',
      },
      {
        num: '02',
        title: 'Agent Verifies Live Seat & Exact Fare',
        desc: 'Our Zaveri Bazar desk checks real-time IRCTC / Airline / Bus availability and shares the exact confirmed fare with you.',
      },
      {
        num: '03',
        title: 'Confirm Payment',
        desc: 'Approve and settle payment via PhonePe / UPI or Cash at our office (or adjust against your optional advance token).',
      },
      {
        num: '04',
        title: 'Receive Confirmed Ticket',
        desc: 'Receive your ticket on WhatsApp / Email and download the official PDF anytime from the Track Ticket tab.',
      },
    ],
    msmeBadgeTitle: 'MSME Udyam Registered Agency — Zaveri Bazar, Mumbai',
    msmeBadgeSub:
      'Verified Government of India MSME Udyam registered travel agency operating from Zaveri Bazar, Kalbadevi, Mumbai.',
    cancellationHeading: 'Cancellation & Refund Policy',
    cancellationPoints: [
      'Railway Tickets: Cancellations, chart-preparation cutoffs, and TDR claims strictly follow official Indian Railways / IRCTC rules. Confirmed Tatkal tickets are non-refundable as per IRCTC norms.',
      'Flight & Bus Tickets: Cancellation charges and rescheduling penalties apply as per the respective Airline or Bus Operator fare rules at the time of cancellation.',
      'Advance Token Refund: If you paid an optional advance token and confirmed seats are unavailable as per your criteria, 100% of your advance token is refunded promptly to your UPI / Bank account.',
      'Refund Processing: Approved refunds (after standard IRCTC / Airline deductions and applicable agency service charges) are credited via UPI, Bank Transfer, or Cash within 3–7 working days.',
    ],
  },

  bn: {
    navHomeSearch: 'হোম / সার্চ',
    navTrackPdf: 'ট্র্যাক ও PDF',
    navGuidePolicy: 'নিয়ম ও নীতিমালা',
    navAdmin: 'অ্যাডমিন',
    navBookTicket: 'টিকিট বুকিং',
    navPopularRoutes: 'জনপ্রিয় রুট',
    navTrackTicket: 'টিকিট ট্র্যাক / ডাউনলোড',
    navAdminPortal: 'অ্যাডমিন পোর্টাল',
    whatsappAgent: 'হোয়াটসঅ্যাপ এজেন্ট',
    tickerNotice:
      'অনলাইনে আপনার বুকিং অনুরোধ পাঠান — আমাদের এজেন্ট লাইভ সিট যাচাই করে কল/হোয়াটসঅ্যাপে সঠিক ভাড়া জানাবেন এবং কনফার্ম টিকিট ইস্যু করবেন।',
    tickerCallLine:
      'তৎকাল, ফ্লাইট এবং বাস বুকিংয়ের জন্য কল করুন +91 8169607855 / +91 8976486426 — জাভেরি বাজার, মুম্বাই',
    backToSearch: 'সার্চে ফিরে যান',
    backToTrains: 'ট্রেন তালিকায় ফিরুন',
    exitHome: 'হোম / প্রস্থান',
    bookAnotherHome: 'আরেকটি টিকিট বুক করুন / হোম',

    tabTrain: 'ট্রেন টিকিট রিকোয়েস্ট',
    tabFlight: 'ফ্লাইট টিকিট রিকোয়েস্ট',
    tabBus: 'বাস টিকিট রিকোয়েস্ট',

    bookTrainTitle: 'ট্রেন টিকিট বুকিং',
    bookTrainSub: 'সারা ভারত রেল বুকিং অনুরোধ',
    bookFlightTitle: 'ফ্লাইট টিকিট অনুরোধ',
    bookFlightSub: 'ডোমেস্টিক ও ইন্টারন্যাশনাল এয়ার ডেস্ক',
    bookBusTitle: 'বাস টিকিট অনুরোধ',
    bookBusSub: 'ইন্টারসিটি এসি স্লিপার ও ভলভো ডেস্ক',
    fromStation: 'যাত্রা শুরুর স্টেশন (From)',
    toStation: 'গন্তব্য স্টেশন (To)',
    fromAirport: 'প্রস্থান এয়ারপোর্ট / শহর',
    toAirport: 'গন্তব্য এয়ারপোর্ট / শহর',
    fromCity: 'যাত্রা শুরুর শহর',
    toCity: 'গন্তব্য শহর',
    journeyDate: 'যাত্রার তারিখ',
    returnDateOptional: 'ফেরার তারিখ (ঐচ্ছিক)',
    allClasses: 'সব ক্লাস (Class)',
    quota: 'কোটা (Quota)',
    cabinClass: 'কেবিন ক্লাস',
    baggageMealPref: 'অতিরিক্ত ব্যাগেজ / খাবার পছন্দ',
    busCoachPref: 'এসি স্লিপার / সিটার পছন্দ',
    boardingTimePref: 'পছন্দের ছাড়ার সময়',
    searchTrainsBtn: 'ট্রেন খুঁজুন',
    continueFlightBtn: 'যাত্রীর বিবরণে যান',
    continueBusBtn: 'যাত্রীর বিবরণে যান',
    zeroUpfrontNote: 'আগাম কোনো ভাড়া দেখানো হয় না — এজেন্ট প্রথমে সঠিক ভাড়া নিশ্চিত করবেন',
    quickSearch: 'দ্রুত অনুসন্ধান:',

    tatkalAlertTitle: 'তৎকাল ও প্রিমিয়াম তৎকাল বুকিংয়ের সময়সূচি',
    tatkalAcRule:
      'এসি তৎকাল (1A, 2A, 3A, CC) বুকিং সকাল ১০:০০ টায় শুরু হয় (যাত্রার ১ দিন আগে) — সকাল ৯:৩০ টার আগে অনুরোধ পাঠান।',
    tatkalNonAcRule:
      'নন-এসি তৎকাল (SL, 2S) বুকিং সকাল ১১:০০ টায় শুরু হয় (যাত্রার ১ দিন আগে) — সকাল ১০:৩০ টার আগে অনুরোধ পাঠান।',

    heroKicker: 'এমএসএমই উদ্যম নিবন্ধিত এজেন্সি · জাভেরি বাজার, মুম্বাই',
    heroHeadline: 'আপনার যাত্রা, আমাদের অগ্রাধিকার।',
    heroDesc:
      'এক মিনিটের মধ্যে ট্রেন, ফ্লাইট বা বাসের টিকিট বুকিং অনুরোধ জমা দিন। SKY TRACK লাইভ সিট যাচাই করে সরাসরি আপনাকে সঠিক ভাড়া নিশ্চিত করবে।',
    heroPoint1:
      'হাওড়া, মুম্বাই, জয়পুর, সুরাট ও আহমেদাবাদ সহ সারা ভারতের সব রেলস্টেশনের বুকিং সুবিধা।',
    heroPoint2:
      'এজেন্ট কনফার্ম করার পর PhonePe / UPI বা ক্যাশে পেমেন্ট করুন, অথবা দ্রুত প্রসেসিংয়ের জন্য ঐচ্ছিক অ্যাডভান্স টোকেন দিন।',
    heroPoint3:
      'আপনার ১০-সংখ্যার মোবাইল নম্বর দিয়ে যেকোনো সময় কনফার্ম টিকিট PDF ডাউনলোড করুন।',
    urgentHelpLabel: 'জরুরি তৎকাল, ফ্লাইট বা বাস সহায়তার জন্য কল করুন:',
    downloadTicketBtn: 'কনফার্ম টিকিট ডাউনলোড',

    idProofLabel: 'আইডি প্রুফ (ঐচ্ছিক)',
    flexibilityTitle: 'এজেন্টের জন্য অতিরিক্ত নির্দেশনা (ঐচ্ছিক)',
    allowAlternateTrainLabel: 'সিট পূর্ণ থাকলে একই রুটে বিকল্প ট্রেন অনুমোদন করুন',
    allowClassUpgradeLabel: 'পছন্দের ক্লাস না থাকলে ক্লাস আপগ্রেড (যেমন SL থেকে 3A) অনুমোদন করুন',
    advanceSectionTitle: 'অ্যাডভান্স বুকিং অপশন (ঐচ্ছিক)',
    advanceSectionSub:
      'লাইভ সিট যাচাই করার পর এজেন্ট সম্পূর্ণ ভাড়া জানাবেন। আপনার পছন্দের পেমেন্ট অপশন বেছে নিন:',
    choiceATitle: 'ঐচ্ছিক অ্যাডভান্স টোকেন এখন পেমেন্ট করুন (দ্রুত প্রায়োরিটি প্রসেসিং)',
    choiceADesc:
      'এসি ক্লাসের (1A, 2A, 3A, 3E, CC / ফ্লাইট / এসি বাস) জন্য যাত্রী প্রতি ₹2,000 এবং স্লিপার / সেকেন্ড সিটিংয়ের (SL, 2S / নন-এসি বাস) জন্য যাত্রী প্রতি ₹1,000।',
    choiceABalanceNote:
      'টিকিট কনফার্ম হওয়ার পর বাকি টাকা (অথবা সিট না মিললে সম্পূর্ণ রিফান্ড) স্বচ্ছভাবে সমন্বয় করা হবে।',
    choiceBTitle: 'অ্যাডভান্স বাদ দিন ও এজেন্ট কনফার্মেশনের পর পেমেন্ট করুন (কল / ক্যাশ)',
    choiceBDesc:
      '₹0 আগাম পেমেন্টে আপনার বুকিং অনুরোধ পাঠান। এজেন্ট লাইভ সিট নিশ্চিত করার পর UPI বা জাভেরি বাজার অফিসে ক্যাশ পেমেন্ট করুন।',
    utrLabel: 'UTR / ট্রানজ্যাকশন আইডি (পেমেন্ট করে থাকলে লিখুন)',
    sendWhatsAppBtn: 'হোয়াটসঅ্যাপে বুকিং অনুরোধ পাঠান',
    sendEmailBtn: 'ইমেইলে বুকিং অনুরোধ পাঠান',

    popularCorridorsHeading: 'জনপ্রিয় রেলওয়ে রুটসমূহ',
    popularCorridorsSub:
      'সরাসরি ট্রেনের তালিকা দেখতে নিচের যেকোনো রুটে ক্লিক করুন, অথবা উপরে সারা ভারতের যেকোনো স্টেশন খুঁজুন।',
    howItWorksHeading: 'স্কাই ট্র্যাক বুকিং যেভাবে কাজ করে',
    howItWorksSub: 'আগাম ভাড়ার বিভ্রান্তি ছাড়াই কনফার্ম টিকিট পাওয়ার ৪টি সহজ ধাপ।',
    steps: [
      {
        num: '01',
        title: 'অনুরোধ জমা দিন',
        desc: 'ট্রেন, ফ্লাইট বা বাস নির্বাচন করে যাত্রীর তথ্য দিন এবং হোয়াটসঅ্যাপ বা ইমেইলে পাঠান।',
      },
      {
        num: '02',
        title: 'এজেন্ট লাইভ সিট ও সঠিক ভাড়া যাচাই করবেন',
        desc: 'আমাদের জাভেরি বাজার ডেস্ক লাইভ IRCTC / এয়ারলাইন সিট দেখে সঠিক ভাড়া জানাবে।',
      },
      {
        num: '03',
        title: 'পেমেন্ট নিশ্চিত করুন',
        desc: 'ভাড়া অনুমোদনের পর PhonePe / UPI বা অফিসে ক্যাশের মাধ্যমে পেমেন্ট সম্পন্ন করুন।',
      },
      {
        num: '04',
        title: 'কনফার্ম টিকিট পান',
        desc: 'হোয়াটসঅ্যাপ / ইমেইলে টিকিট পান এবং যেকোনো সময় ট্র্যাক ট্যাব থেকে PDF ডাউনলোড করুন।',
      },
    ],
    msmeBadgeTitle: 'MSME Udyam নিবন্ধিত এজেন্সি — জাভেরি বাজার, মুম্বাই',
    msmeBadgeSub:
      'ভারত সরকারের MSME Udyam নিবন্ধিত অনুমোদিত ট্রাভেল এজেন্সি — জাভেরি বাজার, কালবাদেবী, মুম্বাই।',
    cancellationHeading: 'বাতিলকরণ এবং রিফান্ড নীতিমালা',
    cancellationPoints: [
      'রেলওয়ে টিকিট: বাতিলকরণ, চার্ট প্রস্তুতির সময়সীমা এবং TDR নিয়মাবলী সম্পূর্ণভাবে ভারতীয় রেলওয়ে / IRCTC নিয়ম অনুযায়ী প্রযোজ্য। কনফার্ম তৎকাল টিকিট IRCTC নিয়ম অনুযায়ী নন-রিফান্ডেবল।',
      'ফ্লাইট ও বাস টিকিট: সংশ্লিষ্ট এয়ারলাইন বা বাস অপারেটরের নিয়ম অনুযায়ী ক্যান্সেলেশন ও রিশিডিউল চার্জ প্রযোজ্য হবে।',
      'অ্যাডভান্স টোকেন রিফান্ড: আপনি ঐচ্ছিক অ্যাডভান্স টোকেন দিলে এবং আপনার পছন্দমতো কনফার্ম সিট পাওয়া না গেলে ১০০% টোকেন টাকা আপনার UPI / ব্যাঙ্ক অ্যাকাউন্টে ফেরত দেওয়া হবে।',
      'রিফান্ড সময়সীমা: প্রযোজ্য IRCTC / এয়ারলাইন চার্জ ও এজেন্সি সার্ভিস চার্জ বাদ দিয়ে অনুমোদিত রিফান্ড ৩–৭ কর্মদিবসের মধ্যে UPI, ব্যাঙ্ক বা ক্যাশে ফেরত দেওয়া হয়।',
    ],
  },

  hi: {
    navHomeSearch: 'होम / खोजें',
    navTrackPdf: 'ट्रैक और PDF',
    navGuidePolicy: 'कैसे काम करता है व नीति',
    navAdmin: 'एडमिन',
    navBookTicket: 'टिकट बुकिंग',
    navPopularRoutes: 'प्रमुख रूट',
    navTrackTicket: 'टिकट ट्रैक / डाउनलोड',
    navAdminPortal: 'एडमिन पोर्टल',
    whatsappAgent: 'व्हाट्सएप एजेंट',
    tickerNotice:
      'अपनी बुकिंग रिक्वेस्ट ऑनलाइन सबमिट करें — हमारे एजेंट लाइव सीट उपलब्धता जांचकर कॉल/व्हाट्सएप पर सटीक किराया बताएंगे और कन्फर्म टिकट जारी करेंगे।',
    tickerCallLine:
      'तत्काल, फ्लाइट और बस बुकिंग के लिए कॉल करें +91 8169607855 / +91 8976486426 — झवेरी बाजार, मुंबई',
    backToSearch: 'खोज पर वापस जाएं',
    backToTrains: 'ट्रेन सूची पर वापस',
    exitHome: 'होम / बाहर निकलें',
    bookAnotherHome: 'दूसरा टिकट बुक करें / होम',

    tabTrain: 'ट्रेन टिकट रिक्वेस्ट',
    tabFlight: 'फ्लाइट टिकट रिक्वेस्ट',
    tabBus: 'बस टिकट रिक्वेस्ट',

    bookTrainTitle: 'ट्रेन टिकट बुकिंग',
    bookTrainSub: 'ऑल-इंडिया रेल बुकिंग रिक्वेस्ट',
    bookFlightTitle: 'फ्लाइट टिकट रिक्वेस्ट',
    bookFlightSub: 'डोमेस्टिक और इंटरनेशनल एयर डेस्क',
    bookBusTitle: 'बस टिकट रिक्वेस्ट',
    bookBusSub: 'इंटरसिटी एसी स्लीपर और वोल्वो डेस्क',
    fromStation: 'कहाँ से (From Station)',
    toStation: 'कहाँ तक (To Station)',
    fromAirport: 'प्रस्थान एयरपोर्ट / शहर',
    toAirport: 'गंतव्य एयरपोर्ट / शहर',
    fromCity: 'प्रस्थान शहर',
    toCity: 'गंतव्य शहर',
    journeyDate: 'यात्रा की तारीख',
    returnDateOptional: 'वापसी की तारीख (वैकल्पिक)',
    allClasses: 'सभी श्रेणियां (Class)',
    quota: 'कोटा (Quota)',
    cabinClass: 'केबिन क्लास',
    baggageMealPref: 'अतिरिक्त बैगेज / भोजन प्राथमिकता',
    busCoachPref: 'एसी स्लीपर / सीटर प्राथमिकता',
    boardingTimePref: 'पसंदीदा प्रस्थान समय',
    searchTrainsBtn: 'ट्रेन खोजें',
    continueFlightBtn: 'यात्री विवरण भरें',
    continueBusBtn: 'यात्री विवरण भरें',
    zeroUpfrontNote: 'कोई अग्रिम किराया नहीं दिखाया जाता — एजेंट पहले सटीक किराया बताएंगे',
    quickSearch: 'त्वरित खोज:',

    tatkalAlertTitle: 'तत्काल एवं प्रीमियम तत्काल बुकिंग समय-सारिणी',
    tatkalAcRule:
      'एसी तत्काल (1A, 2A, 3A, CC) बुकिंग सुबह 10:00 बजे शुरू होती है (यात्रा से 1 दिन पहले) — सुबह 9:30 बजे से पहले रिक्वेस्ट भेजें।',
    tatkalNonAcRule:
      'नॉन-एसी तत्काल (SL, 2S) बुकिंग सुबह 11:00 बजे शुरू होती है (यात्रा से 1 दिन पहले) — सुबह 10:30 बजे से पहले रिक्वेस्ट भेजें।',

    heroKicker: 'MSME उद्यम पंजीकृत एजेंसी · झवेरी बाजार, मुंबई',
    heroHeadline: 'आपकी यात्रा, हमारी प्राथमिकता।',
    heroDesc:
      'एक मिनट से भी कम समय में ट्रेन, फ्लाइट या बस टिकट बुकिंग रिक्वेस्ट भेजें। SKY TRACK लाइव सीट जांचकर सीधे आपको सटीक किराया कन्फर्म करेगा।',
    heroPoint1:
      'हावड़ा, मुंबई, जयपुर, सूरत और अहमदाबाद सहित पूरे भारत के सभी रेलवे स्टेशनों के लिए बुकिंग सेवा।',
    heroPoint2:
      'एजेंट द्वारा कन्फर्म करने के बाद PhonePe / UPI या कैश से भुगतान करें, या प्राथमिकता के लिए वैकल्पिक एडवांस टोकन चुनें।',
    heroPoint3:
      'अपने पंजीकृत 10-अंकीय मोबाइल नंबर से कभी भी कन्फर्म टिकट PDF डाउनलोड करें।',
    urgentHelpLabel: 'तुरंत तत्काल, फ्लाइट या बस सहायता चाहिए?',
    downloadTicketBtn: 'कन्फर्म टिकट डाउनलोड करें',

    idProofLabel: 'आईडी प्रूफ प्रकार (वैकल्पिक)',
    flexibilityTitle: 'एजेंट के लिए स्मार्ट निर्देश (वैकल्पिक)',
    allowAlternateTrainLabel: 'सीट फुल होने पर उसी रूट पर वैकल्पिक ट्रेन की अनुमति दें',
    allowClassUpgradeLabel: 'पसंदीदा क्लास न होने पर क्लास अपग्रेड (जैसे SL से 3A) की अनुमति दें',
    advanceSectionTitle: 'एडवांस बुकिंग विकल्प (वैकल्पिक)',
    advanceSectionSub:
      'लाइव सीट जांचने के बाद एजेंट पूरा किराया बताएंगे। आगे बढ़ने के लिए अपना विकल्प चुनें:',
    choiceATitle: 'वैकल्पिक एडवांस टोकन अभी भुगतान करें (तेज़ प्रायोरिटी प्रोसेसिंग)',
    choiceADesc:
      'एसी क्लास (1A, 2A, 3A, 3E, CC / फ्लाइट / एसी बस) के लिए ₹2,000 प्रति यात्री या स्लीपर / सेकंड सिटिंग (SL, 2S / नॉन-एसी बस) के लिए ₹1,000 प्रति यात्री।',
    choiceABalanceNote:
      'टिकट कन्फर्म होने के बाद शेष राशि (या सीट न मिलने पर पूरा रिफंड) पारदर्शी रूप से समायोजित की जाएगी।',
    choiceBTitle: 'एडवांस छोड़ें और एजेंट कन्फर्मेशन के बाद भुगतान करें (कॉल / कैश)',
    choiceBDesc:
      '₹0 अग्रिम भुगतान के साथ अपनी रिक्वेस्ट भेजें। एजेंट द्वारा लाइव सीट कन्फर्म करने के बाद UPI या झवेरी बाजार ऑफिस में कैश दें।',
    utrLabel: 'UTR / ट्रांजैक्शन आईडी (यदि भुगतान कर दिया है)',
    sendWhatsAppBtn: 'व्हाट्सएप पर बुकिंग रिक्वेस्ट भेजें',
    sendEmailBtn: 'ईमेल द्वारा बुकिंग रिक्वेस्ट भेजें',

    popularCorridorsHeading: 'प्रमुख रेलवे रूट्स',
    popularCorridorsSub:
      'सीधे ट्रेनों की सूची देखने के लिए नीचे किसी भी रूट पर क्लिक करें, या ऊपर पूरे भारत का कोई भी स्टेशन खोजें।',
    howItWorksHeading: 'स्काई ट्रैक बुकिंग कैसे काम करती है',
    howItWorksSub: 'बिना किसी अग्रिम किराया उलझन के कन्फर्म टिकट पाने के 4 आसान चरण।',
    steps: [
      {
        num: '01',
        title: 'रिक्वेस्ट सबमिट करें',
        desc: 'ट्रेन, फ्लाइट या बस चुनें, यात्री विवरण भरें और व्हाट्सएप या ईमेल से रिक्वेस्ट भेजें।',
      },
      {
        num: '02',
        title: 'एजेंट लाइव सीट और सटीक किराया जांचते हैं',
        desc: 'हमारी झवेरी बाजार टीम लाइव IRCTC / एयरलाइन / बस उपलब्धता जांचकर सही किराया बताती है।',
      },
      {
        num: '03',
        title: 'भुगतान कन्फर्म करें',
        desc: 'सहमति के बाद PhonePe / UPI या ऑफिस में कैश द्वारा भुगतान करें (या एडवांस टोकन समायोजित करें)।',
      },
      {
        num: '04',
        title: 'कन्फर्म टिकट प्राप्त करें',
        desc: 'व्हाट्सएप / ईमेल पर टिकट प्राप्त करें और कभी भी ट्रैक टैब से PDF डाउनलोड करें।',
      },
    ],
    msmeBadgeTitle: 'MSME Udyam पंजीकृत एजेंसी — झवेरी बाजार, मुंबई',
    msmeBadgeSub:
      'भारत सरकार द्वारा MSME Udyam पंजीकृत विश्वसनीय ट्रैवल एजेंसी — झवेरी बाजार, कालबादेवी, मुंबई।',
    cancellationHeading: 'कैंसिलेशन और रिफंड नीति',
    cancellationPoints: [
      'रेलवे टिकट: कैंसिलेशन, चार्ट बनने की समय-सीमा और TDR दावे पूरी तरह भारतीय रेलवे / IRCTC के मानक नियमों के अनुसार लागू होते हैं। कन्फर्म तत्काल टिकट IRCTC नियमों के तहत नॉन-रिफंडेबल होते हैं।',
      'फ्लाइट और बस टिकट: कैंसिलेशन और रीशेड्यूलिंग शुल्क संबंधित एयरलाइन या बस ऑपरेटर के नियमों के अनुसार लागू होंगे।',
      'एडवांस टोकन रिफंड: यदि आपने वैकल्पिक एडवांस टोकन दिया है और आपकी पसंद के अनुसार कन्फर्म सीट उपलब्ध नहीं है, तो 100% टोकन राशि आपके UPI / बैंक खाते में तुरंत वापस कर दी जाती है।',
      'रिफंड प्रक्रिया: मानक IRCTC / एयरलाइन कटौती और लागू एजेंसी सर्विस शुल्क के बाद स्वीकृत रिफंड 3–7 कार्यदिवसों में UPI, बैंक ट्रांसफर या कैश द्वारा वापस किया जाता है।',
    ],
  },
};
