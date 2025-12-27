/**
 * Formats a date string from yyyy-mm-dd to dd-mm-yyyy
 */
export function formatDateToDDMMYYYY(date: string | null | undefined): string {
  if (!date) return "";
  
  try {
    const [year, month, day] = date.split("T")[0].split("-");
    return `${day}-${month}-${year}`;
  } catch {
    return date;
  }
}

/**
 * Formats a date string from dd-mm-yyyy to yyyy-mm-dd
 */
export function formatDateToYYYYMMDD(date: string): string {
  if (!date) return "";
  
  try {
    const [day, month, year] = date.split("-");
    return `${year}-${month}-${day}`;
  } catch {
    return date;
  }
}

/**
 * Formats a Date object to dd-mm-yyyy string
 */
export function formatDateObjectToDDMMYYYY(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Formats a date string or Date object to dd-mm-yyyy
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  
  if (date instanceof Date) {
    return formatDateObjectToDDMMYYYY(date);
  }
  
  return formatDateToDDMMYYYY(date);
}

/**
 * Format a date to period format (MM-YYYY)
 * @param date - Date in yyyy-mm-dd format or Date object
 * @returns Date formatted as MM-YYYY
 */
export function formatDateToPeriod(date: string | Date | null | undefined): string {
  if (!date) return "";
  
  try {
    const dateObj = typeof date === "string" 
      ? new Date(date.split("T")[0] + "T00:00:00") 
      : date;
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${month}-${year}`;
  } catch {
    return "";
  }
}
