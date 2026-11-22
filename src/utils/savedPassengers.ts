import {
  BERTH_PREFERENCES,
  ID_PROOF_OPTIONS,
  type BerthPreference,
  type GenderType,
  type IdProofType,
  type PassengerDetail,
} from '../types';

const STORAGE_KEY = 'skytrack_saved_passenger_profile_v1';

export interface SavedPassengerItem {
  name: string;
  age: string;
  gender: GenderType;
  berthPreference: BerthPreference;
  idProofType: IdProofType;
}

export interface SavedPassengerProfile {
  passengers: SavedPassengerItem[];
  mobile: string;
  alternatePhone?: string;
  email?: string;
  savedAt: string;
}

const VALID_GENDERS = new Set<GenderType>(['Male', 'Female', 'Transgender']);
const VALID_BERTHS = new Set<BerthPreference>(BERTH_PREFERENCES);
const VALID_IDS = new Set<IdProofType>(ID_PROOF_OPTIONS.map((opt) => opt.value));

export function loadSavedPassengerProfile(): SavedPassengerProfile | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedPassengerProfile>;
    if (!Array.isArray(parsed.passengers) || parsed.passengers.length === 0) {
      return null;
    }

    const sanitizedPassengers: SavedPassengerItem[] = parsed.passengers
      .slice(0, 6)
      .map((item) => {
        const name = typeof item?.name === 'string' ? item.name.trim().slice(0, 80) : '';
        const age = typeof item?.age === 'string' ? item.age.replace(/\D/g, '').slice(0, 3) : '';
        const gender: GenderType = VALID_GENDERS.has(item?.gender as GenderType)
          ? (item.gender as GenderType)
          : 'Male';
        const berthPreference: BerthPreference = VALID_BERTHS.has(
          item?.berthPreference as BerthPreference
        )
          ? (item.berthPreference as BerthPreference)
          : 'No Preference';
        const idProofType: IdProofType = VALID_IDS.has(item?.idProofType as IdProofType)
          ? (item.idProofType as IdProofType)
          : '';
        return { name, age, gender, berthPreference, idProofType };
      })
      .filter((p) => p.name.length > 0);

    if (sanitizedPassengers.length === 0) return null;

    const mobile =
      typeof parsed.mobile === 'string' ? parsed.mobile.replace(/\D/g, '').slice(-10) : '';
    const alternatePhone =
      typeof parsed.alternatePhone === 'string'
        ? parsed.alternatePhone.replace(/\D/g, '').slice(-10)
        : undefined;
    const email =
      typeof parsed.email === 'string' ? parsed.email.trim().slice(0, 120) : undefined;

    return {
      passengers: sanitizedPassengers,
      mobile,
      alternatePhone: alternatePhone || undefined,
      email: email || undefined,
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function savePassengerProfile(params: {
  passengers: PassengerDetail[];
  mobile: string;
  alternatePhone?: string;
  email?: string;
}): void {
  try {
    const cleanedPassengers: SavedPassengerItem[] = params.passengers
      .slice(0, 6)
      .map((p) => ({
        name: p.name.trim().slice(0, 80),
        age: String(p.age).replace(/\D/g, '').slice(0, 3),
        gender: p.gender,
        berthPreference: p.berthPreference,
        idProofType: p.idProofType,
      }))
      .filter((p) => p.name.length > 0);

    if (cleanedPassengers.length === 0) return;

    const payload: SavedPassengerProfile = {
      passengers: cleanedPassengers,
      mobile: params.mobile.replace(/\D/g, '').slice(-10),
      alternatePhone: params.alternatePhone
        ? params.alternatePhone.replace(/\D/g, '').slice(-10)
        : undefined,
      email: params.email?.trim().slice(0, 120) || undefined,
      savedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota or private browsing errors gracefully
  }
}

export function clearSavedPassengerProfile(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors gracefully
  }
}
