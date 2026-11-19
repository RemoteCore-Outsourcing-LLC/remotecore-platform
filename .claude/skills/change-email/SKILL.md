---
name: change-email
description: Change the words in an email the RemoteCore platform sends (application received, status updates, welcome, job alerts, invoices, employer emails, team alerts). Use when someone says "change the email", "reword the welcome email", "the email says", "update the message people get".
---

# Change the words in an email

## 1. Find the email
All email words are in `src/lib/email/templates.ts`. Each email is one function with a comment above it:
- `applicationReceived`, `statusChanged` (with the `STATUS` list): job seekers, about applications
- `welcomeSeeker`, `jobAlert`: job seekers
- `employerWelcome`, `employerApproved`, `jobApproved`, `jobNeedsChanges`, `staffingRequestReceived`, `recruitmentUpdate`, `teamReply`: employers
- `invoiceReady`, `paymentReceived`: payments
- `newApplicationAdmin`, `newSeekerAdmin`, `newEmployerAdmin` and the other `...Admin` ones: alerts to the RemoteCore team
- `formReceived`, `formAdmin`: the website forms

## 2. Two emails are different
`authConfirm` (confirm your email) and `authRecovery` (reset your password) are sent by Supabase, not by this code.
Changing them here alone does nothing. After changing them here, the same text must be pasted in
Supabase, Authentication, Email Templates. Tell them that, or tell them to ask their developer.

## 3. Change it
- Each email has: the subject, a short preview line, a heading, paragraphs, and sometimes a button.
- Change only the words. Keep things like `${a.job}` or `${first(a.name)}` exactly as they are: they fill in the
  person's name, the job title and so on.
- Keep `esc(...)` around anything that comes from a person (names, messages). It keeps the email safe.
- Keep it short. People read these on phones.

## 4. Check
- Run `npm run build`. It must finish with no errors.
- Show them the new subject and text, with sample values filled in (for example the name "Maria").
- Then use the `publish-change` skill. The next email of that kind uses the new words.
