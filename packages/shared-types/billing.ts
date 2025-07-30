// billing-types.d.ts

import { ID, DateISO, FileReference, ApiResponse, PaginatedResponse } from './core';
import { WorkspaceType } from './customer';

// Invoice status enum
export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  CANCELED = 'CANCELED',
  ///ע"פ הדוגמה צריך להוריד את sent
  SENT = 'SENT',
}

// Payment method enum
export enum PaymentMethodType {
  CREDIT_CARD = 'CREDIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  CASH = 'CASH',
  OTHER = 'OTHER'
}

// Billing item type enum
export enum BillingItemType {
  WORKSPACE = 'WORKSPACE',
  MEETING_ROOM = 'MEETING_ROOM',
  LOUNGE = 'LOUNGE',
  SERVICE = 'SERVICE',
  DISCOUNT = 'DISCOUNT',
  OTHER = 'OTHER'
}

// Billing item model
export interface BillingItem {
  id: ID;
  invoice_id: ID;
  type: BillingItemType;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  tax_rate: number;
  tax_amount: number;
  workspace_type?: WorkspaceType;
  booking_id?: ID;
  createdAt: DateISO;
  updatedAt: DateISO;
}
// Invoice model
export interface Invoice {
  id?: ID;
  invoice_number: string;
  customer_id: ID;
  customer_name: string;
  status: InvoiceStatus;
  issue_date: DateISO;
  due_date: DateISO;
  items: BillingItem[];
  subtotal: number;
  tax_total: number;
  payment_due_reminder?: boolean;
  payment_dueReminder_sent_at?: DateISO;
    // //הוספת שדות במקום
  // tax_amount:number
  // tax_rate:number
  // total: number;
  // amountPaid: number;
  //הוספת שדה
  // paid_date: DateISO 
  //balance: number;
  // notes?: string;
  // pdfFile?: FileReference;
  //הוספה שדות במקום 
  // billingPeriodStart :DateISO
  // billingPeriodEnd :DateISO
  // templateId:ID 
  created_at: DateISO;
  updated_at: DateISO;
}

// Payment model
export interface Payment {
  id: ID;
  customer_id: ID;
  customer_name: string;
  invoice_id?: ID;
  invoice_number?: string;
  amount: number;
  method: PaymentMethodType;
  transaction_reference?: string;
  date: DateISO;
  notes?: string;
  receipt_file?: FileReference;
  createdAt: DateISO;
  updatedAt: DateISO;
}

// Create invoice request
export interface CreateInvoiceRequest {
  customerId: ID;
  issueDate: DateISO;
  dueDate: DateISO;
  items: {
    type: BillingItemType;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    workspaceType?: WorkspaceType;
    bookingId?: ID;
  }[];
  notes?: string;
}

// Update invoice request
export interface UpdateInvoiceRequest {
  status?: InvoiceStatus;
  issueDate?: DateISO;
  dueDate?: DateISO;
  notes?: string;
}

// Get invoices request
export interface GetInvoicesRequest {
  customerId?: ID;
  status?: InvoiceStatus[];
  issueDateFrom?: DateISO;
  issueDateTo?: DateISO;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

// Record payment request
export interface RecordPaymentRequest {
  customerId: ID;
  invoiceId?: ID;
  amount: number;
  method: PaymentMethodType;
  transactionReference?: string;
  date: DateISO;
  notes?: string;
  receiptFile?: FileReference;
}

// Update payment request
export interface UpdatePaymentRequest {
  invoiceId?: ID;
  amount?: number;
  method?: PaymentMethodType;
  transactionReference?: string;
  date?: DateISO;
  notes?: string;
  receiptFile?: FileReference;
}

// Get payments request
export interface GetPaymentsRequest {
  customerId?: ID;
  invoiceId?: ID;
  method?: PaymentMethodType[];
  dateFrom?: DateISO;
  dateTo?: DateISO;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

// Calculate billing request
export interface CalculateBillingRequest {
  customerId: ID;
  billingPeriod: {
    startDate: DateISO;
    endDate: DateISO;
  };
  includeWorkspace?: boolean;
  includeMeetingRooms?: boolean;
  includeOtherServices?: boolean;
}

// Calculate billing response
export interface CalculateBillingResponse {
  customerId: ID;
  customerName: string;
  billingPeriod: {
    startDate: DateISO;
    endDate: DateISO;
  };
  items: {
    type: BillingItemType;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    taxRate: number;
    taxAmount: number;
    workspaceType?: WorkspaceType;
    bookingId?: ID;
  }[];
  subtotal: number;
  taxTotal: number;
  total: number;
}

// Generate monthly invoices request
export interface GenerateMonthlyInvoicesRequest {
  month: number; // 1-12
  year: number;
  issueDate: DateISO;
  dueDate: DateISO;
  customerIds?: ID[]; // If not provided, generate for all active customers
}

// Generate monthly invoices response
export interface GenerateMonthlyInvoicesResponse {
  generatedInvoices: number;
  failedInvoices: Array<{
    customerId: ID;
    customerName: string;
    error: string;
  }>;
  invoices: Invoice[];
}
// Payment status enum
export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED'
}