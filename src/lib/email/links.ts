import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { SITE } from "./layout";

// Signed links that turn off an email list without logging in. The secret never leaves the server.
// "alerts" = weekly job alerts, "reminders" = the unfinished profile reminders.
export type EmailList = "alerts" | "reminders";
const secret = () => process.env.EMAIL_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const sign = (uid: string, list: EmailList) => createHmac("sha256", secret()).update(`${list}:${uid}`).digest("base64url").slice(0, 32);

export const unsubscribeUrl = (uid: string, list: EmailList = "alerts") =>
  `${SITE}/api/unsubscribe?u=${uid}&t=${sign(uid, list)}${list === "alerts" ? "" : `&list=${list}`}`;

export function validUnsubscribe(uid: string, token: string, list: EmailList = "alerts") {
  if (!/^[0-9a-f-]{36}$/i.test(uid) || !token || !secret()) return false;
  const a = Buffer.from(sign(uid, list)), b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
