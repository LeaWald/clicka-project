import { PaymentMethodType } from './billing';
import { ID, DateISO, FileReference, ApiResponse, PaginatedResponse } from './core';

export enum TimelineEventType {
  LEAD_CREATED = 'LEAD_CREATED',
  INTERACTION = 'INTERACTION',
  CONVERSION = 'CONVERSION',
  CONTRACT_SIGNED = 'CONTRACT_SIGNED',
  WORKSPACE_ASSIGNED = 'WORKSPACE_ASSIGNED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  STATUS_CHANGE = 'STATUS_CHANGE',
  NOTE_ADDED = 'NOTE_ADDED'
}

export enum ContractStatus {
  DRAFT = 'DRAFT',
  PENDING_SIGNATURE = 'PENDING_SIGNATURE',
  SIGNED = 'SIGNED',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
  RENEWED = 'RENEWED'
}

// Workspace type enum
export enum WorkspaceType {
  PRIVATE_ROOM1 = 'PRIVATE_ROOM1',
  PRIVATE_ROOM2 = 'PRIVATE_ROOM2',
  PRIVATE_ROOM3 = 'PRIVATE_ROOM3',
  DESK_IN_ROOM = 'DESK_IN_ROOM',
  OPEN_SPACE = 'OPEN_SPACE',
  KLIKAH_CARD = 'KLIKAH_CARD',
  KLIKAH_CARD_UPGRADED = 'KLIKAH_CARD_UPGRADED',
  DOOR_PASS = "DOOR_PASS",
  WALL = "WALL",
  COMPUTER_STAND = "COMPUTER_STAND",
  RECEPTION_DESK = "RECEPTION_DESK",
  BASE = "BASE",
}


// Customer status enum
export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  NOTICE_GIVEN = 'NOTICE_GIVEN',
  EXITED = 'EXITED',
  PENDING = 'PENDING',
  CREATED = 'CREATED'
}

// Exit reason enum
export enum ExitReason {
  RELOCATION = 'RELOCATION',
  BUSINESS_CLOSED = 'BUSINESS_CLOSED',
  PRICE = 'PRICE',
  WORK_FROM_HOME = 'WORK_FROM_HOME',
  SPACE_NEEDS = 'SPACE_NEEDS',
  DISSATISFACTION = 'DISSATISFACTION',
  OTHER = 'OTHER'
}

// Customer entry-exit period
export interface CustomerPeriod {
  id?: ID;
  customerId: ID;
  entryDate: DateISO;
  exitDate?: DateISO;
  exitNoticeDate?: DateISO;
  exitReason?: ExitReason;
  exitReasonDetails?: string;
  createdAt: DateISO;
  updatedAt: DateISO;
}

export interface ContractTerms {
  workspaceType: WorkspaceType;
  workspaceCount: number;
  monthlyRate: number;
  duration: number; // months
  renewalTerms: string;
  terminationNotice: number; // days
  specialConditions?: string[];
}

export interface Contract {
  id?: ID;
  customerId: ID;
  version: number;
  status: ContractStatus;
  signDate?: DateISO;
  startDate?: DateISO;
  endDate?: DateISO;
  terms?: ContractTerms;
  documents: ID[]; // כאן ישמרו כל טפסי החוזה 
  signedBy?: string;
  witnessedBy?: string;
  createdAt: DateISO;
  updatedAt: DateISO;
}


// Payment method
export interface CustomerPaymentMethod {
  id?: ID;
  customerId: ID;
  creditCardNumber?: string;
  creditCardExpiry?: string;
  creditCardHolderIdNumber?: string;
  creditCardHolderPhone?: string;
  isActive: boolean;
  createdAt: DateISO;
  updatedAt: DateISO;
}



// Customer model
export interface Customer {
  id?: ID;
  name: string;
  phone: string;
  email?: string;
  idNumber: string;
  businessName: string;
  businessType: string;
  status: CustomerStatus;
  currentWorkspaceType?: WorkspaceType;
  workspaceCount: number;
  contractSignDate?: DateISO;
  contractStartDate?: DateISO;
  billingStartDate?: DateISO;
  notes?: string;
  invoiceName?: string;
  contractDocuments?: FileReference[];
  paymentMethods?: CustomerPaymentMethod[];
  paymentMethodType: PaymentMethodType;
  ip: string;
  periods?: CustomerPeriod[];
  createdAt: DateISO;
  updatedAt: DateISO;
}


// Create customer request

export interface CreateCustomerRequest {
  name: string;
  phone: string;
  email: string;
  idNumber: string;
  businessName: string;
  businessType: string;
  currentWorkspaceType: WorkspaceType;
  workspaceCount: number;
  contractSignDate: DateISO;
  contractStartDate: DateISO;
  billingStartDate: DateISO;
  notes?: string;
  invoiceName?: string;
  paymentMethod?: {
    creditCardNumber?: string;
    creditCardExpiry?: string;
    creditCardHolderIdNumber?: string;
    creditCardHolderPhone?: string;
  };
  paymentMethodType: PaymentMethodType;
  ip: string;
  contractDocuments?: FileReference[];
}

// Update customer request
export interface UpdateCustomerRequest {
  name?: string;
  phone?: string;
  email?: string;
  idNumber?: string;
  businessName?: string;
  businessType?: string;
  notes?: string;
  invoiceName?: string;
  status?: CustomerStatus;
}

// Get customers request
export interface GetCustomersRequest {
  status?: CustomerStatus[];
  workspaceType?: WorkspaceType[];
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

// Record exit notice request
export interface RecordExitNoticeRequest {
  exitNoticeDate: DateISO;
  plannedExitDate: DateISO;
  exitReason: ExitReason;
  exitReasonDetails?: string;
}

// Complete customer exit request
export interface CompleteCustomerExitRequest {
  actualExitDate: DateISO;
  exitReason: ExitReason;
  exitReasonDetails?: string;
  finalNotes?: string;
}

// Add contract document request
export interface AddContractDocumentRequest {
  document: FileReference;
  description?: string;
}

// Customer desk change request
export interface CustomerDeskChangeRequest {
  newWorkspaceType: WorkspaceType;
  newWorkspaceCount: number;
  effectiveDate: DateISO;
  notes?: string;
}

// Extend customer contract request
export interface ExtendCustomerContractRequest {
  newEndDate: DateISO;
  notes?: string;
}

// Convert lead to customer request
export interface ConvertLeadToCustomerRequest {
  leadId: ID;
  workspaceType: WorkspaceType;
  businessName: string;
  invoiceName: string;
  workspaceCount: number;
  contractSignDate: DateISO;
  contractStartDate: DateISO;
  billingStartDate: DateISO;
  notes?: string;
  paymentMethod?: {
    creditCardNumber?: string;
    creditCardExpiry?: string;
    creditCardHolderIdNumber?: string;
    creditCardHolderPhone?: string;
  };
  paymentMethodType: PaymentMethodType;
  contractDocuments?: FileReference[];
}


export interface StatusChangeRequest {
  newStatus: CustomerStatus;
  effectiveDate: DateISO;
  reason?: string;
  notes?: string;
  notifyCustomer: boolean;
}