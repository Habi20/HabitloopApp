// server/utils/timezone.ts
import { env } from "../env.js";

/**
 * Comprehensive timezone utility for Sri Lanka (Asia/Colombo, UTC+5:30)
 * Handles all date/time operations with proper timezone awareness
 */

export class TimezoneUtils {
  private static readonly TIMEZONE = env.TIMEZONE; // Asia/Colombo
  private static readonly UTC_OFFSET = '+05:30'; // Sri Lanka UTC offset

  /**
   * Get current date in Sri Lanka timezone
   */
  static getCurrentDate(): Date {
    return new Date();
  }

  /**
   * Get current date and time in Sri Lanka timezone as a Date object
   * This creates a Date object that represents the current time in Sri Lanka
   */
  static getCurrentSriLankaDate(): Date {
    const now = new Date();
    const sriLankaTime = now.toLocaleString('en-US', {
      timeZone: this.TIMEZONE
    });
    return new Date(sriLankaTime);
  }

  /**
   * Get current date and time in Sri Lanka timezone that will be stored correctly
   * This creates a Date object that preserves the Sri Lanka time when stored in database
   */
  static getCurrentSriLankaTimestamp(): Date {
    const now = new Date();
    
    // Get the current time in Sri Lanka timezone
    const sriLankaTime = now.toLocaleString('en-US', {
      timeZone: this.TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // Parse the Sri Lanka time components
    const [datePart, timePart] = sriLankaTime.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hour, minute, second] = timePart.split(':');
    
    // Create a Date object in Sri Lanka timezone
    // This will be stored as the actual Sri Lanka time in the database
    const sriLankaDate = new Date(
      parseInt(year),
      parseInt(month) - 1, // Month is 0-indexed
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    );
    
    return sriLankaDate;
  }

  /**
   * Get current date string in YYYY-MM-DD format for Sri Lanka timezone
   * This ensures the date is correct for the local timezone
   */
  static getCurrentDateString(): string {
    const now = new Date();
    return this.toDateString(now);
  }

  /**
   * Convert any date to Sri Lanka timezone and return as YYYY-MM-DD
   */
  static toDateString(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Format date in Sri Lanka timezone
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: this.TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(dateObj);
  }

  /**
   * Convert any date to Sri Lanka timezone and return as Date object
   */
  static toLocalDate(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Create a new date in Sri Lanka timezone
    const localDate = new Date(dateObj.toLocaleString('en-US', {
      timeZone: this.TIMEZONE
    }));
    
    return localDate;
  }

  /**
   * Convert local Sri Lanka date to UTC for database storage
   */
  static toUTC(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Get the local time components
    const localYear = dateObj.getFullYear();
    const localMonth = dateObj.getMonth();
    const localDay = dateObj.getDate();
    const localHours = dateObj.getHours();
    const localMinutes = dateObj.getMinutes();
    const localSeconds = dateObj.getSeconds();
    
    // Create UTC date by accounting for timezone offset
    const utcDate = new Date(Date.UTC(localYear, localMonth, localDay, localHours, localMinutes, localSeconds));
    
    // Adjust for Sri Lanka timezone offset (+5:30)
    utcDate.setUTCHours(utcDate.getUTCHours() - 5);
    utcDate.setUTCMinutes(utcDate.getUTCMinutes() - 30);
    
    return utcDate;
  }

  /**
   * Convert UTC date from database to Sri Lanka local time
   */
  static fromUTC(utcDate: Date | string): Date {
    const dateObj = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
    
    // Create date in Sri Lanka timezone
    return new Date(dateObj.toLocaleString('en-US', {
      timeZone: this.TIMEZONE
    }));
  }

  /**
   * Check if two dates are the same day in Sri Lanka timezone
   */
  static isSameDay(date1: Date | string, date2: Date | string): boolean {
    const str1 = this.toDateString(date1);
    const str2 = this.toDateString(date2);
    return str1 === str2;
  }

  /**
   * Get the number of days between two dates in Sri Lanka timezone
   */
  static getDaysDifference(date1: Date | string, date2: Date | string): number {
    const d1 = this.toLocalDate(date1);
    const d2 = this.toLocalDate(date2);
    
    const timeDiff = d2.getTime() - d1.getTime();
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  }

  /**
   * Get current time in HH:MM format for Sri Lanka timezone
   */
  static getCurrentTimeString(): string {
    const now = new Date();
    return new Intl.DateTimeFormat('en-US', {
      timeZone: this.TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);
  }

  /**
   * Format date and time for display in Sri Lanka timezone
   */
  static formatDateTime(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone: this.TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    
    return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(dateObj);
  }

  /**
   * Get week number for a given date in Sri Lanka timezone
   */
  static getWeekNumber(date: Date): number {
    const localDate = this.toLocalDate(date);
    const d = new Date(localDate);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  /**
   * Get month number (0-11) for a given date in Sri Lanka timezone
   */
  static getMonthNumber(date: Date): number {
    const localDate = this.toLocalDate(date);
    return localDate.getMonth();
  }

  /**
   * Get year for a given date in Sri Lanka timezone
   */
  static getYear(date: Date): number {
    const localDate = this.toLocalDate(date);
    return localDate.getFullYear();
  }

  /**
   * Validate if a date string is in correct format and timezone
   */
  static validateDate(dateString: string): boolean {
    try {
      const date = new Date(dateString);
      return !isNaN(date.getTime());
    } catch {
      return false;
    }
  }

  /**
   * Get timezone information for debugging
   */
  static getTimezoneInfo(): {
    timezone: string;
    offset: string;
    currentTime: string;
    currentDate: string;
    isDST: boolean;
  } {
    // const now = new Date();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    return {
      timezone: timeZone,
      offset: this.UTC_OFFSET,
      currentTime: this.getCurrentTimeString(),
      currentDate: this.getCurrentDateString(),
      isDST: false // Sri Lanka doesn't observe DST
    };
  }

  /**
   * Create a date string that represents the start of the day in Sri Lanka timezone
   */
  static getStartOfDay(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const localDate = this.toLocalDate(dateObj);
    localDate.setHours(0, 0, 0, 0);
    return this.toDateString(localDate);
  }

  /**
   * Create a date string that represents the end of the day in Sri Lanka timezone
   */
  static getEndOfDay(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const localDate = this.toLocalDate(dateObj);
    localDate.setHours(23, 59, 59, 999);
    return this.toDateString(localDate);
  }
}

// Export convenience functions (preserving all existing exports)
export const getCurrentDate = () => TimezoneUtils.getCurrentDate();
export const getCurrentDateString = () => TimezoneUtils.getCurrentDateString();
export const toLocalDate = (date: Date | string) => TimezoneUtils.toLocalDate(date);
export const toDateString = (date: Date | string) => TimezoneUtils.toDateString(date);
export const toUTC = (date: Date | string) => TimezoneUtils.toUTC(date);
export const fromUTC = (date: Date | string) => TimezoneUtils.fromUTC(date);
export const isSameDay = (date1: Date | string, date2: Date | string) => TimezoneUtils.isSameDay(date1, date2);
export const getDaysDifference = (date1: Date | string, date2: Date | string) => TimezoneUtils.getDaysDifference(date1, date2);
export const getCurrentTimeString = () => TimezoneUtils.getCurrentTimeString();
export const formatDateTime = (date: Date | string, options?: Intl.DateTimeFormatOptions) => TimezoneUtils.formatDateTime(date, options);
export const getWeekNumber = (date: Date) => TimezoneUtils.getWeekNumber(date);
export const getMonthNumber = (date: Date) => TimezoneUtils.getMonthNumber(date);
export const getYear = (date: Date) => TimezoneUtils.getYear(date);
export const validateDate = (dateString: string) => TimezoneUtils.validateDate(dateString);
export const getTimezoneInfo = () => TimezoneUtils.getTimezoneInfo();
