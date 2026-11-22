import type { Station } from '../types';

export const INDIAN_STATIONS: Station[] = [
  // West Bengal
  { code: 'HWH', name: 'HOWRAH JN', city: 'Kolkata', state: 'West Bengal', popular: true },
  { code: 'SDAH', name: 'SEALDAH', city: 'Kolkata', state: 'West Bengal', popular: true },
  { code: 'SHM', name: 'SHALIMAR', city: 'Kolkata', state: 'West Bengal', popular: true },
  { code: 'SRC', name: 'SANTRAGACHI JN', city: 'Kolkata', state: 'West Bengal', popular: true },
  { code: 'KOAA', name: 'KOLKATA', city: 'Kolkata', state: 'West Bengal', popular: true },
  { code: 'BWN', name: 'BARDDHAMAN JN', city: 'Bardhaman', state: 'West Bengal', popular: true },
  { code: 'MYM', name: 'MEMARI', city: 'Memari', state: 'West Bengal' },
  { code: 'DGR', name: 'DURGAPUR', city: 'Durgapur', state: 'West Bengal' },
  { code: 'ASN', name: 'ASANSOL JN', city: 'Asansol', state: 'West Bengal' },
  { code: 'KGP', name: 'KHARAGPUR JN', city: 'Kharagpur', state: 'West Bengal' },
  { code: 'MLDT', name: 'MALDA TOWN', city: 'Malda', state: 'West Bengal' },
  { code: 'NJP', name: 'NEW JALPAIGURI', city: 'Siliguri', state: 'West Bengal', popular: true },
  { code: 'SGUJ', name: 'SILIGURI JN', city: 'Siliguri', state: 'West Bengal' },
  { code: 'HLZ', name: 'HALDIA', city: 'Haldia', state: 'West Bengal' },
  { code: 'BHP', name: 'BOLPUR SHANTINIKETAN', city: 'Bolpur', state: 'West Bengal' },

  // Maharashtra
  { code: 'CSMT', name: 'MUMBAI CSMT', city: 'Mumbai', state: 'Maharashtra', popular: true },
  { code: 'LTT', name: 'LOKMANYATILAK T', city: 'Mumbai', state: 'Maharashtra', popular: true },
  { code: 'MMCT', name: 'MUMBAI CENTRAL', city: 'Mumbai', state: 'Maharashtra', popular: true },
  { code: 'BDTS', name: 'BANDRA TERMINUS', city: 'Mumbai', state: 'Maharashtra', popular: true },
  { code: 'DR', name: 'DADAR', city: 'Mumbai', state: 'Maharashtra' },
  { code: 'TNA', name: 'THANE', city: 'Thane', state: 'Maharashtra' },
  { code: 'KYN', name: 'KALYAN JN', city: 'Kalyan', state: 'Maharashtra', popular: true },
  { code: 'BVI', name: 'BORIVALI', city: 'Mumbai', state: 'Maharashtra' },
  { code: 'PNVL', name: 'PANVEL', city: 'Navi Mumbai', state: 'Maharashtra' },
  { code: 'PUNE', name: 'PUNE JN', city: 'Pune', state: 'Maharashtra', popular: true },
  { code: 'NGP', name: 'NAGPUR', city: 'Nagpur', state: 'Maharashtra', popular: true },
  { code: 'NK', name: 'NASHIK ROAD', city: 'Nashik', state: 'Maharashtra' },
  { code: 'MMR', name: 'MANMAD JN', city: 'Manmad', state: 'Maharashtra' },
  { code: 'BSL', name: 'BHUSAVAL JN', city: 'Bhusaval', state: 'Maharashtra' },
  { code: 'JL', name: 'JALGAON JN', city: 'Jalgaon', state: 'Maharashtra' },
  { code: 'AK', name: 'AKOLA JN', city: 'Akola', state: 'Maharashtra' },
  { code: 'KOP', name: 'KOLHAPUR SCSMT', city: 'Kolhapur', state: 'Maharashtra' },
  { code: 'SUR', name: 'SOLAPUR JN', city: 'Solapur', state: 'Maharashtra' },
  { code: 'AWB', name: 'AURANGABAD', city: 'Aurangabad', state: 'Maharashtra' },
  { code: 'RN', name: 'RATNAGIRI', city: 'Ratnagiri', state: 'Maharashtra' },
  { code: 'MAO', name: 'MADGAON', city: 'Goa', state: 'Goa', popular: true },

  // Rajasthan
  { code: 'JP', name: 'JAIPUR', city: 'Jaipur', state: 'Rajasthan', popular: true },
  { code: 'JU', name: 'JODHPUR JN', city: 'Jodhpur', state: 'Rajasthan', popular: true },
  { code: 'BKN', name: 'BIKANER JN', city: 'Bikaner', state: 'Rajasthan' },
  { code: 'AII', name: 'AJMER JN', city: 'Ajmer', state: 'Rajasthan' },
  { code: 'UDZ', name: 'UDAIPUR CITY', city: 'Udaipur', state: 'Rajasthan', popular: true },
  { code: 'KOTA', name: 'KOTA JN', city: 'Kota', state: 'Rajasthan' },
  { code: 'ABR', name: 'ABU ROAD', city: 'Mount Abu', state: 'Rajasthan' },
  { code: 'AWR', name: 'ALWAR', city: 'Alwar', state: 'Rajasthan' },
  { code: 'SWM', name: 'SAWAI MADHOPUR', city: 'Sawai Madhopur', state: 'Rajasthan' },
  { code: 'JSM', name: 'JAISALMER', city: 'Jaisalmer', state: 'Rajasthan' },

  // Gujarat
  { code: 'ADI', name: 'AHMEDABAD JN', city: 'Ahmedabad', state: 'Gujarat', popular: true },
  { code: 'ST', name: 'SURAT', city: 'Surat', state: 'Gujarat', popular: true },
  { code: 'BRC', name: 'VADODARA JN', city: 'Vadodara', state: 'Gujarat', popular: true },
  { code: 'RJT', name: 'RAJKOT JN', city: 'Rajkot', state: 'Gujarat' },
  { code: 'OKHA', name: 'OKHA', city: 'Dwarka / Okha', state: 'Gujarat' },
  { code: 'JAM', name: 'JAMNAGAR', city: 'Jamnagar', state: 'Gujarat' },
  { code: 'GIMB', name: 'GANDHIDHAM BG', city: 'Gandhidham', state: 'Gujarat' },
  { code: 'BHUJ', name: 'BHUJ', city: 'Bhuj', state: 'Gujarat' },
  { code: 'VAPI', name: 'VAPI', city: 'Vapi', state: 'Gujarat' },
  { code: 'BL', name: 'VALSAD', city: 'Valsad', state: 'Gujarat' },
  { code: 'PBR', name: 'PORBANDAR', city: 'Porbandar', state: 'Gujarat' },
  { code: 'BH', name: 'BHARUCH JN', city: 'Bharuch', state: 'Gujarat' },
  { code: 'ANND', name: 'ANAND JN', city: 'Anand', state: 'Gujarat' },
  { code: 'MSH', name: 'MAHESANA JN', city: 'Mehsana', state: 'Gujarat' },
  { code: 'PNU', name: 'PALANPUR JN', city: 'Palanpur', state: 'Gujarat' },
  { code: 'BVC', name: 'BHAVNAGAR TERMINUS', city: 'Bhavnagar', state: 'Gujarat' },

  // Karnataka & South India
  { code: 'SMVB', name: 'SMVT BENGALURU', city: 'Bengaluru', state: 'Karnataka', popular: true },
  { code: 'SBC', name: 'KSR BENGALURU', city: 'Bengaluru', state: 'Karnataka', popular: true },
  { code: 'YPR', name: 'YESVANTPUR JN', city: 'Bengaluru', state: 'Karnataka' },
  { code: 'MYS', name: 'MYSURU JN', city: 'Mysuru', state: 'Karnataka' },
  { code: 'UBL', name: 'SSS HUBBALLI JN', city: 'Hubballi', state: 'Karnataka' },
  { code: 'MAQ', name: 'MANGALURU CENTRAL', city: 'Mangaluru', state: 'Karnataka' },
  { code: 'MAS', name: 'MGR CHENNAI CENTRAL', city: 'Chennai', state: 'Tamil Nadu', popular: true },
  { code: 'MS', name: 'CHENNAI EGMORE', city: 'Chennai', state: 'Tamil Nadu' },
  { code: 'CBE', name: 'COIMBATORE JN', city: 'Coimbatore', state: 'Tamil Nadu' },
  { code: 'MDU', name: 'MADURAI JN', city: 'Madurai', state: 'Tamil Nadu' },
  { code: 'TPJ', name: 'TIRUCHCHIRAPALLI', city: 'Trichy', state: 'Tamil Nadu' },
  { code: 'SA', name: 'SALEM JN', city: 'Salem', state: 'Tamil Nadu' },
  { code: 'KPD', name: 'KATPADI JN', city: 'Vellore', state: 'Tamil Nadu' },
  { code: 'CAPE', name: 'KANYAKUMARI', city: 'Kanyakumari', state: 'Tamil Nadu' },
  { code: 'SC', name: 'SECUNDERABAD JN', city: 'Hyderabad', state: 'Telangana', popular: true },
  { code: 'HYB', name: 'HYDERABAD DECAN', city: 'Hyderabad', state: 'Telangana' },
  { code: 'KCG', name: 'KACHEGUDA', city: 'Hyderabad', state: 'Telangana' },
  { code: 'VSKP', name: 'VISAKHAPATNAM', city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  { code: 'BZA', name: 'VIJAYAWADA JN', city: 'Vijayawada', state: 'Andhra Pradesh' },
  { code: 'TPTY', name: 'TIRUPATI', city: 'Tirupati', state: 'Andhra Pradesh' },
  { code: 'RJY', name: 'RAJAMUNDRY', city: 'Rajahmundry', state: 'Andhra Pradesh' },
  { code: 'BBS', name: 'BHUBANESWAR', city: 'Bhubaneswar', state: 'Odisha', popular: true },
  { code: 'PURI', name: 'PURI', city: 'Puri', state: 'Odisha', popular: true },
  { code: 'CTC', name: 'CUTTACK', city: 'Cuttack', state: 'Odisha' },
  { code: 'ROU', name: 'ROURKELA', city: 'Rourkela', state: 'Odisha' },
  { code: 'SBP', name: 'SAMBALPUR', city: 'Sambalpur', state: 'Odisha' },
  { code: 'ERS', name: 'ERNAKULAM JN', city: 'Kochi', state: 'Kerala' },
  { code: 'TVC', name: 'THIRUVANANTHAPURAM CENTRAL', city: 'Thiruvananthapuram', state: 'Kerala' },
  { code: 'CLT', name: 'KOZHIKODE', city: 'Kozhikode', state: 'Kerala' },
  { code: 'TCR', name: 'THRISUR', city: 'Thrissur', state: 'Kerala' },

  // Delhi, UP, Bihar, Jharkhand & North-East
  { code: 'NDLS', name: 'NEW DELHI', city: 'New Delhi', state: 'Delhi', popular: true },
  { code: 'DLI', name: 'OLD DELHI', city: 'Delhi', state: 'Delhi' },
  { code: 'ANVT', name: 'ANAND VIHAR TERMINUS', city: 'New Delhi', state: 'Delhi' },
  { code: 'NZM', name: 'HAZRAT NIZAMUDDIN', city: 'New Delhi', state: 'Delhi', popular: true },
  { code: 'DEE', name: 'DELHI SARAI ROHILLA', city: 'Delhi', state: 'Delhi' },
  { code: 'GZB', name: 'GHAZIABAD', city: 'Ghaziabad', state: 'Uttar Pradesh' },
  { code: 'BSB', name: 'VARANASI JN', city: 'Varanasi', state: 'Uttar Pradesh', popular: true },
  { code: 'DDU', name: 'PT DEEN DAYAL UPADHYAYA JN', city: 'Mughalsarai', state: 'Uttar Pradesh' },
  { code: 'PRYJ', name: 'PRAYAGRAJ JN', city: 'Prayagraj', state: 'Uttar Pradesh', popular: true },
  { code: 'CNB', name: 'KANPUR CENTRAL', city: 'Kanpur', state: 'Uttar Pradesh' },
  { code: 'LKO', name: 'LUCKNOW NR', city: 'Lucknow', state: 'Uttar Pradesh', popular: true },
  { code: 'LJN', name: 'LUCKNOW NE', city: 'Lucknow', state: 'Uttar Pradesh' },
  { code: 'GKP', name: 'GORAKHPUR JN', city: 'Gorakhpur', state: 'Uttar Pradesh' },
  { code: 'AGC', name: 'AGRA CANTT', city: 'Agra', state: 'Uttar Pradesh' },
  { code: 'MTJ', name: 'MATHURA JN', city: 'Mathura', state: 'Uttar Pradesh' },
  { code: 'VGLJ', name: 'VIRANGANA LAKSHMIBAI JHANSI', city: 'Jhansi', state: 'Uttar Pradesh' },
  { code: 'AYC', name: 'AYODHYA CANTT', city: 'Ayodhya', state: 'Uttar Pradesh' },
  { code: 'MB', name: 'MORADABAD', city: 'Moradabad', state: 'Uttar Pradesh' },
  { code: 'BE', name: 'BAREILLY', city: 'Bareilly', state: 'Uttar Pradesh' },
  { code: 'PNBE', name: 'PATNA JN', city: 'Patna', state: 'Bihar', popular: true },
  { code: 'RJPB', name: 'RAJENDRANAGAR T', city: 'Patna', state: 'Bihar' },
  { code: 'DNR', name: 'DANAPUR', city: 'Patna', state: 'Bihar' },
  { code: 'GAYA', name: 'GAYA JN', city: 'Gaya', state: 'Bihar' },
  { code: 'MFP', name: 'MUZAFFARPUR JN', city: 'Muzaffarpur', state: 'Bihar' },
  { code: 'DBG', name: 'DARBHANGA JN', city: 'Darbhanga', state: 'Bihar' },
  { code: 'BGP', name: 'BHAGALPUR', city: 'Bhagalpur', state: 'Bihar' },
  { code: 'BJU', name: 'BARAUNI JN', city: 'Barauni', state: 'Bihar' },
  { code: 'KIR', name: 'KATIHAR JN', city: 'Katihar', state: 'Bihar' },
  { code: 'RNC', name: 'RANCHI', city: 'Ranchi', state: 'Jharkhand' },
  { code: 'TATA', name: 'TATANAGAR JN', city: 'Jamshedpur', state: 'Jharkhand' },
  { code: 'DHN', name: 'DHANBAD JN', city: 'Dhanbad', state: 'Jharkhand' },
  { code: 'BKSC', name: 'BOKARO STEEL CITY', city: 'Bokaro', state: 'Jharkhand' },
  { code: 'JSME', name: 'JASIDIH JN', city: 'Deoghar', state: 'Jharkhand' },
  { code: 'GHY', name: 'GUWAHATI', city: 'Guwahati', state: 'Assam', popular: true },
  { code: 'KYQ', name: 'KAMAKHYA', city: 'Guwahati', state: 'Assam' },
  { code: 'DBRG', name: 'DIBRUGARH', city: 'Dibrugarh', state: 'Assam' },

  // Central & North India
  { code: 'BPL', name: 'BHOPAL JN', city: 'Bhopal', state: 'Madhya Pradesh' },
  { code: 'RKMP', name: 'RANI KAMALAPATI', city: 'Bhopal', state: 'Madhya Pradesh' },
  { code: 'INDB', name: 'INDORE JN BG', city: 'Indore', state: 'Madhya Pradesh' },
  { code: 'JBP', name: 'JABALPUR', city: 'Jabalpur', state: 'Madhya Pradesh' },
  { code: 'GWL', name: 'GWALIOR', city: 'Gwalior', state: 'Madhya Pradesh' },
  { code: 'UJN', name: 'UJJAIN JN', city: 'Ujjain', state: 'Madhya Pradesh' },
  { code: 'ET', name: 'ITARSI JN', city: 'Itarsi', state: 'Madhya Pradesh' },
  { code: 'RTM', name: 'RATLAM JN', city: 'Ratlam', state: 'Madhya Pradesh' },
  { code: 'BSP', name: 'BILASPUR JN', city: 'Bilaspur', state: 'Chhattisgarh' },
  { code: 'R', name: 'RAIPUR JN', city: 'Raipur', state: 'Chhattisgarh' },
  { code: 'DURG', name: 'DURG', city: 'Durg', state: 'Chhattisgarh' },
  { code: 'ASR', name: 'AMRITSAR JN', city: 'Amritsar', state: 'Punjab' },
  { code: 'LDH', name: 'LUDHIANA JN', city: 'Ludhiana', state: 'Punjab' },
  { code: 'JUC', name: 'JALANDHAR CITY', city: 'Jalandhar', state: 'Punjab' },
  { code: 'CDG', name: 'CHANDIGARH', city: 'Chandigarh', state: 'Chandigarh' },
  { code: 'UMB', name: 'AMBALA CANT JN', city: 'Ambala', state: 'Haryana' },
  { code: 'HW', name: 'HARIDWAR JN', city: 'Haridwar', state: 'Uttarakhand' },
  { code: 'DDN', name: 'DEHRADUN', city: 'Dehradun', state: 'Uttarakhand' },
  { code: 'JAT', name: 'JAMMU TAWI', city: 'Jammu', state: 'Jammu & Kashmir' },
  { code: 'SVDK', name: 'SHMATA VD KATRA', city: 'Katra', state: 'Jammu & Kashmir' },
];

export function formatStationLabel(station: Station): string {
  return `${station.name} - ${station.code}`;
}

export function findStationByCode(code: string): Station | undefined {
  const normalized = code.trim().toUpperCase();
  return INDIAN_STATIONS.find((s) => s.code === normalized);
}

export function searchStations(query: string, limit = 16): Station[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return INDIAN_STATIONS.filter((s) => s.popular).slice(0, limit);
  }

  const exactCode: Station[] = [];
  const startsCode: Station[] = [];
  const startsName: Station[] = [];
  const containsAny: Station[] = [];

  for (const station of INDIAN_STATIONS) {
    const codeL = station.code.toLowerCase();
    const nameL = station.name.toLowerCase();
    const cityL = station.city.toLowerCase();
    const stateL = station.state.toLowerCase();
    const combined = `${nameL} - ${codeL}`;

    if (codeL === trimmed || combined === trimmed) {
      exactCode.push(station);
    } else if (codeL.startsWith(trimmed)) {
      startsCode.push(station);
    } else if (nameL.startsWith(trimmed) || cityL.startsWith(trimmed)) {
      startsName.push(station);
    } else if (
      nameL.includes(trimmed) ||
      codeL.includes(trimmed) ||
      cityL.includes(trimmed) ||
      stateL.includes(trimmed)
    ) {
      containsAny.push(station);
    }
  }

  return [...exactCode, ...startsCode, ...startsName, ...containsAny].slice(0, limit);
}
