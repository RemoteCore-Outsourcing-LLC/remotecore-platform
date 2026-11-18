import { countries } from "countries-list";

// Same order on the server and in the browser (localeCompare differs between them for names with accents).
const plain = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export type Country = { code: string; name: string; dial: string; currency: string };

export const COUNTRIES: Country[] = Object.entries(countries)
  .map(([code, c]) => ({ code, name: c.name, dial: c.phone[0] ? `+${c.phone[0]}` : "", currency: c.currency[0] ?? "USD" }))
  .filter((c) => c.dial)
  .sort((a, b) => (plain(a.name) < plain(b.name) ? -1 : plain(a.name) > plain(b.name) ? 1 : 0));

export const CURRENCIES: string[] = Array.from(new Set(["USD", "EUR", "GBP", "CAD", "AUD", ...COUNTRIES.map((c) => c.currency)])).filter(Boolean);

export const countryByName = (name: string) => COUNTRIES.find((c) => c.name === name);
