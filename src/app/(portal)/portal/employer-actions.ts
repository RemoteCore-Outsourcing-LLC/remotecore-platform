"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { notifyJobSubmitted, notifyStaffingRequest } from "@/lib/email/notify";

type Result = { ok: boolean; message?: string; errors?: Record<string, string>; id?: string };
const UUID = /^[0-9a-f-]{36}$/i;

// The signed in employer and their company. Only approved companies can post (row level security agrees).
async function employer() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { sb, user: null, company: null };
  const { data: company } = await sb.from("companies").select("id, name, status, contact_person, email, phone, industry").eq("owner_id", user.id).maybeSingle();
  return { sb, user, company };
}
const issues = (e: z.ZodError) => Object.fromEntries(e.issues.map((i) => [String(i.path[0]), i.message]));
const today = () => new Date().toISOString().slice(0, 10);

const num = z.union([z.number(), z.string()]).transform((v) => (v === "" || v === null ? null : Number(v)))
  .refine((v) => v === null || (Number.isFinite(v) && v >= 0 && v < 10_000_000), "Enter a number.");

const jobSchema = z.object({
  title: z.string().trim().min(3, "Enter the job title.").max(120),
  category_id: z.coerce.number().int().positive("Choose a category."),
  description: z.string().trim().min(50, "Describe the role in at least 50 characters.").max(8000),
  skills: z.array(z.string().trim().min(1).max(40)).min(1, "Add at least one skill.").max(20, "Up to 20 skills."),
  qualifications: z.string().trim().min(10, "List the qualifications and experience you need.").max(3000),
  experience_level: z.enum(["entry", "mid", "senior"], { message: "Choose the experience level." }),
  salary_min: num, salary_max: num,
  salary_currency: z.string().trim().length(3),
  salary_period: z.enum(["hour", "week", "month", "year"]),
  employment_type: z.enum(["full_time", "part_time", "contract", "freelance"], { message: "Choose the employment type." }),
  remote_type: z.enum(["fully_remote", "location_restricted"]),
  location_restrictions: z.string().trim().max(300),
  computer_requirements: z.string().trim().max(2000),
  hours_time_zone: z.string().trim().min(3, "Enter the working hours and time zone.").max(200),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the application deadline."),
  documents_required: z.string().trim().max(500),
}).superRefine((j, ctx) => {
  if (j.salary_min === null && j.salary_max === null) ctx.addIssue({ code: "custom", path: ["salary_min"], message: "Enter the pay, or at least the lowest amount." });
  if (j.salary_min !== null && j.salary_max !== null && j.salary_max < j.salary_min) ctx.addIssue({ code: "custom", path: ["salary_max"], message: "The highest pay must be more than the lowest." });
  if (j.remote_type === "location_restricted" && j.location_restrictions.length < 2) ctx.addIssue({ code: "custom", path: ["location_restrictions"], message: "Say which countries or regions can apply." });
  if (j.deadline < today()) ctx.addIssue({ code: "custom", path: ["deadline"], message: "Choose a date in the future." });
});
export type JobInput = z.input<typeof jobSchema>;

// Create or edit a job. mode "draft" keeps it private; "submit" sends it to RemoteCore for review.
export async function saveJob(input: JobInput, opts: { id?: string; mode: "draft" | "submit" }): Promise<Result> {
  const { sb, user, company } = await employer();
  if (!user) return { ok: false, message: "Please log in again." };
  if (company?.status !== "approved") return { ok: false, message: "Your company account needs to be approved before you can post jobs." };
  const parsed = jobSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: issues(parsed.error), message: "Please check the fields marked in red." };
  const j = parsed.data;
  const row = {
    ...j, location_restrictions: j.remote_type === "location_restricted" ? j.location_restrictions : null,
    computer_requirements: j.computer_requirements || null, documents_required: j.documents_required || null,
    skills: Array.from(new Set(j.skills.map((s) => s.trim()))),
  };

  if (opts.id) {
    if (!UUID.test(opts.id)) return { ok: false, message: "Unknown job." };
    const { data: before } = await sb.from("jobs").select("status").eq("id", opts.id).maybeSingle();
    if (!before) return { ok: false, message: "Unknown job." };
    const status = opts.mode === "draft" ? (before.status === "draft" ? "draft" : before.status) : before.status === "draft" || before.status === "closed" ? "pending" : before.status;
    const { data, error } = await sb.from("jobs").update({ ...row, status }).eq("id", opts.id).select("id, status").single();
    if (error || !data) return { ok: false, message: "We could not save this job. Please try again." };
    if (data.status === "pending" && before.status !== "pending") await notifyJobSubmitted(data.id, before.status !== "draft");
    revalidatePath("/portal", "layout");
    return { ok: true, id: data.id };
  }
  const { data, error } = await sb.from("jobs")
    .insert({ ...row, company_id: company.id, created_by: user.id, status: opts.mode === "draft" ? "draft" : "pending" })
    .select("id, status").single();
  if (error || !data) return { ok: false, message: "We could not save this job. Please try again." };
  if (data.status === "pending") await notifyJobSubmitted(data.id, false);
  revalidatePath("/portal", "layout");
  return { ok: true, id: data.id };
}

// Pause, close or turn back on. The database decides whether turning on needs a new review.
export async function setJobStatus(id: string, status: "paused" | "closed" | "published"): Promise<Result> {
  const { sb, user, company } = await employer();
  if (!user || !company) return { ok: false, message: "Please log in again." };
  if (!UUID.test(id)) return { ok: false, message: "Unknown job." };
  const { error } = await sb.from("jobs").update({ status }).eq("id", id).eq("company_id", company.id);
  if (error) return { ok: false, message: status === "published" ? "This job needs a new review first. Open it and send it for review." : "That did not work. Please try again." };
  revalidatePath("/portal", "layout");
  return { ok: true };
}

const requestSchema = z.object({
  position: z.string().trim().min(2, "Enter the position or service you need.").max(200),
  number_needed: z.coerce.number().int().min(1, "At least 1.").max(500),
  skills: z.string().trim().min(5, "List the skills and qualifications.").max(3000),
  experience_level: z.enum(["entry", "mid", "senior"], { message: "Choose the experience level." }),
  compensation: z.string().trim().min(2, "Enter the pay range you have in mind.").max(200),
  region: z.string().trim().max(200),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the start date."),
  details: z.string().trim().max(4000),
  phone: z.string().trim().max(40),
  fee_acknowledged: z.literal(true, { message: "Please tick the box to continue." }),
});
export type RequestInput = z.input<typeof requestSchema>;

export async function createStaffingRequest(input: RequestInput): Promise<Result> {
  const { sb, user, company } = await employer();
  if (!user) return { ok: false, message: "Please log in again." };
  if (company?.status !== "approved") return { ok: false, message: "Your company account needs to be approved first." };
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: issues(parsed.error), message: "Please check the fields marked in red." };
  const r = parsed.data;
  if (r.start_date < today()) return { ok: false, errors: { start_date: "Choose a date in the future." } };
  const { data, error } = await sb.from("staffing_requests").insert({
    company_id: company.id, created_by: user.id,
    company_name: company.name, contact_name: company.contact_person, email: company.email, phone: r.phone || company.phone, industry: company.industry,
    position: r.position, number_needed: r.number_needed, skills: r.skills, experience_level: r.experience_level,
    compensation: r.compensation, region: r.region || null, start_date: r.start_date, details: r.details || null, fee_acknowledged: true,
  }).select("id").single();
  if (error || !data) return { ok: false, message: "We could not send your request. Please try again." };
  await notifyStaffingRequest(data.id);
  revalidatePath("/portal", "layout");
  return { ok: true, id: data.id };
}
