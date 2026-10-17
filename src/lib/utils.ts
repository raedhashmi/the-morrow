import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** YYYY-MM-DD for "today" in a given IANA timezone. */
export function todayIn(timezone: string, at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

/** Hour of day (0–23) in a given IANA timezone. */
export function hourIn(timezone: string, at: Date = new Date()): number {
  const h = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", hour12: false }).format(at);
  return Number(h) % 24;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "Saturday, 17 October 2026" — formatted by hand so server and browser always agree. */
export function longDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${DAYS[dow]}, ${d} ${MONTHS[m - 1]} ${y}`;
}

export function timeAgo(date: Date | null | undefined): string {
  if (!date) return "";
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export const APP_NAME = "The Morrow";
export const APP_TAGLINE = "Your morning, considered.";
export function appUrl(path = "") {
  const base = process.env.APP_URL || process.env.AUTH_URL || "http://localhost:3000";
  return base.replace(/\/$/, "") + path;
}

/** "7 AM" — locale-independent so server and client render identically. */
export function hourLabel(h: number) {
  return `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`;
}
