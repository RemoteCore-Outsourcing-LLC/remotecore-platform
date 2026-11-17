import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { SITE } from "./layout";

// A signed link that turns off job alerts without logging in. The secret never leaves the server.
const secret = () => process.env.EMAIL_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const sign = (uid: string) => createHmac("sha256", secret()).update(`alerts:${uid}`).digest("base64url").slice(0, 32);

export const unsubscribeUrl = (uid: string) => `${SITE}/api/unsubscribe?u=${uid}&t=${sign(uid)}`;

export function validUnsubscribe(uid: string, token: string) {
  if (!/^[0-9a-f-]{36}$/i.test(uid) || !token || !secret()) return false;
  const a = Buffer.from(sign(uid)), b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
