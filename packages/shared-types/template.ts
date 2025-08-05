import { ID, DateISO, FileReference } from './core';
export enum DocumentType {
  INVOICE = 'INVOICE',
  RECEIPT = 'RECEIPT',
  CREDIT_NOTE = 'CREDIT_NOTE',
  STATEMENT = 'STATEMENT',
  TAX_INVOICE = 'TAX_INVOICE'
}
// תבנית מסמך
export interface DocumentTemplate {
  id?: ID;
  name: string;
  type: DocumentType;
  language: 'hebrew' | 'english';
  template: string;
  variables: string[];
  isDefault: boolean;
  active: boolean;
  createdAt: DateISO;
  updatedAt: DateISO;
}

// בקשה ליצירת מסמך
export interface GenerateDocumentRequest {
  name?: string;
  templateId: ID;
  entityId: ID; // Invoice ID, Payment ID, etc.
  variables: Record<string, any>;
  language?: 'hebrew' | 'english';
  deliveryMethod?: 'email' | 'download' | 'store';
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
export interface CreateDocumentTemplateRequest {
  name: string;
  type: DocumentType;
  language: 'hebrew' | 'english';
  template: string;
  variables: string[];
  isDefault: boolean;
  active: boolean;
}

export interface UpdateDocumentTemplateRequest {
  name?: string;
  template?: string;
  variables?: string[];
  isDefault?: boolean;
  active?: boolean;
}

// Interface
export interface DocumentTemplate {
  id?: ID;
  name: string;
  type: DocumentType;
  language: 'hebrew' | 'english';
  template: string;
  variables: string[];
  isDefault: boolean;
  active: boolean;
  createdAt: DateISO;
  updatedAt: DateISO;
}
// Interface למסמכים שנוצרו
export interface GeneratedDocument {
  id?: ID;
  name: string;
  type: DocumentType;
  entityId: ID;
  documentNumber: string;
  templateId: ID;
  htmlContent: string;
  generatedAt: DateISO;
  deliveredAt?: DateISO;
  deliveryMethod?: string;
  file: FileReference;
}
