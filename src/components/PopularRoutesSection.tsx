import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Building2,
  FileCheck2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  TrainFront,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { AGENCY_CONTACT, type LanguageCode } from '../types';

interface PopularRoutesSectionProps {
  language: LanguageCode;
  onSelectCorridor: (fromCode: string, toCode: string) => void;
  onGoHome?: () => void;
}

const FEATURED_CORRIDORS = [
  {
    fromCode: 'HWH',
    fromLabel: 'Howrah Jn (HWH)',
    toCode: 'CSMT',
    toLabel: 'Mumbai CSMT (CSMT)',
    trainsNote: 'Gitanjali Exp · Howrah Mail · AC Duronto · Jnaneshwari',
    corridorType: 'East–West Trunk Line',
  },
  {
    fromCode: 'HWH',
    fromLabel: 'Howrah Jn (HWH)',
    toCode: 'JP',
    toLabel: 'Jaipur (JP)',
    trainsNote: 'Howrah–Jodhpur SF · Howrah–Bikaner SF · Sealdah–Ajmer SF',
    corridorType: 'Kolkata–Rajasthan Corridor',
  },
  {
    fromCode: 'HWH',
    fromLabel: 'Howrah Jn (HWH)',
    toCode: 'ST',
    toLabel: 'Surat (ST)',
    trainsNote: 'Howrah–Ahmedabad SF · Porbandar SF · Kaviguru Express',
    corridorType: 'Kolkata–Gujarat Business Line',
  },
  {
    fromCode: 'HWH',
    fromLabel: 'Howrah Jn (HWH)',
    toCode: 'ADI',
    toLabel: 'Ahmedabad Jn (ADI)',
    trainsNote: 'Howrah–Ahmedabad SF · Shalimar–Porbandar SF · Kolkata Weekly',
    corridorType: 'East–West Express Corridor',
  },
  {
    fromCode: 'CSMT',
    fromLabel: 'Mumbai CSMT (CSMT)',
    toCode: 'HWH',
    toLabel: 'Howrah Jn (HWH)',
    trainsNote: 'Mumbai–Howrah Mail · Gitanjali Exp · Duronto · LTT Express',
    corridorType: 'Return Trunk Line',
  },
  {
    fromCode: 'MMCT',
    fromLabel: 'Mumbai Central (MMCT)',
    toCode: 'NDLS',
    toLabel: 'New Delhi (NDLS)',
    trainsNote: 'Tejas Rajdhani · August Kranti Rajdhani · Custom Trains',
    corridorType: 'Western–Northern Corridor',
  },
];

export function PopularRoutesSection({
  language,
  onSelectCorridor,
  onGoHome,
}: PopularRoutesSectionProps) {
  const t = TRANSLATIONS[language];
  const [mumbaiImgErr, setMumbaiImgErr] = useState(false);
  const [howrahImgErr, setHowrahImgErr] = useState(false);

  return (
    <div id="popular-routes-section" className="bg-slate-50">
      {/* Compact Top Action Bar for Guide & Policy Screen */}
      {onGoHome && (
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onGoHome}
              className="min-h-[40px] px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-[#213D77] text-xs font-bold rounded-md inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.backToSearch}</span>
            </button>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">
              {t.navGuidePolicy}
            </span>
          </div>
        </div>
      )}

      {/* 4-Step Guide: How Sky Track Booking Works */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
            <div className="max-w-2xl">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#213D77] text-balance">
                {t.howItWorksHeading}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                {t.howItWorksSub}
              </p>
            </div>

            {/* MSME Udyam Trust Verification Block */}
            <div className="bg-[#F4F7FC] border border-[#213D77]/20 rounded-lg px-3.5 py-2.5 flex items-start gap-2.5 max-w-md">
              <Award className="w-5 h-5 text-[#213D77] shrink-0 mt-0.5" />
              <div>
                <div className="text-xs sm:text-sm font-bold text-[#213D77]">
                  {t.msmeBadgeTitle}
                </div>
                <div className="text-xs text-slate-600 mt-0.5 leading-snug">
                  {t.msmeBadgeSub}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {t.steps.map((item) => (
              <div
                key={item.num}
                className="p-4 bg-slate-50/70 border border-slate-200 rounded-lg flex flex-col justify-between"
              >
                <div>
                  <div className="font-mono text-sm font-extrabold text-[#FB792B] tabular-nums">
                    {item.num}.
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#213D77] mt-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Booking Corridors */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
        <div className="max-w-2xl mb-5">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#213D77] text-balance">
            {t.popularCorridorsHeading}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
            {t.popularCorridorsSub}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURED_CORRIDORS.map((route) => (
            <button
              key={`${route.fromCode}-${route.toCode}`}
              type="button"
              onClick={() => onSelectCorridor(route.fromCode, route.toCode)}
              className="group text-left bg-white border border-slate-200 hover:border-[#213D77] rounded-lg p-5 transition-colors flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="text-xs font-semibold text-slate-500 mb-2">
                  {route.corridorType}
                </div>
                <div className="flex items-center gap-2 text-base font-bold text-[#213D77]">
                  <span className="truncate">{route.fromLabel}</span>
                  <ArrowRight className="w-4 h-4 text-[#FB792B] shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  <span className="truncate">{route.toLabel}</span>
                </div>
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                  {route.trainsNote}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#FB792B] group-hover:text-[#213D77] transition-colors">
                <span>View Trains &amp; Request Booking</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Agency Presence: Zaveri Bazar Mumbai & Eastern Railways Specialty */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 pb-6 sm:pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Mumbai CSMT & Office Details */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col sm:flex-row">
            <div className="sm:w-2/5 relative min-h-[180px] bg-[#213D77]">
              {!mumbaiImgErr ? (
                <img
                  src="/src/assets/images/mumbai_csmt_heritage_1795296232254.jpg"
                  alt="Chhatrapati Shivaji Maharaj Terminus Mumbai near Zaveri Bazar"
                  referrerPolicy="no-referrer"
                  onError={() => setMumbaiImgErr(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-5 text-white text-center bg-gradient-to-br from-[#213D77] to-[#182D59]">
                  <TrainFront className="w-10 h-10 text-[#FB792B] mb-2" />
                  <span className="text-sm font-bold">Mumbai CSMT Hub</span>
                </div>
              )}
            </div>

            <div className="sm:w-3/5 p-4 sm:p-5 flex flex-col justify-between space-y-3">
              <div>
                <div className="text-xs font-bold text-[#FB792B]">
                  MSME Udyam Registered · Mumbai Head Office
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-[#213D77] mt-1">
                  SKY TRACK Authorized Travel Agency
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                  Serving business travelers, families, and Zaveri Bazar traders with reliable All-India railway, flight, and bus reservations, Tatkal desk support, and verified ticket delivery.
                </p>
              </div>

              <div className="space-y-1.5 text-xs sm:text-sm text-slate-700 pt-2.5 border-t border-slate-100">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#213D77] shrink-0 mt-0.5" />
                  <span>{AGENCY_CONTACT.fullAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#213D77] shrink-0" />
                  <span className="font-mono font-semibold tabular-nums">
                    {AGENCY_CONTACT.primaryPhoneDisplay} / {AGENCY_CONTACT.secondaryPhoneDisplay}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#213D77] shrink-0" />
                  <span>{AGENCY_CONTACT.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#213D77] shrink-0" />
                  <span>Payment Accepted: PhonePe · Google Pay · UPI · Office Cash</span>
                </div>
              </div>
            </div>
          </div>

          {/* Kolkata / Howrah Corridor Card */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
            <div className="h-40 relative bg-[#213D77]">
              {!howrahImgErr ? (
                <img
                  src="/src/assets/images/howrah_kolkata_corridor_1795296231480.jpg"
                  alt="Howrah Bridge and Kolkata railway corridor"
                  referrerPolicy="no-referrer"
                  onError={() => setHowrahImgErr(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-5 text-white text-center bg-gradient-to-br from-[#213D77] to-[#182D59]">
                  <TrainFront className="w-10 h-10 text-[#FB792B] mb-2" />
                  <span className="text-sm font-bold">Howrah Trunk Corridors</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#182D59]/80 via-[#182D59]/20 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <div className="text-xs font-semibold text-[#FB792B]">Specialty Rail Desk</div>
                <div className="text-sm sm:text-base font-bold">
                  Howrah ↔ Mumbai · Jaipur · Surat · Ahmedabad
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Dedicated booking desk for Eastern–Western business corridors including Howrah, Sealdah, Shalimar, Mumbai CSMT, LTT, Surat, Ahmedabad, and Jaipur — plus domestic/international flights and AC Sleeper buses.
              </p>
              <button
                type="button"
                onClick={() => onSelectCorridor('HWH', 'CSMT')}
                className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#213D77] hover:text-[#FB792B] transition-colors cursor-pointer"
              >
                <span>Search Howrah to Mumbai Trains</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Cancellation & Refund Policy Note */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 pb-8 sm:pb-12">
        <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <FileCheck2 className="w-5 h-5 text-[#213D77] shrink-0" />
              <h2 className="text-lg font-extrabold text-[#213D77]">
                {t.cancellationHeading}
              </h2>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <ShieldCheck className="w-4 h-4 text-[#213D77]" />
              <span>Standard IRCTC / Airline / Operator Rules Apply</span>
            </div>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
            {t.cancellationPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="font-mono text-xs font-bold text-[#FB792B] mt-0.5 tabular-nums">
                  0{idx + 1}.
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
