// Where to go after logging in. Only pages on this site: no "//host", no backslashes, no control characters.
export function safeNext(next: string | null | undefined, fallback = "/portal") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || /[\\\u0000-\u001f]/.test(next)) return fallback;
  try {
    const u = new URL(next, "https://remotecore.local");
    return u.origin === "https://remotecore.local" ? `${u.pathname}${u.search}${u.hash}` : fallback;
  } catch { return fallback; }
}
