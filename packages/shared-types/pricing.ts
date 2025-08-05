// pricing-types.d.ts

import {  ID, DateISO } from './core'; 
import { WorkspaceType } from './customer';

// Pricing tier
export interface PricingTier {
  id?: ID; // שינוי: ה-ID אופציונלי
  workspaceType: WorkspaceType;
  year1Price: number;
  year2Price: number;
  year3Price: number;
  year4Price: number;
  twoDaysFromOfficePrice: number;      
  threeDaysFromOfficePrice: number;     
  active: boolean;
  effectiveDate: DateISO; // שינוי: תוקן ל-DateISO
  createdAt: DateISO; // שינוי: תוקן ל-DateISO
  updatedAt: DateISO; // שינוי: תוקן ל-DateISO
}

// Meeting room pricing
export interface MeetingRoomPricing {
  id?: ID; // שינוי: ה-ID אופציונלי
  hourlyRate: number;
  discountedHourlyRate: number; // For 4+ hours
  freeHoursKlikahCard: number; // Free hours for Klikah Card holders
  active: boolean;
  effectiveDate: DateISO; // שינוי: תוקן ל-DateISO
  createdAt: DateISO; // שינוי: תוקן ל-DateISO
  updatedAt: DateISO; // שינוי: תוקן ל-DateISO
}

// Lounge pricing
export interface LoungePricing {
  id?: ID; // שינוי: ה-ID אופציונלי
  eveningRate: number;
  memberDiscountRate: number; // For members
  active: boolean;
  effectiveDate: DateISO; // שינוי: תוקן ל-DateISO
  createdAt: DateISO; // שינוי: תוקן ל-DateISO
  updatedAt: DateISO; // שינוי: תוקן ל-DateISO
}

// Get current pricing request
export interface GetCurrentPricingRequest {
  date?: string; // ISO date string, defaults to current date - נשאר string כי ה-API החיצוני משתמש בו כך
}

// Get current pricing response
export interface GetCurrentPricingResponse {
  workspacePricing: {
    [key in WorkspaceType]: {
      year1Price: number;
      year2Price: number;
      year3Price: number;
      year4Price: number;
    };
  };
  meetingRoomPricing: {
    hourlyRate: number;
    discountedHourlyRate: number;
    freeHoursKlikahCard: number;
  };
  loungePricing: {
    eveningRate: number;
    memberDiscountRate: number;
  };
  effectiveDate: DateISO; 
}

// Update pricing tier request
export interface UpdatePricingTierRequest {
  workspaceType: WorkspaceType;
  year1Price: number;
  year2Price: number;
  year3Price: number;
  year4Price: number;
  twoDaysFromOfficePrice: number;      
  threeDaysFromOfficePrice: number;
  effectiveDate: DateISO; 
}

// Update meeting room pricing request
export interface UpdateMeetingRoomPricingRequest {
  hourlyRate: number;
  discountedHourlyRate: number;
  freeHoursKlikahCard: number;
  effectiveDate: DateISO; 
}

// Update lounge pricing request
export interface UpdateLoungePricingRequest {
  eveningRate: number;
  memberDiscountRate: number;
  effectiveDate: DateISO; 
}

// Get pricing history request
export interface GetPricingHistoryRequest {
  workspaceType?: WorkspaceType;
  startDate?: DateISO; 
  endDate?: DateISO; 
}

// Get pricing history response
export interface GetPricingHistoryResponse {
  pricingHistory: {
    effectiveDate: DateISO; 
    pricingData: {
      workspaceType: WorkspaceType;
      year1Price: number;
      year2Price: number;
      year3Price: number;
      year4Price: number;
    }[];
    meetingRoomPricing?: {
      hourlyRate: number;
      discountedHourlyRate: number;
      freeHoursKlikahCard: number;
    };
    loungePricing?: {
      eveningRate: number;
      memberDiscountRate: number;
    };
  }[];
}
export interface PricingTierCreateRequest {
  workspaceType: WorkspaceType;
  year1Price: number;
  year2Price: number;
  year3Price: number;
  year4Price: number;
  twoDaysFromOfficePrice: number;    
  threeDaysFromOfficePrice: number;   
  effectiveDate: DateISO;
}