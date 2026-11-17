import playwright from "/Users/nathanael/Documents/CLAUDE PROJECTS/scrollcraft/builds/remotecore/node_modules/playwright-core/index.js"; const { chromium } = playwright;
import { createClient } from "@supabase/supabase-js";
const out = "/private/tmp/claude-501/-Users-nathanael-Documents-CLAUDE-PROJECTS-SOLUMBRA-OS/35cb6588-450e-4d44-8c61-0aa24463df85/scratchpad/shots", URL = process.env.NEXT_PUBLIC_SUPABASE_URL, admin = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const email = `nathanael+applytest${Date.now()}@solumbra.ai`, pw = "Test-pass-12345", log = (...a) => console.log(...a);
const { data: { user } } = await admin.auth.admin.createUser({ email, password: pw, email_confirm: true, user_metadata: { role: "job_seeker", full_name: "Maria Santos", phone: "+63 9171234567", country: "Philippines" } });
const uid = user.id; const base = "http://localhost:4590";
try {
  await admin.storage.from("resumes").upload(`${uid}/resume-1.pdf`, new Blob(["%PDF-1.4 cv"], { type: "application/pdf" }));
  await admin.from("seeker_profiles").update({ resume_path: `${uid}/resume-1.pdf`, headline: "Customer support specialist, 4 years" }).eq("user_id", uid);
  const { data: job } = await admin.from("jobs").select("id").eq("title", "Customer Support Representative").single();
  const b = await chromium.launch({ channel: "chrome" });
  for (const [tag, vp] of [["desk", { width: 1440, height: 900 }], ["phone", { width: 390, height: 844 }]]) {
    const p = await (await b.newContext({ viewport: vp })).newPage(); p.on("pageerror", (e) => log("PAGEERR", e.message));
    await p.goto(base + "/login"); await p.fill("input[type=email]", email); await p.fill("input[type=password]", pw);
    await Promise.all([p.waitForURL(/\/portal/), p.click("button[type=submit]")]);
    await p.goto(base + "/portal/jobs/" + job.id, { waitUntil: "networkidle" });
    if (tag === "desk") {
      await p.check(".apply__ok input"); await p.click("text=Send application"); log("no doc ->", await p.locator(".apply .ferr").innerText());
      await p.fill(".apply textarea", "Four years answering chats and emails for US software companies. Typing 52 words a minute.");
      await p.setInputFiles(".apply input[type=file]", "/private/tmp/claude-501/-Users-nathanael-Documents-CLAUDE-PROJECTS-SOLUMBRA-OS/35cb6588-450e-4d44-8c61-0aa24463df85/scratchpad/typing-test.pdf"); await p.waitForSelector(".apply__docs li");
    }
    await p.locator("#apply").scrollIntoViewIfNeeded(); await p.screenshot({ path: `${out}/${tag}-apply.png`, fullPage: true });
    if (tag === "desk") {
      await p.click("text=Send application"); await p.waitForSelector(".apply--done"); log("confirm ->", (await p.locator(".apply--done p").first().innerText()));
      await p.screenshot({ path: `${out}/desk-applied.png`, fullPage: true });
      const { data: app } = await admin.from("applications").select("id, status, note, resume_path, extra_documents, created_at").eq("seeker_id", uid).single();
      log("app:", app.status, "| resume copy:", app.resume_path.includes("applied-"), "| docs:", app.extra_documents.length, "| at:", app.created_at);
      const snap = await admin.storage.from("resumes").list(uid); log("files in resume folder:", snap.data.map((f) => f.name).join(", "));
      const { data: notes } = await admin.from("notifications").select("title").eq("user_id", uid); log("notification:", notes.map((n) => n.title).join(", "));
      const anon = createClient(URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); await anon.auth.signInWithPassword({ email, password: pw });
      const edit = await anon.from("applications").update({ note: "changed" }).eq("id", app.id); log("seeker edit blocked:", !!edit.error);
      const st = await anon.from("applications").update({ status: "selected" }).eq("id", app.id); log("seeker status change blocked:", !!st.error);
      const again = await anon.from("applications").insert({ job_id: job.id, seeker_id: uid }); log("double apply blocked:", !!again.error);
      for (const s of ["under_review", "shortlisted", "interview_stage"]) await admin.from("applications").update({ status: s }).eq("id", app.id);
      const { data: hist } = await admin.from("application_status_history").select("to_status").eq("application_id", app.id).order("changed_at");
      log("history:", hist.map((h) => h.to_status).join(" > "));
      await p.reload({ waitUntil: "networkidle" }); log("job page after:", await p.locator(".apply--sent h2").innerText());
    }
    await p.goto(base + "/portal/applications", { waitUntil: "networkidle" }); await p.click("summary"); 
    await p.screenshot({ path: `${out}/${tag}-apps.png`, fullPage: true });
  }
  await b.close();
} catch (e) { log("FAIL", e.message); }
for (const bk of ["resumes", "documents"]) { const { data } = await admin.storage.from(bk).list(uid); if (data?.length) await admin.storage.from(bk).remove(data.map((f) => `${uid}/${f.name}`)); }
await admin.auth.admin.deleteUser(uid); log("throwaway deleted");
