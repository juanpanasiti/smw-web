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
