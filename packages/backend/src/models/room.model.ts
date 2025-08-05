import {  RoomType, RoomStatus, Room } from "shared-types/booking";
import { ID, DateISO } from "shared-types/core";

export class RoomModel implements Room {
  id?: ID;
  name: string;
  description?: string;
  type: RoomType;
  status: RoomStatus;
  capacity: number;
  features?: ID[];
  hourlyRate: number;
  discountedHourlyRate: number;
  googleCalendarId?: string;
  location: string;
  equipment?: string[];
  positionX: number;
  positionY: number;
  width: number;
  height: number;

  MinimumBookingMinutes: number;
  MaximumBookingMinutes: number;
  RequiredApproval: boolean;
  FreeHoursForKlikcaCard: number;
  nextMaintenanceDate?: DateISO;
  workspaceMapId: string; 
  createdAt: DateISO;
  updatedAt: DateISO;

   constructor(params: {
     id?: ID;
     name: string;
     description?: string;
     type: RoomType;
     status: RoomStatus;
     capacity: number;
     features: ID[];
     hourlyRate: number;
     discountedHourlyRate: number;
     googleCalendarId?: string;
     location: string;
     equipment: string[];

     // BookingRules fields:
     MinimumBookingMinutes: number;
     MaximumBookingMinutes: number;
     RequiredApproval: boolean;
     FreeHoursForKlikcaCard: number;
  positionX: number;
  positionY: number;
  // ממדי סביבת העבודה
  width: number;
  height: number;
     nextMaintenanceDate?: DateISO;
     workspaceMapId: ID; 
     createdAt?: DateISO;
     updatedAt?: DateISO;
   }) {
    this.id = params.id ?? crypto.randomUUID(); 
    this.name = params.name;  
    this.description = params.description;
    this.type = params.type;
    this.status = params.status;
    this.capacity = params.capacity;
    this.features = params.features;
    this.hourlyRate = params.hourlyRate;  
    this.discountedHourlyRate = params.discountedHourlyRate;
    this.googleCalendarId = params.googleCalendarId;
    this.location = params.location;
    this.equipment = params.equipment;
    this.MinimumBookingMinutes = params.MinimumBookingMinutes;
    this.MaximumBookingMinutes = params.MaximumBookingMinutes;
    this.RequiredApproval = params.RequiredApproval;
    this.FreeHoursForKlikcaCard = params.FreeHoursForKlikcaCard;
    this.nextMaintenanceDate = params.nextMaintenanceDate;
    this.workspaceMapId = params.workspaceMapId; 
    this.positionX = params.positionX;
    this.positionY = params.positionY;
    this.width = params.width;
    this.height = params.height;
    this.createdAt = params.createdAt ?? new Date().toISOString(); 
    this.updatedAt = params.updatedAt ?? new Date().toISOString(); 
   }
toDatabaseFormat() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      status: this.status,
      capacity: this.capacity,
      features: this.features,
      hourly_rate: this.hourlyRate,
      discounted_hourly_rate: this.discountedHourlyRate,
      google_calendar_id: this.googleCalendarId,
      location: this.location,
      equipment: this.equipment,
      minimum_booking_minutes: this.MinimumBookingMinutes,
      maximum_booking_minutes: this.MaximumBookingMinutes,
      required_approval: this.RequiredApproval,
      free_hours_for_klikca_card: this.FreeHoursForKlikcaCard,
      next_maintenance_date: this.nextMaintenanceDate,
      workspace_map_id:this.workspaceMapId,
      position_x: this.positionX,
      position_y: this.positionY,
      width: this.width,
      height: this.height,
       createdat: this.createdAt,
       updatedat: this.updatedAt
    };
  }
       static fromDatabaseFormat(dbData: any): RoomModel {
        return new RoomModel({
            id: dbData.id,
            name: dbData.name,
            description: dbData.description,
            type: dbData.type,
            status: dbData.status,
            capacity: dbData.capacity,
            features: dbData.features,
            hourlyRate: dbData.hourly_rate,
            discountedHourlyRate: dbData.discounted_hourly_rate,
            googleCalendarId: dbData.google_calendar_id,
            location: dbData.location,
            equipment: dbData.equipment,
            MinimumBookingMinutes: dbData.minimum_booking_minutes,
            MaximumBookingMinutes: dbData.maximum_booking_minutes,
            RequiredApproval: dbData.required_approval,
            FreeHoursForKlikcaCard: dbData.free_hours_for_klikca_card,
            nextMaintenanceDate: dbData.next_maintenance_date,
            positionX: dbData.position_x,
            positionY: dbData.position_y,
            width: dbData.width,
            height: dbData.height,
            workspaceMapId: dbData.workspace_map_id, 
        });
    }
    static fromDatabaseFormatArray(dbDataArray: any[] ): RoomModel[] {
        return dbDataArray.map(dbData => RoomModel.fromDatabaseFormat(dbData));
    }
}