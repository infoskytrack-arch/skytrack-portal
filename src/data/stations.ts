import type { Station } from '../types';

export const INDIAN_STATIONS: Station[] = [
  // =========================================================================
  // WEST BENGAL
  // =========================================================================
  { code: 'HWH', name: 'HOWRAH JN', city: 'Kolkata', state: 'West Bengal', lat: 22.5839, lng: 88.3426, popular: true, aliases: ['calcutta', 'howrah'] },
  { code: 'SDAH', name: 'SEALDAH', city: 'Kolkata', state: 'West Bengal', lat: 22.5675, lng: 88.3704, popular: true, aliases: ['calcutta'] },
  { code: 'SHM', name: 'SHALIMAR', city: 'Kolkata', state: 'West Bengal', lat: 22.5568, lng: 88.3204, popular: true, aliases: ['calcutta'] },
  { code: 'SRC', name: 'SANTRAGACHI JN', city: 'Kolkata', state: 'West Bengal', lat: 22.5844, lng: 88.2839, popular: true },
  { code: 'KOAA', name: 'KOLKATA', city: 'Kolkata', state: 'West Bengal', lat: 22.6014, lng: 88.3859, popular: true, aliases: ['chitpur', 'calcutta'] },
  { code: 'BWN', name: 'BARDDHAMAN JN', city: 'Bardhaman', state: 'West Bengal', lat: 23.2504, lng: 87.8703, popular: true, aliases: ['burdwan'] },
  { code: 'MYM', name: 'MEMARI', city: 'Memari', state: 'West Bengal', lat: 23.1753, lng: 88.1066 },
  { code: 'DGR', name: 'DURGAPUR', city: 'Durgapur', state: 'West Bengal', lat: 23.4956, lng: 87.3198 },
  { code: 'ASN', name: 'ASANSOL JN', city: 'Asansol', state: 'West Bengal', lat: 23.6915, lng: 86.9746 },
  { code: 'KGP', name: 'KHARAGPUR JN', city: 'Kharagpur', state: 'West Bengal', lat: 22.3396, lng: 87.3250 },
  { code: 'MLDT', name: 'MALDA TOWN', city: 'Malda', state: 'West Bengal', lat: 25.0029, lng: 88.1333 },
  { code: 'NJP', name: 'NEW JALPAIGURI', city: 'Siliguri', state: 'West Bengal', lat: 26.6838, lng: 88.4426, popular: true, aliases: ['darjeeling'] },
  { code: 'SGUJ', name: 'SILIGURI JN', city: 'Siliguri', state: 'West Bengal', lat: 26.7327, lng: 88.4264 },
  { code: 'HLZ', name: 'HALDIA', city: 'Haldia', state: 'West Bengal', lat: 22.0258, lng: 88.0628 },
  { code: 'BHP', name: 'BOLPUR SHANTINIKETAN', city: 'Bolpur', state: 'West Bengal', lat: 23.6661, lng: 87.7027 },
  { code: 'RPH', name: 'RAMPURHAT JN', city: 'Rampurhat', state: 'West Bengal', lat: 24.1678, lng: 87.7785 },
  { code: 'BQA', name: 'BANKURA JN', city: 'Bankura', state: 'West Bengal', lat: 23.2266, lng: 87.0566 },
  { code: 'PRR', name: 'PURULIA JN', city: 'Purulia', state: 'West Bengal', lat: 23.3463, lng: 86.3652 },
  { code: 'NCB', name: 'NEW COOCH BEHAR', city: 'Cooch Behar', state: 'West Bengal', lat: 26.3519, lng: 89.4694 },

  // =========================================================================
  // MAHARASHTRA & GOA
  // =========================================================================
  { code: 'CSMT', name: 'MUMBAI CSMT', city: 'Mumbai', state: 'Maharashtra', lat: 18.9398, lng: 72.8355, popular: true, aliases: ['cstm', 'vt', 'bombay'] },
  { code: 'LTT', name: 'LOKMANYATILAK T', city: 'Mumbai', state: 'Maharashtra', lat: 19.0697, lng: 72.8919, popular: true, aliases: ['kurla', 'bombay'] },
  { code: 'MMCT', name: 'MUMBAI CENTRAL', city: 'Mumbai', state: 'Maharashtra', lat: 18.9696, lng: 72.8194, popular: true, aliases: ['bct', 'bombay'] },
  { code: 'BDTS', name: 'BANDRA TERMINUS', city: 'Mumbai', state: 'Maharashtra', lat: 19.0623, lng: 72.8414, popular: true, aliases: ['bombay'] },
  { code: 'DR', name: 'DADAR', city: 'Mumbai', state: 'Maharashtra', lat: 19.0183, lng: 72.8432, aliases: ['bombay'] },
  { code: 'TNA', name: 'THANE', city: 'Thane', state: 'Maharashtra', lat: 19.1860, lng: 72.9759 },
  { code: 'KYN', name: 'KALYAN JN', city: 'Kalyan', state: 'Maharashtra', lat: 19.2355, lng: 73.1306, popular: true },
  { code: 'BVI', name: 'BORIVALI', city: 'Mumbai', state: 'Maharashtra', lat: 19.2291, lng: 72.8573 },
  { code: 'PNVL', name: 'PANVEL', city: 'Navi Mumbai', state: 'Maharashtra', lat: 18.9904, lng: 73.1208 },
  { code: 'PUNE', name: 'PUNE JN', city: 'Pune', state: 'Maharashtra', lat: 18.5289, lng: 73.8744, popular: true, aliases: ['poona'] },
  { code: 'NGP', name: 'NAGPUR', city: 'Nagpur', state: 'Maharashtra', lat: 21.1522, lng: 79.0889, popular: true },
  { code: 'NK', name: 'NASHIK ROAD', city: 'Nashik', state: 'Maharashtra', lat: 19.9477, lng: 73.8424 },
  { code: 'MMR', name: 'MANMAD JN', city: 'Manmad', state: 'Maharashtra', lat: 20.2528, lng: 74.4398 },
  { code: 'BSL', name: 'BHUSAVAL JN', city: 'Bhusaval', state: 'Maharashtra', lat: 21.0457, lng: 75.7852 },
  { code: 'JL', name: 'JALGAON JN', city: 'Jalgaon', state: 'Maharashtra', lat: 21.0155, lng: 75.5656 },
  { code: 'AK', name: 'AKOLA JN', city: 'Akola', state: 'Maharashtra', lat: 20.7131, lng: 77.0110 },
  { code: 'G', name: 'GONDIA JN', city: 'Gondia', state: 'Maharashtra', lat: 21.4566, lng: 80.1945 },
  { code: 'KOP', name: 'KOLHAPUR SCSMT', city: 'Kolhapur', state: 'Maharashtra', lat: 16.7029, lng: 74.2383 },
  { code: 'SUR', name: 'SOLAPUR JN', city: 'Solapur', state: 'Maharashtra', lat: 17.6606, lng: 75.8935 },
  { code: 'AWB', name: 'CHHATRAPATI SAMBHAJINAGAR', city: 'Aurangabad', state: 'Maharashtra', lat: 19.8603, lng: 75.3113, aliases: ['aurangabad'] },
  { code: 'NED', name: 'HAZUR SAHIB NANDED', city: 'Nanded', state: 'Maharashtra', lat: 19.1604, lng: 77.3106 },
  { code: 'RN', name: 'RATNAGIRI', city: 'Ratnagiri', state: 'Maharashtra', lat: 16.9944, lng: 73.3375 },
  { code: 'SNSI', name: 'SAINAGAR SHIRDI', city: 'Shirdi', state: 'Maharashtra', lat: 19.7764, lng: 74.4795 },
  { code: 'MAO', name: 'MADGAON', city: 'Goa', state: 'Goa', lat: 15.2683, lng: 73.9701, popular: true, aliases: ['margao', 'goa'] },
  { code: 'VSG', name: 'VASCO DA GAMA', city: 'Goa', state: 'Goa', lat: 15.3991, lng: 73.8126, aliases: ['goa'] },

  // =========================================================================
  // RAJASTHAN
  // =========================================================================
  { code: 'JP', name: 'JAIPUR', city: 'Jaipur', state: 'Rajasthan', lat: 26.9196, lng: 75.7878, popular: true },
  { code: 'JU', name: 'JODHPUR JN', city: 'Jodhpur', state: 'Rajasthan', lat: 26.2837, lng: 73.0226, popular: true },
  { code: 'BKN', name: 'BIKANER JN', city: 'Bikaner', state: 'Rajasthan', lat: 28.0185, lng: 73.3108 },
  { code: 'AII', name: 'AJMER JN', city: 'Ajmer', state: 'Rajasthan', lat: 26.4566, lng: 74.6376 },
  { code: 'UDZ', name: 'UDAIPUR CITY', city: 'Udaipur', state: 'Rajasthan', lat: 24.5687, lng: 73.6980, popular: true },
  { code: 'KOTA', name: 'KOTA JN', city: 'Kota', state: 'Rajasthan', lat: 25.2233, lng: 75.8797 },
  { code: 'ABR', name: 'ABU ROAD', city: 'Mount Abu', state: 'Rajasthan', lat: 24.4774, lng: 72.7825 },
  { code: 'AWR', name: 'ALWAR', city: 'Alwar', state: 'Rajasthan', lat: 27.5529, lng: 76.6223 },
  { code: 'SWM', name: 'SAWAI MADHOPUR', city: 'Sawai Madhopur', state: 'Rajasthan', lat: 26.0173, lng: 76.3560 },
  { code: 'JSM', name: 'JAISALMER', city: 'Jaisalmer', state: 'Rajasthan', lat: 26.9124, lng: 70.9229 },
  { code: 'SGNR', name: 'SHRI GANGANAGAR', city: 'Sri Ganganagar', state: 'Rajasthan', lat: 29.9265, lng: 73.8772 },

  // =========================================================================
  // GUJARAT
  // =========================================================================
  { code: 'ADI', name: 'AHMEDABAD JN', city: 'Ahmedabad', state: 'Gujarat', lat: 23.0264, lng: 72.6010, popular: true, aliases: ['kalupur'] },
  { code: 'GNC', name: 'GANDHINAGAR CAPITAL', city: 'Gandhinagar', state: 'Gujarat', lat: 23.2298, lng: 72.6251 },
  { code: 'ST', name: 'SURAT', city: 'Surat', state: 'Gujarat', lat: 21.2049, lng: 72.8411, popular: true },
  { code: 'BRC', name: 'VADODARA JN', city: 'Vadodara', state: 'Gujarat', lat: 22.3106, lng: 73.1808, popular: true, aliases: ['baroda'] },
  { code: 'RJT', name: 'RAJKOT JN', city: 'Rajkot', state: 'Gujarat', lat: 22.3133, lng: 70.8027 },
  { code: 'OKHA', name: 'OKHA', city: 'Dwarka / Okha', state: 'Gujarat', lat: 22.4716, lng: 69.0762, aliases: ['dwarka'] },
  { code: 'JAM', name: 'JAMNAGAR', city: 'Jamnagar', state: 'Gujarat', lat: 22.4872, lng: 70.0528 },
  { code: 'GIMB', name: 'GANDHIDHAM BG', city: 'Gandhidham', state: 'Gujarat', lat: 23.0677, lng: 70.1322 },
  { code: 'BHUJ', name: 'BHUJ', city: 'Bhuj', state: 'Gujarat', lat: 23.2602, lng: 69.6872 },
  { code: 'VAPI', name: 'VAPI', city: 'Vapi', state: 'Gujarat', lat: 20.3717, lng: 72.9051 },
  { code: 'BL', name: 'VALSAD', city: 'Valsad', state: 'Gujarat', lat: 20.6093, lng: 72.9342 },
  { code: 'PBR', name: 'PORBANDAR', city: 'Porbandar', state: 'Gujarat', lat: 21.6480, lng: 69.6194 },
  { code: 'BH', name: 'BHARUCH JN', city: 'Bharuch', state: 'Gujarat', lat: 21.7051, lng: 72.9959 },
  { code: 'ANND', name: 'ANAND JN', city: 'Anand', state: 'Gujarat', lat: 22.5645, lng: 72.9570 },
  { code: 'MSH', name: 'MAHESANA JN', city: 'Mehsana', state: 'Gujarat', lat: 23.5978, lng: 72.3789 },
  { code: 'PNU', name: 'PALANPUR JN', city: 'Palanpur', state: 'Gujarat', lat: 24.1724, lng: 72.4267 },
  { code: 'BVC', name: 'BHAVNAGAR TERMINUS', city: 'Bhavnagar', state: 'Gujarat', lat: 21.7745, lng: 72.1422 },
  { code: 'VRL', name: 'VERAVAL', city: 'Somnath / Veraval', state: 'Gujarat', lat: 20.9159, lng: 70.3629, aliases: ['somnath'] },

  // =========================================================================
  // KARNATAKA, TAMIL NADU, TELANGANA, ANDHRA PRADESH, ODISHA & KERALA
  // =========================================================================
  { code: 'SMVB', name: 'SMVT BENGALURU', city: 'Bengaluru', state: 'Karnataka', lat: 12.9963, lng: 77.6499, popular: true, aliases: ['bangalore'] },
  { code: 'SBC', name: 'KSR BENGALURU', city: 'Bengaluru', state: 'Karnataka', lat: 12.9781, lng: 77.5697, popular: true, aliases: ['bangalore', 'majestic'] },
  { code: 'YPR', name: 'YESVANTPUR JN', city: 'Bengaluru', state: 'Karnataka', lat: 13.0238, lng: 77.5504, aliases: ['bangalore'] },
  { code: 'MYS', name: 'MYSURU JN', city: 'Mysuru', state: 'Karnataka', lat: 12.3156, lng: 76.6458, aliases: ['mysore'] },
  { code: 'UBL', name: 'SSS HUBBALLI JN', city: 'Hubballi', state: 'Karnataka', lat: 15.3458, lng: 75.1436, aliases: ['hubli'] },
  { code: 'BGM', name: 'BELAGAVI', city: 'Belagavi', state: 'Karnataka', lat: 15.8407, lng: 74.5106, aliases: ['belgaum'] },
  { code: 'MAQ', name: 'MANGALURU CENTRAL', city: 'Mangaluru', state: 'Karnataka', lat: 12.8634, lng: 74.8423, aliases: ['mangalore'] },
  { code: 'UD', name: 'UDUPI', city: 'Udupi', state: 'Karnataka', lat: 13.3461, lng: 74.7697 },
  { code: 'MAS', name: 'MGR CHENNAI CENTRAL', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2755, popular: true, aliases: ['madras'] },
  { code: 'MS', name: 'CHENNAI EGMORE', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0782, lng: 80.2614, aliases: ['madras'] },
  { code: 'CBE', name: 'COIMBATORE JN', city: 'Coimbatore', state: 'Tamil Nadu', lat: 10.9974, lng: 76.9668, popular: true },
  { code: 'MDU', name: 'MADURAI JN', city: 'Madurai', state: 'Tamil Nadu', lat: 9.9195, lng: 78.1095 },
  { code: 'TPJ', name: 'TIRUCHCHIRAPALLI', city: 'Trichy', state: 'Tamil Nadu', lat: 10.7950, lng: 78.6852, aliases: ['trichy'] },
  { code: 'SA', name: 'SALEM JN', city: 'Salem', state: 'Tamil Nadu', lat: 11.6698, lng: 78.1112 },
  { code: 'ED', name: 'ERODE JN', city: 'Erode', state: 'Tamil Nadu', lat: 11.3282, lng: 77.7263 },
  { code: 'KPD', name: 'KATPADI JN', city: 'Vellore', state: 'Tamil Nadu', lat: 12.9718, lng: 79.1381 },
  { code: 'RMM', name: 'RAMESWARAM', city: 'Rameswaram', state: 'Tamil Nadu', lat: 9.2820, lng: 79.3129 },
  { code: 'TEN', name: 'TIRUNELVELI', city: 'Tirunelveli', state: 'Tamil Nadu', lat: 8.7327, lng: 77.7097 },
  { code: 'CAPE', name: 'KANYAKUMARI', city: 'Kanyakumari', state: 'Tamil Nadu', lat: 8.0883, lng: 77.5495 },
  { code: 'PDY', name: 'PUDUCHERRY', city: 'Puducherry', state: 'Puducherry', lat: 11.9261, lng: 79.8286, aliases: ['pondicherry'] },
  { code: 'SC', name: 'SECUNDERABAD JN', city: 'Hyderabad', state: 'Telangana', lat: 17.4344, lng: 78.5013, popular: true },
  { code: 'HYB', name: 'HYDERABAD DECAN', city: 'Hyderabad', state: 'Telangana', lat: 17.3924, lng: 78.4673, aliases: ['nampally'] },
  { code: 'KCG', name: 'KACHEGUDA', city: 'Hyderabad', state: 'Telangana', lat: 17.3886, lng: 78.4998 },
  { code: 'WL', name: 'WARANGAL', city: 'Warangal', state: 'Telangana', lat: 17.9776, lng: 79.6095 },
  { code: 'VSKP', name: 'VISAKHAPATNAM', city: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.7222, lng: 83.2898, popular: true, aliases: ['vizag'] },
  { code: 'BZA', name: 'VIJAYAWADA JN', city: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5186, lng: 80.6200, popular: true },
  { code: 'TPTY', name: 'TIRUPATI', city: 'Tirupati', state: 'Andhra Pradesh', lat: 13.6288, lng: 79.4192 },
  { code: 'RU', name: 'RENIGUNTA JN', city: 'Tirupati', state: 'Andhra Pradesh', lat: 13.6352, lng: 79.5063 },
  { code: 'RJY', name: 'RAJAMUNDRY', city: 'Rajahmundry', state: 'Andhra Pradesh', lat: 16.9838, lng: 81.7876 },
  { code: 'GNT', name: 'GUNTUR JN', city: 'Guntur', state: 'Andhra Pradesh', lat: 16.2997, lng: 80.4430 },
  { code: 'NLR', name: 'NELLORE', city: 'Nellore', state: 'Andhra Pradesh', lat: 14.4526, lng: 79.9854 },
  { code: 'GTL', name: 'GUNTAKAL JN', city: 'Guntakal', state: 'Andhra Pradesh', lat: 15.1715, lng: 77.3679 },
  { code: 'BBS', name: 'BHUBANESWAR', city: 'Bhubaneswar', state: 'Odisha', lat: 20.2666, lng: 85.8436, popular: true },
  { code: 'PURI', name: 'PURI', city: 'Puri', state: 'Odisha', lat: 19.8087, lng: 85.8380, popular: true },
  { code: 'CTC', name: 'CUTTACK', city: 'Cuttack', state: 'Odisha', lat: 20.4638, lng: 85.8998 },
  { code: 'KUR', name: 'KHURDA ROAD JN', city: 'Khurda', state: 'Odisha', lat: 20.1558, lng: 85.7061 },
  { code: 'BAM', name: 'BRAHMAPUR', city: 'Berhampur', state: 'Odisha', lat: 19.3078, lng: 84.7981 },
  { code: 'ROU', name: 'ROURKELA', city: 'Rourkela', state: 'Odisha', lat: 22.2279, lng: 84.8632 },
  { code: 'JSG', name: 'JHARSUGUDA JN', city: 'Jharsuguda', state: 'Odisha', lat: 21.8554, lng: 84.0062 },
  { code: 'SBP', name: 'SAMBALPUR', city: 'Sambalpur', state: 'Odisha', lat: 21.4886, lng: 83.9912 },
  { code: 'ERS', name: 'ERNAKULAM JN', city: 'Kochi', state: 'Kerala', lat: 9.9692, lng: 76.2909, popular: true, aliases: ['cochin', 'kochi'] },
  { code: 'TVC', name: 'THIRUVANANTHAPURAM CENTRAL', city: 'Thiruvananthapuram', state: 'Kerala', lat: 8.4875, lng: 76.9525, popular: true, aliases: ['trivandrum'] },
  { code: 'CLT', name: 'KOZHIKODE', city: 'Kozhikode', state: 'Kerala', lat: 11.2464, lng: 75.7804, aliases: ['calicut'] },
  { code: 'TCR', name: 'THRISUR', city: 'Thrissur', state: 'Kerala', lat: 10.5143, lng: 76.2082 },
  { code: 'KTYM', name: 'KOTTAYAM', city: 'Kottayam', state: 'Kerala', lat: 9.5916, lng: 76.5313 },
  { code: 'CAN', name: 'KANNUR', city: 'Kannur', state: 'Kerala', lat: 11.8745, lng: 75.3704 },
  { code: 'SRR', name: 'SHORANUR JN', city: 'Shoranur', state: 'Kerala', lat: 10.7618, lng: 76.2711 },
  { code: 'PGT', name: 'PALAKKAD JN', city: 'Palakkad', state: 'Kerala', lat: 10.8055, lng: 76.6413 },

  // =========================================================================
  // DELHI NCR, UTTAR PRADESH, BIHAR, JHARKHAND & NORTH-EAST
  // =========================================================================
  { code: 'NDLS', name: 'NEW DELHI', city: 'New Delhi', state: 'Delhi', lat: 28.6429, lng: 77.2191, popular: true, aliases: ['delhi'] },
  { code: 'DLI', name: 'OLD DELHI', city: 'Delhi', state: 'Delhi', lat: 28.6619, lng: 77.2280, aliases: ['delhi'] },
  { code: 'ANVT', name: 'ANAND VIHAR TERMINUS', city: 'New Delhi', state: 'Delhi', lat: 28.6489, lng: 77.3155, aliases: ['delhi'] },
  { code: 'NZM', name: 'HAZRAT NIZAMUDDIN', city: 'New Delhi', state: 'Delhi', lat: 28.5878, lng: 77.2536, popular: true, aliases: ['delhi'] },
  { code: 'DEE', name: 'DELHI SARAI ROHILLA', city: 'Delhi', state: 'Delhi', lat: 28.6626, lng: 77.1856, aliases: ['delhi'] },
  { code: 'GZB', name: 'GHAZIABAD', city: 'Ghaziabad', state: 'Uttar Pradesh', lat: 28.6512, lng: 77.4285 },
  { code: 'BSB', name: 'VARANASI JN', city: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3268, lng: 82.9866, popular: true, aliases: ['banaras', 'kashi'] },
  { code: 'DDU', name: 'PT DEEN DAYAL UPADHYAYA JN', city: 'Mughalsarai', state: 'Uttar Pradesh', lat: 25.2804, lng: 83.1190, aliases: ['mgs', 'mughalsarai'] },
  { code: 'PRYJ', name: 'PRAYAGRAJ JN', city: 'Prayagraj', state: 'Uttar Pradesh', lat: 25.4448, lng: 81.8300, popular: true, aliases: ['ald', 'allahabad'] },
  { code: 'CNB', name: 'KANPUR CENTRAL', city: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4539, lng: 80.3510, popular: true },
  { code: 'LKO', name: 'LUCKNOW NR', city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8318, lng: 80.9191, popular: true, aliases: ['charbagh'] },
  { code: 'LJN', name: 'LUCKNOW NE', city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8310, lng: 80.9220 },
  { code: 'GKP', name: 'GORAKHPUR JN', city: 'Gorakhpur', state: 'Uttar Pradesh', lat: 26.7595, lng: 83.3818, popular: true },
  { code: 'AGC', name: 'AGRA CANTT', city: 'Agra', state: 'Uttar Pradesh', lat: 27.1578, lng: 77.9896 },
  { code: 'MTJ', name: 'MATHURA JN', city: 'Mathura', state: 'Uttar Pradesh', lat: 27.4744, lng: 77.6737 },
  { code: 'VGLJ', name: 'VIRANGANA LAKSHMIBAI JHANSI', city: 'Jhansi', state: 'Uttar Pradesh', lat: 25.4426, lng: 78.5546, aliases: ['jhs', 'jhansi'] },
  { code: 'AYC', name: 'AYODHYA CANTT', city: 'Ayodhya', state: 'Uttar Pradesh', lat: 26.7745, lng: 82.1449, aliases: ['faizabad', 'fzd'] },
  { code: 'MB', name: 'MORADABAD', city: 'Moradabad', state: 'Uttar Pradesh', lat: 28.8286, lng: 78.7652 },
  { code: 'BE', name: 'BAREILLY', city: 'Bareilly', state: 'Uttar Pradesh', lat: 28.3489, lng: 79.4090 },
  { code: 'SRE', name: 'SAHARANPUR JN', city: 'Saharanpur', state: 'Uttar Pradesh', lat: 29.9640, lng: 77.5460 },
  { code: 'PNBE', name: 'PATNA JN', city: 'Patna', state: 'Bihar', lat: 25.6031, lng: 85.1376, popular: true },
  { code: 'RJPB', name: 'RAJENDRANAGAR T', city: 'Patna', state: 'Bihar', lat: 25.5985, lng: 85.1618 },
  { code: 'DNR', name: 'DANAPUR', city: 'Patna', state: 'Bihar', lat: 25.5819, lng: 85.0436 },
  { code: 'GAYA', name: 'GAYA JN', city: 'Gaya', state: 'Bihar', lat: 24.8037, lng: 84.9994 },
  { code: 'MFP', name: 'MUZAFFARPUR JN', city: 'Muzaffarpur', state: 'Bihar', lat: 26.1225, lng: 85.3802 },
  { code: 'DBG', name: 'DARBHANGA JN', city: 'Darbhanga', state: 'Bihar', lat: 26.1542, lng: 85.9016 },
  { code: 'BGP', name: 'BHAGALPUR', city: 'Bhagalpur', state: 'Bihar', lat: 25.2425, lng: 86.9746 },
  { code: 'BJU', name: 'BARAUNI JN', city: 'Barauni', state: 'Bihar', lat: 25.4776, lng: 86.0012 },
  { code: 'KIR', name: 'KATIHAR JN', city: 'Katihar', state: 'Bihar', lat: 25.5416, lng: 87.5719 },
  { code: 'SHC', name: 'SAHARSA JN', city: 'Saharsa', state: 'Bihar', lat: 25.8774, lng: 86.5966 },
  { code: 'RNC', name: 'RANCHI', city: 'Ranchi', state: 'Jharkhand', lat: 23.3510, lng: 85.3340, popular: true },
  { code: 'HTE', name: 'HATIA', city: 'Ranchi', state: 'Jharkhand', lat: 23.3075, lng: 85.3025 },
  { code: 'TATA', name: 'TATANAGAR JN', city: 'Jamshedpur', state: 'Jharkhand', lat: 22.7689, lng: 86.2007 },
  { code: 'DHN', name: 'DHANBAD JN', city: 'Dhanbad', state: 'Jharkhand', lat: 23.7905, lng: 86.4288 },
  { code: 'BKSC', name: 'BOKARO STEEL CITY', city: 'Bokaro', state: 'Jharkhand', lat: 23.6693, lng: 86.1011 },
  { code: 'JSME', name: 'JASIDIH JN', city: 'Deoghar', state: 'Jharkhand', lat: 24.5142, lng: 86.6458 },
  { code: 'GHY', name: 'GUWAHATI', city: 'Guwahati', state: 'Assam', lat: 26.1823, lng: 91.7507, popular: true },
  { code: 'KYQ', name: 'KAMAKHYA', city: 'Guwahati', state: 'Assam', lat: 26.1566, lng: 91.7019 },
  { code: 'DBRG', name: 'DIBRUGARH', city: 'Dibrugarh', state: 'Assam', lat: 27.4728, lng: 94.9120 },
  { code: 'SCL', name: 'SILCHAR', city: 'Silchar', state: 'Assam', lat: 24.8333, lng: 92.7789 },
  { code: 'DMV', name: 'DIMAPUR', city: 'Dimapur', state: 'Nagaland', lat: 25.9102, lng: 93.7267 },
  { code: 'AGTL', name: 'AGARTALA', city: 'Agartala', state: 'Tripura', lat: 23.7937, lng: 91.2827 },

  // =========================================================================
  // CENTRAL & NORTH INDIA
  // =========================================================================
  { code: 'BPL', name: 'BHOPAL JN', city: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2673, lng: 77.4133, popular: true },
  { code: 'RKMP', name: 'RANI KAMALAPATI', city: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2211, lng: 77.4397, aliases: ['hbj', 'habibganj'] },
  { code: 'INDB', name: 'INDORE JN BG', city: 'Indore', state: 'Madhya Pradesh', lat: 22.7176, lng: 75.8685, popular: true },
  { code: 'JBP', name: 'JABALPUR', city: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.1656, lng: 79.9507 },
  { code: 'GWL', name: 'GWALIOR', city: 'Gwalior', state: 'Madhya Pradesh', lat: 26.2156, lng: 78.1828 },
  { code: 'UJN', name: 'UJJAIN JN', city: 'Ujjain', state: 'Madhya Pradesh', lat: 23.1765, lng: 75.7885 },
  { code: 'ET', name: 'ITARSI JN', city: 'Itarsi', state: 'Madhya Pradesh', lat: 22.6079, lng: 77.7676 },
  { code: 'RTM', name: 'RATLAM JN', city: 'Ratlam', state: 'Madhya Pradesh', lat: 23.3342, lng: 75.0480 },
  { code: 'KTE', name: 'KATNI JN', city: 'Katni', state: 'Madhya Pradesh', lat: 23.8343, lng: 80.3894 },
  { code: 'STA', name: 'SATNA JN', city: 'Satna', state: 'Madhya Pradesh', lat: 24.5739, lng: 80.8322 },
  { code: 'BINA', name: 'BINA JN', city: 'Bina', state: 'Madhya Pradesh', lat: 24.1754, lng: 78.1889 },
  { code: 'BSP', name: 'BILASPUR JN', city: 'Bilaspur', state: 'Chhattisgarh', lat: 22.0616, lng: 82.1645 },
  { code: 'R', name: 'RAIPUR JN', city: 'Raipur', state: 'Chhattisgarh', lat: 21.2568, lng: 81.6296, popular: true },
  { code: 'DURG', name: 'DURG', city: 'Durg', state: 'Chhattisgarh', lat: 21.1966, lng: 81.2849 },
  { code: 'ASR', name: 'AMRITSAR JN', city: 'Amritsar', state: 'Punjab', lat: 31.6331, lng: 74.8673, popular: true },
  { code: 'LDH', name: 'LUDHIANA JN', city: 'Ludhiana', state: 'Punjab', lat: 30.9120, lng: 75.8485 },
  { code: 'JUC', name: 'JALANDHAR CITY', city: 'Jalandhar', state: 'Punjab', lat: 31.3316, lng: 75.5920 },
  { code: 'BTI', name: 'BATHINDA JN', city: 'Bathinda', state: 'Punjab', lat: 30.2110, lng: 74.9455 },
  { code: 'PTKC', name: 'PATHANKOT CANTT', city: 'Pathankot', state: 'Punjab', lat: 32.2643, lng: 75.6522 },
  { code: 'CDG', name: 'CHANDIGARH', city: 'Chandigarh', state: 'Chandigarh', lat: 30.7016, lng: 76.8219, popular: true },
  { code: 'UMB', name: 'AMBALA CANT JN', city: 'Ambala', state: 'Haryana', lat: 30.3398, lng: 76.8295 },
  { code: 'PNP', name: 'PANIPAT JN', city: 'Panipat', state: 'Haryana', lat: 29.3909, lng: 76.9635 },
  { code: 'HSR', name: 'HISAR JN', city: 'Hisar', state: 'Haryana', lat: 29.1539, lng: 75.7229 },
  { code: 'HW', name: 'HARIDWAR JN', city: 'Haridwar', state: 'Uttarakhand', lat: 29.9482, lng: 78.1558 },
  { code: 'DDN', name: 'DEHRADUN', city: 'Dehradun', state: 'Uttarakhand', lat: 30.3142, lng: 78.0332 },
  { code: 'KGM', name: 'KATHGODAM', city: 'Nainital / Haldwani', state: 'Uttarakhand', lat: 29.2602, lng: 79.5469, aliases: ['nainital', 'haldwani'] },
  { code: 'RK', name: 'ROORKEE', city: 'Roorkee', state: 'Uttarakhand', lat: 29.8543, lng: 77.8880 },
  { code: 'JAT', name: 'JAMMU TAWI', city: 'Jammu', state: 'Jammu & Kashmir', lat: 32.7064, lng: 74.8808, popular: true },
  { code: 'SVDK', name: 'SHMATA VD KATRA', city: 'Katra', state: 'Jammu & Kashmir', lat: 32.9897, lng: 74.9317, aliases: ['vaishno devi', 'katra'] },
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
    const aliasesL = station.aliases ?? [];
    const combined = `${nameL} - ${codeL}`;

    if (codeL === trimmed || combined === trimmed || aliasesL.includes(trimmed)) {
      exactCode.push(station);
    } else if (codeL.startsWith(trimmed) || aliasesL.some((a) => a.startsWith(trimmed))) {
      startsCode.push(station);
    } else if (nameL.startsWith(trimmed) || cityL.startsWith(trimmed)) {
      startsName.push(station);
    } else if (
      nameL.includes(trimmed) ||
      codeL.includes(trimmed) ||
      cityL.includes(trimmed) ||
      stateL.includes(trimmed) ||
      aliasesL.some((a) => a.includes(trimmed))
    ) {
      containsAny.push(station);
    }
  }

  return [...exactCode, ...startsCode, ...startsName, ...containsAny].slice(0, limit);
}
