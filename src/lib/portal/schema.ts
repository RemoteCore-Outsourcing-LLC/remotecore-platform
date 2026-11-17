import { z } from "zod";

const txt = (max: number) => z.string().trim().max(max);
const opt = (max: number) => txt(max).optional().or(z.literal("")).transform((v) => (v ? v : null));
const year = z.union([z.coerce.number().int().min(1950).max(2100), z.literal("").transform(() => null), z.null()]).optional();
const day = z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("").transform(() => null), z.null()]).optional();

export const LEVELS = ["Basic", "Conversational", "Fluent", "Native"] as const;
export const ARRANGEMENTS = ["Full time", "Part time", "Contract", "Freelance"] as const;

export const sections = {
  about: z.object({
    full_name: txt(200).min(2, "Enter your full name."),
    phone: txt(40).regex(/^\+\d{1,4} \d{6,14}$/, "Enter a valid mobile number."),
    country: txt(100).min(2, "Choose your country."),
    headline: opt(120),
    summary: opt(2000),
  }),
  work_prefs: z.object({
    expected_salary: z.coerce.number({ invalid_type_error: "Enter a number." }).positive("Enter the pay you expect.").max(10_000_000),
    salary_currency: txt(3).length(3),
    employment_types: z.array(z.enum(ARRANGEMENTS)).min(1, "Choose at least one."),
    preferred_categories: z.array(txt(80)).min(1, "Choose at least one."),
    available_from: day,
    preferred_hours: opt(120),
    time_zone: txt(64).min(2, "Choose your time zone."),
    years_experience: z.union([z.coerce.number().int().min(0).max(60), z.literal("").transform(() => null)]).optional(),
  }),
  computer: z.object({
    computer_type: z.enum(["Desktop", "Laptop"], { errorMap: () => ({ message: "Choose desktop or laptop." }) }),
    operating_system: txt(60).min(2, "Enter your operating system."),
    processor: txt(80).min(2, "Enter your processor."),
    ram: txt(40).min(1, "Enter your memory."),
    storage: txt(40).min(1, "Enter your free storage."),
    connection_type: txt(60).min(2, "Choose your connection type."),
    download_mbps: z.coerce.number({ invalid_type_error: "Enter a number." }).min(0).max(100000),
    upload_mbps: z.coerce.number({ invalid_type_error: "Enter a number." }).min(0).max(100000),
    has_webcam: z.boolean(),
    has_microphone: z.boolean(),
    other_equipment: opt(500),
  }),
  work: z.array(z.object({
    company: txt(150).min(1, "Enter the company."), title: txt(150).min(1, "Enter your job title."),
    start_date: day, end_date: day, description: opt(2000),
  })).max(30),
  education: z.array(z.object({
    school: txt(150).min(1, "Enter the school."), degree: opt(150), field: opt(150), start_year: year, end_year: year,
  })).max(20),
  certs: z.object({
    qualifications: opt(2000),
    items: z.array(z.object({ name: txt(150).min(1, "Enter the certificate name."), issuer: opt(150), year })).max(30),
  }),
  skills: z.object({
    skills: z.array(txt(60).min(1)).max(40),
    languages: z.array(z.object({ language: txt(60).min(1, "Enter the language."), level: z.enum(LEVELS) })).min(1, "Add at least one language.").max(15),
  }),
};

export type SectionKey = keyof typeof sections;
