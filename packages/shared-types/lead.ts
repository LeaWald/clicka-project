// lead-types.d.ts

import { Person } from './person';
import { ID, DateISO, ApiResponse, PaginatedResponse } from './core';
import { WorkspaceType } from './customer';

// Lead status enum
export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  INTERESTED = 'INTERESTED',
  SCHEDULED_TOUR = 'SCHEDULED_TOUR',
  PROPOSAL_SENT = 'PROPOSAL_SENT',
  CONVERTED = 'CONVERTED',
  NOT_INTERESTED = 'NOT_INTERESTED',
  LOST = 'LOST'
}

// Lead source enum
export enum LeadSource {
  WEBSITE = 'WEBSITE',
  REFERRAL = 'REFERRAL',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  EVENT = 'EVENT',
  PHONE = 'PHONE',
  WALK_IN = 'WALK_IN',
  EMAIL = 'EMAIL',
  OTHER = 'OTHER'
}

// Lead interaction type enum
export enum InteractionType {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  MEETING = 'MEETING',
  TOUR = 'TOUR',
  NOTE = 'NOTE',
  DOCUMENT = 'DOCUMENT'
}

// Lead interaction model
export interface LeadInteraction {
  id?: ID;
  leadId: ID;
  type: InteractionType;
  date: DateISO;
  notes: string;
  userId: ID;
  userEmail: string;
  createdAt: DateISO;
  updatedAt: DateISO;
}

// Lead model
export interface Lead extends Person {
  idNumber: ID;
  businessType: string;
  interestedIn: WorkspaceType;
  source: LeadSource;
  status: LeadStatus;
  contactDate?: DateISO;
  followUpDate?: DateISO;
  notes?: string;
  interactions: LeadInteraction[];
  createdAt: DateISO;
  updatedAt: DateISO;
}

// Create lead request
export interface CreateLeadRequest {
  name: string;
  phone: string;
  email: string;
  businessType: string;
  interestedIn: WorkspaceType;
  source: LeadSource;
  notes?: string;
  followUpDate?: DateISO;
}

// Update lead request
export interface UpdateLeadRequest {
  name?: string;
  phone?: string;
  email?: string;
  businessType?: string;
  interestedIn?: WorkspaceType[];
  source?: LeadSource;
  status?: LeadStatus;
  followUpDate?: DateISO;
  notes?: string;
}

// Get leads request
export interface GetLeadsRequest {
  status?: LeadStatus[];
  source?: LeadSource[];
  interestedIn?: WorkspaceType[];
  followUpDateFrom?: DateISO;
  followUpDateTo?: DateISO;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

// Add lead interaction request
export interface AddLeadInteractionRequest {
  type: InteractionType;
  date: DateISO;
  notes: string;
}
