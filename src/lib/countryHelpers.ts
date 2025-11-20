// Country code mapping for East African countries
export const COUNTRY_PHONE_CODES: Record<string, string> = {
  "Kenya": "+254",
  "Uganda": "+256",
  "Tanzania": "+255",
  "Rwanda": "+250",
  "Burundi": "+257",
  "South Sudan": "+211",
  "Ethiopia": "+251",
  "Somalia": "+252",
  "Djibouti": "+253",
};

export const getCountryPhoneCode = (country: string): string => {
  return COUNTRY_PHONE_CODES[country] || "+254"; // Default to Kenya
};
