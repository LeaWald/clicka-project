import { ID, DateISO, ApiResponse, PaginatedResponse } from './core';

// Room type enum
export enum RoomType {
  MEETING_ROOM = 'MEETING_ROOM',
  LOUNGE = 'LOUNGE'
}

export interface RoomFeature {
  id?: ID;
  description?: string;
  IsIncluded: boolean;
  additionalCost: number;
}

// Room status enum
export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
  INACTIVE = 'INACTIVE'
}

// Booking status enum
export enum BookingStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELED = 'CANCELED',
  COMPLETED = 'COMPLETED'
}

// Room model
export interface Room {
  id?: ID;
  name: string;
  description?: string;
  type: RoomType;
  status: RoomStatus;
  capacity: number;
  features?: ID[];
  equipment?: string[];
  hourlyRate: number ;
  discountedHourlyRate: number; // For 4+ hours
  googleCalendarId?: string;
  location?: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  workspaceMapId: ID; // Assuming this is a reference to a WorkspaceMap
  createdAt: DateISO;
  updatedAt: DateISO;

  MinimumBookingMinutes: number;
  MaximumBookingMinutes: number;
  RequiredApproval: boolean;
  FreeHoursForKlikcaCard: number;
  nextMaintenanceDate?: DateISO;
}

export interface BookingRules {
  MinimumBookingMinutes: number;
  MaximumBookingMinutes: number;
  AdvanceBookingDays: number;
  RequiredApproval: boolean;
  FreeHoursForKlikcaCard: number;
}

// Booking model
export interface Booking {
  id?: ID;
  roomId: ID;
  roomName: string;
  customerId?: ID | null;
  customerName?: string | null;
  externalUserName?: string | null;
  externalUserEmail?: string | null;
  externalUserPhone?: string | null;
  startTime: DateISO;
  endTime: DateISO;
  status: BookingStatus;
  notes?: string;
  googleCalendarEventId?: string | null;
  totalHours: number;
  chargeableHours: number; // After free hours deduction
  totalCharge: number; // Amount to be charged
  isPaid: boolean;
  approvedBy?: ID;
  approvedAt?: DateISO;
  createdAt: DateISO;
  updatedAt: DateISO;
}

// Create room request
export interface CreateRoomRequest {
  name: string;
  description?: string;
  type: RoomType;
  status?: RoomStatus;
  capacity: number;
  hourlyRate: number;
  discountedHourlyRate: number;
  googleCalendarId?: string;
  location?: string;
  features?: ID[];
  equipment?: string[];
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  MinimumBookingMinutes: number;
  MaximumBookingMinutes: number;
  RequiredApproval: boolean;
  FreeHoursForKlikcaCard: number;
  workspaceMapId: ID;
  nextMaintenanceDate?: DateISO;
}

// Update room request
export interface UpdateRoomRequest {
  name?: string;
  description?: string;
  type?: RoomType;
  status?: RoomStatus;
  capacity?: number;
  hourlyRate?: number;
  discountedHourlyRate?: number;
  googleCalendarId?: string;
  location?: string;
  features?: ID[];
  equipment?: string[];
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  MinimumBookingMinutes?: number;
  MaximumBookingMinutes?: number;
  RequiredApproval?: boolean;
  FreeHoursForKlikcaCard?: number;
  workspaceMapId?: ID;
  nextMaintenanceDate?: DateISO;
}

// Get bookings request
export interface GetBookingsRequest {
  roomId?: ID;
  customerId?: ID;
  status?: BookingStatus[];
  startDateFrom?: DateISO;
  startDateTo?: DateISO;
  page?: number;
  limit?: number;
}

// Approve booking request
export interface ApproveBookingRequest {
  notes?: string;
}

// Reject booking request
export interface RejectBookingRequest {
  reason: string;
}

// Cancel booking request
export interface CancelBookingRequest {
  reason: string;
}
export interface UpdateBookingRequest {
  startTime?: DateISO;
  endTime?: DateISO;
  notes?: string;
}
// Get bookings request
export interface GetBookingsRequest {
  roomId?: ID;
  customerId?: ID;
  status?: BookingStatus[];
  startDateFrom?: DateISO;
  startDateTo?: DateISO;
  page?: number;
  limit?: number;
}
// Check room availability request
export interface CheckRoomAvailabilityRequest {
  roomId: ID;
  startTime: DateISO;
  endTime: DateISO;
}

// Check room availability response
export interface CheckRoomAvailabilityResponse {
  isAvailable: boolean;
  conflictingBookings?: Booking[];
}

// Sync bookings with Google request
export interface SyncBookingsWithGoogleRequest {
  roomId?: ID;
  startDate?: DateISO;
  endDate?: DateISO;
}

// Sync bookings with Google response
export interface SyncBookingsWithGoogleResponse {
  addedBookings: number;
  updatedBookings: number;
  removedBookings: number;
  failedSyncs: Array<{
    bookingId?: ID;
    googleEventId?: string;
    error: string;
  }>;
}