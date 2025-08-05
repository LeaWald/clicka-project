import { ID, DateISO, FileReference } from "./core";

// סוגי מסמכים
// <<<<<<< HEAD
// export enum DocumentType {
//   INVOICE = 'INVOICE',
//   RECEIPT = 'RECEIPT',
//   CREDIT_NOTE = 'CREDIT_NOTE',
//   STATEMENT = 'STATEMENT',
//   TAX_INVOICE = 'TAX_INVOICE'
// }

// // תבנית מסמך
// export interface DocumentTemplate {
//   id: ID;
//   name: string;
//   type: DocumentType;
//   language: 'hebrew' | 'english';
//   template: string; // HTML template
//   variables: string[];
//   isDefault: boolean;
//   active: boolean;
//   createdAt: DateISO;
//   updatedAt: DateISO;
//   customer_id?: ID;
// }

// // בקשה ליצירת מסמך
// export interface GenerateDocumentRequest {
//   templateId: ID;
//   entityId: ID; // Invoice ID, Payment ID, etc.
//   variables: Record<string, any>;
//   language?: 'hebrew' | 'english';
//   deliveryMethod?: 'email' | 'download' | 'store';
// }

// // מסמך שנוצר
// export interface GeneratedDocument {
//   id: ID;
//   type: DocumentType;
//   entityId: ID;
//   documentNumber: string;
//   templateId: ID;
//   file: FileReference;
//   generatedAt: DateISO;
//   deliveredAt?: DateISO;
//   deliveryMethod?: string;
//   customer_id?: ID; // מזהה הלקוח, אם יש
//   htmlContent: string;
// }

// export interface CreateDocumentTemplateRequest {
//   customerId: ID;
//   name: string;
//   type: DocumentType;
//   language: 'hebrew' | 'english';
//   template: string;
//   variables: string[];
//   isDefault: boolean;
//   active: boolean;
// }

// export interface UpdateDocumentTemplateRequest {
//   name?: string;
//   template?: string;
//   variables?: string[];
//   isDefault?: boolean;
//   active?: boolean;
// }

// =======
// export enum DocumentType {
//   INVOICE = 'INVOICE',
//   RECEIPT = 'RECEIPT',
//   CREDIT_NOTE = 'CREDIT_NOTE',
//   STATEMENT = 'STATEMENT',
//   TAX_INVOICE = 'TAX_INVOICE'
// }

// // תבנית מסמך
// export interface DocumentTemplate {
//   id: ID;
//   name: string;
//   type: DocumentType;
//   language: 'hebrew' | 'english';
//   template: string; // HTML template
//   variables: string[];
//   isDefault: boolean;
//   active: boolean;
//   createdAt: DateISO;
//   updatedAt: DateISO;
// }

// // בקשה ליצירת מסמך
// export interface GenerateDocumentRequest {
//   templateId: ID;
//   entityId: ID; // Invoice ID, Payment ID, etc.
//   variables: Record<string, any>;
//   language?: 'hebrew' | 'english';
//   deliveryMethod?: 'email' | 'download' | 'store';
// }

// // מסמך שנוצר
// export interface GeneratedDocument {
//   id: ID;
//   type: DocumentType;
//   entityId: ID;
//   documentNumber: string;
//   templateId: ID;
//   file: FileReference;
//   generatedAt: DateISO;
//   deliveredAt?: DateISO;
//   deliveryMethod?: string;
// }
// >>>>>>> ce4631774996556b75702ebbab2f7b3b6635c0c1
