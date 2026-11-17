import type { SupabaseClient } from "@supabase/supabase-js";
import { JOB_COLUMNS, type JobRow } from "@/lib/portal/seeker";

// One search used by the public job board and the job seeker portal.

export const PER_PAGE = 20;
export const TYPES: [string, string][] = [["full_time", "Full time"], ["part_time", "Part time"], ["contract", "Contract"], ["freelance", "Freelance"]];
export const LEVELS: [string, string][] = [["entry", "Entry level"], ["mid", "Mid level"], ["senior", "Senior"]];
export const REMOTE: [string, string][] = [["fully_remote", "Fully remote"], ["location_restricted", "Some locations only"]];
export const PAY: [string, string][] = [["500", "$500 a month or more"], ["1000", "$1,000 a month or more"], ["1500", "$1,500 a month or more"], ["2000", "$2,000 a month or more"], ["3000", "$3,000 a month or more"]];

export type Filters = { q: string; category: string; type: string; level: string; remote: string; country: string; pay: string; page: number };
type Params = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined, max = 100) => (Array.isArray(v) ? v[0] : v ?? "").trim().slice(0, max);
const pick = (v: string, list: [string, string][]) => (list.some(([k]) => k === v) ? v : "");

export function readFilters(p: Params): Filters {
  return {
    q: one(p.q, 120),
    category: /^\d{1,4}$/.test(one(p.category)) ? one(p.category) : "",
    type: pick(one(p.type), TYPES),
    level: pick(one(p.level), LEVELS),
    remote: pick(one(p.remote), REMOTE),
    country: one(p.country, 80),
    pay: pick(one(p.pay), PAY),
    page: Math.min(Math.max(parseInt(one(p.page)) || 1, 1), 100),
  };
}

export const activeCount = (f: Filters) => [f.category, f.type, f.level, f.remote, f.country, f.pay].filter(Boolean).length;

export function filterUrl(base: string, f: Filters, change: Partial<Filters> = {}) {
  const next = { ...f, ...change };
  const qs = new URLSearchParams();
  (["q", "category", "type", "level", "remote", "country", "pay"] as const).forEach((k) => { if (next[k]) qs.set(k, String(next[k])); });
  if (next.page > 1) qs.set("page", String(next.page));
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

export async function searchJobs(sb: SupabaseClient, f: Filters) {
  const { data, error } = await sb.rpc("search_jobs", {
    q: f.q || null,
    category: f.category ? Number(f.category) : null,
    types: f.type ? [f.type] : null,
    levels: f.level ? [f.level] : null,
    remote: f.remote || null,
    country: f.country || null,
    pay_min: f.pay ? Number(f.pay) : null,
    lim: PER_PAGE,
    off: (f.page - 1) * PER_PAGE,
  });
  if (error || !data?.length) return { jobs: [] as JobRow[], total: 0, failed: !!error };
  const ids = (data as { id: string; total: number }[]).map((r) => r.id);
  const { data: rows } = await sb.from("jobs").select(JOB_COLUMNS).in("id", ids);
  const byId = new Map(((rows ?? []) as unknown as JobRow[]).map((j) => [j.id, j]));
  return { jobs: ids.map((id) => byId.get(id)).filter(Boolean) as JobRow[], total: Number(data[0].total), failed: false };
}

export async function categories(sb: SupabaseClient) {
  const { data } = await sb.from("job_categories").select("id, name").order("sort");
  return (data ?? []) as { id: number; name: string }[];
}
