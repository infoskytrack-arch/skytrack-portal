export interface AirportOption {
  code: string;
  city: string;
  airportName: string;
}

export const MAJOR_AIRPORTS: AirportOption[] = [
  { code: 'BOM', city: 'Mumbai', airportName: 'Chhatrapati Shivaji Maharaj Intl' },
  { code: 'CCU', city: 'Kolkata', airportName: 'Netaji Subhas Chandra Bose Intl' },
  { code: 'DEL', city: 'New Delhi', airportName: 'Indira Gandhi International' },
  { code: 'JAI', city: 'Jaipur', airportName: 'Jaipur International Airport' },
  { code: 'AMD', city: 'Ahmedabad', airportName: 'Sardar Vallabhbhai Patel Intl' },
  { code: 'STV', city: 'Surat', airportName: 'Surat International Airport' },
  { code: 'BLR', city: 'Bengaluru', airportName: 'Kempegowda International' },
  { code: 'MAA', city: 'Chennai', airportName: 'Chennai International Airport' },
  { code: 'HYD', city: 'Hyderabad', airportName: 'Rajiv Gandhi International' },
  { code: 'PNQ', city: 'Pune', airportName: 'Pune International Airport' },
  { code: 'PAT', city: 'Patna', airportName: 'Jay Prakash Narayan Airport' },
  { code: 'VNS', city: 'Varanasi', airportName: 'Lal Bahadur Shastri Intl' },
  { code: 'LKO', city: 'Lucknow', airportName: 'Chaudhary Charan Singh Intl' },
  { code: 'GOI', city: 'Goa (Dabolim)', airportName: 'Goa International Airport' },
  { code: 'GOX', city: 'Goa (Mopa)', airportName: 'Manohar International Airport' },
  { code: 'GAU', city: 'Guwahati', airportName: 'Lokpriya Gopinath Bordoloi Intl' },
  { code: 'IXB', city: 'Bagdogra / Siliguri', airportName: 'Bagdogra Airport' },
  { code: 'COK', city: 'Kochi', airportName: 'Cochin International Airport' },
  { code: 'BBI', city: 'Bhubaneswar', airportName: 'Biju Patnaik International' },
  { code: 'IXR', city: 'Ranchi', airportName: 'Birsa Munda Airport' },
  { code: 'NAG', city: 'Nagpur', airportName: 'Dr. Babasaheb Ambedkar Intl' },
  { code: 'IDR', city: 'Indore', airportName: 'Devi Ahilya Bai Holkar Airport' },
  { code: 'UDR', city: 'Udaipur', airportName: 'Maharana Pratap Airport' },
  { code: 'JDH', city: 'Jodhpur', airportName: 'Jodhpur Airport' },
  { code: 'ATQ', city: 'Amritsar', airportName: 'Sri Guru Ram Dass Jee Intl' },
  { code: 'IXC', city: 'Chandigarh', airportName: 'Shaheed Bhagat Singh Intl' },
  { code: 'DXB', city: 'Dubai (Intl)', airportName: 'Dubai International Airport' },
  { code: 'SIN', city: 'Singapore (Intl)', airportName: 'Changi International Airport' },
  { code: 'BKK', city: 'Bangkok (Intl)', airportName: 'Suvarnabhumi Airport' },
];

export const BUS_CITIES: string[] = [
  'Mumbai',
  'Pune',
  'Surat',
  'Ahmedabad',
  'Vadodara',
  'Rajkot',
  'Jaipur',
  'Udaipur',
  'Jodhpur',
  'Goa (Panjim / Mapusa)',
  'Shirdi',
  'Nashik',
  'Indore',
  'Nagpur',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Siliguri',
  'Digha',
  'Puri',
  'Bhubaneswar',
  'New Delhi',
  'Agra',
  'Lucknow',
  'Varanasi',
  'Patna',
];

export const FLIGHT_CABIN_CLASSES = [
  'Economy',
  'Premium Economy',
  'Business',
  'First Class',
] as const;

export const FLIGHT_BAGGAGE_MEAL_OPTIONS = [
  'Standard (No Extra Baggage / Meal)',
  'Extra Check-in Baggage (+15 kg)',
  'Pre-Booked Veg Meal',
  'Pre-Booked Non-Veg Meal',
  'Extra Baggage (+15 kg) + Veg Meal',
  'Extra Baggage (+15 kg) + Non-Veg Meal',
] as const;

export const BUS_COACH_PREFERENCES = [
  'AC Sleeper (2+1)',
  'AC Seater / Pushback',
  'AC Volvo Multi-Axle Sleeper',
  'AC Volvo Multi-Axle Seater',
  'Non-AC Sleeper',
  'Non-AC Seater',
] as const;

export const BUS_TIME_WINDOWS = [
  'Any Time',
  'Morning (6:00 AM – 12:00 PM)',
  'Afternoon (12:00 PM – 6:00 PM)',
  'Evening / Overnight (6:00 PM – 12:00 AM)',
] as const;
