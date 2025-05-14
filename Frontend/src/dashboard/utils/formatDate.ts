/**
 * Format a date into a readable format
 * @param dateString - The date to format (ISO string or Date object)
 * @returns The formatted date in English
 */
export function formatDate(dateString: string | Date): string {
  if (!dateString) return '';

  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  // Formatting options
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };

  return new Intl.DateTimeFormat('en-US', options).format(date);
}
