import { COUNTRIES, TOP_COUNTRIES } from "@/lib/geo";

// The most common countries first, a divider, then every country A to Z.
export function CountryOptions() {
  return (
    <>
      {TOP_COUNTRIES.map((n) => <option key={`top-${n}`}>{n}</option>)}
      <option disabled>──────────</option>
      {COUNTRIES.map((c) => <option key={c.code}>{c.name}</option>)}
    </>
  );
}
