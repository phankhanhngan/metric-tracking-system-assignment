import { DateTime } from "luxon";

/**
 * Parses an ISO-8601 string into a JS Date (UTC).
 */
export function parseISO(iso: string): Date {
  return DateTime.fromISO(iso, { zone: "utc" }).toJSDate();
}

/**
 * Formats a Date to an ISO-8601 string.
 */
export function toISO(date: Date | string): string {
  const dt =
    date instanceof Date
      ? DateTime.fromJSDate(date, { zone: "utc" })
      : DateTime.fromISO(date, { zone: "utc" });
  return dt.toISO()!;
}

/**
 * Formats a Date to a calendar date string (YYYY-MM-DD) in UTC.
 */
export function toDateString(date: Date | string): string {
  const dt =
    date instanceof Date
      ? DateTime.fromJSDate(date, { zone: "utc" })
      : DateTime.fromISO(date, { zone: "utc" });
  return dt.toISODate()!;
}

/**
 * Returns a Date representing N months ago from now (UTC).
 */
export function monthsAgo(months: number): Date {
  return DateTime.utc().minus({ months }).toJSDate();
}
