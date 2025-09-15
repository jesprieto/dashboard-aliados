export interface AllyProfile {
  businessName: string;
  contactNumber: string;
  avatarDataUrl: string | null; // data URL for demo; later can be Supabase Storage URL
}

const STORAGE_KEY = "synergy_profile";

const DEFAULT_PROFILE: AllyProfile = {
  businessName: "Aliado Synergy",
  contactNumber: "",
  avatarDataUrl: null,
};

export function loadProfile(): AllyProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as AllyProfile;
    return {
      businessName: parsed.businessName ?? DEFAULT_PROFILE.businessName,
      contactNumber: parsed.contactNumber ?? DEFAULT_PROFILE.contactNumber,
      avatarDataUrl: parsed.avatarDataUrl ?? DEFAULT_PROFILE.avatarDataUrl,
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: AllyProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}
