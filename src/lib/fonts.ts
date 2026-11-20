import { Geist, Schibsted_Grotesk } from "next/font/google";

// Self hosted at build time, so no request to Google blocks the first paint.
export const geist = Geist({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap", preload: false });
export const schibsted = Schibsted_Grotesk({ subsets: ["latin"], weight: ["500", "700", "800"], display: "swap" });
