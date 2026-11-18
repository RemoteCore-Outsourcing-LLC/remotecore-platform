import { z } from "zod";

// One set of rules for every job post, used by employers and by the RemoteCore team.
export const issues = (e: z.ZodError) => Object.fromEntries(e.issues.map((i) => [String(i.path[0]), i.message]));
export const today = () => new Date().toISOString().slice(0, 10);

const num = z.union([z.number(), z.string()]).transform((v) => (v === "" || v === null ? null : Number(v)))
  .refine((v) => v === null || (Number.isFinite(v) && v >= 0 && v < 10_000_000), "Enter a number.");

export const jobSchema = z.object({
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

// Shapes a checked job for the database.
export function jobRow(j: z.output<typeof jobSchema>) {
  return {
    ...j, location_restrictions: j.remote_type === "location_restricted" ? j.location_restrictions : null,
    computer_requirements: j.computer_requirements || null, documents_required: j.documents_required || null,
    skills: Array.from(new Set(j.skills.map((s) => s.trim()))),
  };
}
