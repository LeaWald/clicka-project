import { ID, DateISO, FileReference } from './core';

// סוגי מסמכים
export enum DocumentType {
  INVOICE = 'INVOICE',
  RECEIPT = 'RECEIPT',
  CREDIT_NOTE = 'CREDIT_NOTE',
  STATEMENT = 'STATEMENT',
  TAX_INVOICE = 'TAX_INVOICE'
}

// תבנית מסמך
export interface DocumentTemplate {
  id: ID;
  name: string;
  type: DocumentType;
  language: 'hebrew' | 'english';
  template: string; // HTML template
  variables: string[];
  isDefault: boolean;
  active: boolean;
  createdAt: DateISO;
  updatedAt: DateISO;
}

// בקשה ליצירת מסמך
export interface GenerateDocumentRequest {
  templateId: ID;
  entityId: ID; // Invoice ID, Payment ID, etc.
  variables: Record<string, any>;
  language?: 'hebrew' | 'english';
  deliveryMethod?: 'email' | 'download' | 'store';
}

// מסמך שנוצר
export interface GeneratedDocument {
  id: ID;
  type: DocumentType;
  entityId: ID;
  documentNumber: string;
  templateId: ID;
  file: FileReference;
  generatedAt: DateISO;
  deliveredAt?: DateISO;
  deliveryMethod?: string;
}

// תבנית דוא"ל
export interface EmailTemplate {
  id?: ID;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  language: 'he' | 'en';
  variables: string[];
  createdAt: DateISO;
  updatedAt: DateISO;
}