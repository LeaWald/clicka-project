// google-types.d.ts

import { BookingStatus } from 'booking';
import { FileReference } from './core';
import { Buffer } from 'buffer';

// Google OAuth token data
export interface GoogleOAuthTokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp
  tokenType: string;
  scope: string;
}
// types/google.ts

// תאריך בפורמט ISO 8601
import { DateISO } from './core';
// טווח תאריכים
export interface TimeRange {
  start: DateISO;
  end: DateISO;
}

// אירוע ליצירה ב־Google Calendar
export interface CalendarEventInput {
  summary?: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: DateISO;
    date?: DateISO;
    timeZone?: string;
  };
  end: {
    dateTime?: DateISO;
    date?: DateISO;
    timeZone?: string;
  };
  attendees?: Array<{ email: string }>;
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{ method: 'email' | 'popup'; minutes: number }>;
  };
  recurrence?: string[]; // ← זה השדה החשוב לאירועים חוזרים!
  [key: string]: any; // שדה פתוח לשדות נוספים
}
export interface Event {
  id?: string;
  calendarId: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string; // ISO date string
    timeZone?: string;
  };
  end: {
    dateTime: string; // ISO date string
    timeZone?: string;
  };
  attendees?: {
    email: string;
    displayName?: string;
    // responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }[];
  status: BookingStatus; // 'confirmed' | 'tentative' | 'cancelled';
  created: string; // ISO date string
  updated: string; // ISO date string
  htmlLink: string; // URL to the event in Google Calendar

}
// Google Calendar event
export interface GoogleCalendarEvent {
  id: string;
  calendarId: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string; // ISO date string
    timeZone?: string;
  };
  end: {
    dateTime: string; // ISO date string
    timeZone?: string;
  };
  attendees?: {
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }[];
  status: 'confirmed' | 'tentative' | 'cancelled';
  created: string; // ISO date string
  updated: string; // ISO date string
  htmlLink: string; // URL to the event in Google Calendar
}

// Google Drive file
export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string;
  parents?: string[]; // Folder IDs
  createdTime: string; // ISO date string
  modifiedTime: string; // ISO date string
  size?: string;
}

// Create Google Calendar event request
export interface CreateGoogleCalendarEventRequest {
  calendarId: string;
  summary: string;
  description?: string;
  location?: string;
  startDateTime: string; // ISO date string
  endDateTime: string; // ISO date string
  attendees?: string[]; // Email addresses
  sendNotifications?: boolean;
  timezone?: string;
}

// Update Google Calendar event request
export interface UpdateGoogleCalendarEventRequest {
  calendarId: string;
  eventId: string;
  summary?: string;
  description?: string;
  location?: string;
  startDateTime?: string; // ISO date string
  endDateTime?: string; // ISO date string
  attendees?: string[]; // Email addresses
  sendNotifications?: boolean;
  timezone?: string;
}

// Delete Google Calendar event request
export interface DeleteGoogleCalendarEventRequest {
  calendarId: string;
  eventId: string;
  sendNotifications?: boolean;
}

// Get Google Calendar events request
export interface GetGoogleCalendarEventsRequest {
  calendarId: string;
  timeMin: string; // ISO date string
  timeMax: string; // ISO date string
  maxResults?: number;
  q?: string; // Search term
}

// Upload file to Google Drive request
export interface UploadToDriveRequest {
  name: string;
  content: File | Blob | string;
  mimeType: string;
  folderId?: string;
  description?: string;
}

// Upload file to Google Drive response
export interface UploadToDriveResponse {
  file: GoogleDriveFile;
  fileReference: FileReference; // For storing in the database
}

// Get Google Drive files request
export interface GetDriveFilesRequest {
  folderId?: string;
  q?: string; // Search query
  mimeType?: string;
  maxResults?: number;
}

// Create Google Drive folder request
export interface CreateDriveFolderRequest {
  name: string;
  parentFolderId?: string;
  description?: string;
}

export interface GmailMessage {
  id: string;
  threadId?: string;
  labelIds?: string[];
  snippet?: string;
  historyId?: string;
  internalDate?: string;
  payload?: {
    mimeType?: string;
    filename?: string;
    headers?: { name: string; value: string }[];
    body?: {
      size?: number;
      data?: string;
      attachmentId?: string;
    };
    parts?: GmailMessage['payload'][];
  };
  sizeEstimate?: number;
  raw?: string;
}

// Send email request
export interface SendEmail {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  attachments?: {
    filename: string;
    mimeType: string;
    data: Buffer | string;
  }[];
}

// Send email request
export interface SendEmailRequest {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  attachments?: {
    name: string;
    content: Blob | string;
    mimeType: string;
  }[];
}
 // הוספות של calandarSync By Nechami Eitan
 