import { countries } from "countries-list";

export type Country = { code: string; name: string; dial: string; currency: string };

export const COUNTRIES: Country[] = Object.entries(countries)
  .map(([code, c]) => ({ code, name: c.name, dial: c.phone[0] ? `+${c.phone[0]}` : "", currency: c.currency[0] ?? "USD" }))
  .filter((c) => c.dial)
  .sort((a, b) => a.name.localeCompare(b.name));

export const CURRENCIES: string[] = Array.from(new Set(["USD", "EUR", "GBP", "CAD", "AUD", ...COUNTRIES.map((c) => c.currency)])).filter(Boolean);

export const countryByName = (name: string) => COUNTRIES.find((c) => c.name === name);
