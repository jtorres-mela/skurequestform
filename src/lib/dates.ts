/**
 * Formats a date for display, ensuring it is treated as UTC to prevent timezone shifts.
 * When a date is stored as `2025-09-01T00:00:00.000Z`, this function ensures it displays
 * as "Sep 1, 2025" regardless of the user's local timezone.
 * @param date The date to format (can be a Date object, string, or null).
 * @returns The formatted date string (e.g., "Sep 1, 2025") or 'N/A' if the date is null.
 */
export const formatDateAsUTC = (date: Date | string | null): string => {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  
  // Check if the date is valid
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC', // Treat the date as UTC
  });
};
