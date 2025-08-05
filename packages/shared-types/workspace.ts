// workspace-types.d.ts
import { ID, DateISO } from './core';
import { WorkspaceType } from './customer';

// Space status enum
export enum SpaceStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  MAINTENANCE = 'MAINTENANCE',
  INACTIVE = 'INACTIVE',
  NONE = 'NONE',
}

// Space model
export interface Space {
  id?: ID;
  name: string;
  description?: string;
  type: WorkspaceType;
  status: SpaceStatus;
  workspaceMapId?: ID
  currentCustomerId?: ID;
  currentCustomerName?: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  location?: string;
  createdAt: DateISO;
  updatedAt: DateISO;
}

// Space occupancy model
export interface SpaceOccupancy {
  id: ID;
  spaceId: ID;
  customerId: ID;
  customerName: string;
  startDate: DateISO;
  endDate?: DateISO;
  createdAt: DateISO;
  updatedAt: DateISO;
}

// Workspace map model
export interface WorkspaceMap {
  spaces: Space[];
  width: number;
  height: number;
  backgroundImage?: string;
}

// Create space request
export interface CreateSpaceRequest {
  name: string;
  description?: string;
  type: WorkspaceType;
  room?: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
}

// Update space request
export interface UpdateSpaceRequest {
  name?: string;
  description?: string;
  type?: WorkspaceType;
  status?: SpaceStatus;
  room?: string;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
}

// Get spaces request
export interface GetSpacesRequest {
  type?: WorkspaceType[];
  status?: SpaceStatus[];
  room?: string;
  customerId?: ID;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

// Assign space request
export interface AssignSpaceRequest {
  customerId: ID;
  startDate: DateISO;
}

// Unassign space request
export interface UnassignSpaceRequest {
  endDate: DateISO;
}

// Get space occupancy request
export interface GetSpaceOccupancyRequest {
  startDate?: DateISO;
  endDate?: DateISO;
}

// Get workspace map request
export interface GetWorkspaceMapRequest {
  includeOccupied?: boolean;
  includeAvailable?: boolean;
  includeReserved?: boolean;
  includeMaintenance?: boolean;
  workspaceType?: WorkspaceType[];
}

// Workspace map response
export interface WorkspaceMapResponse {
  map: WorkspaceMap;
  spaces: Space[];
}