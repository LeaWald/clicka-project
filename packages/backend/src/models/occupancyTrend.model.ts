
import { ID, DateISO } from 'shared-types/core';
import { OccupancyTrend, TimePeriod, StatusOccupancy, WorkSpaceType }from 'shared-types/occupancy'

export class OccupancyTrendModel implements OccupancyTrend {
 id?:ID;
  period: TimePeriod;
  roomId: string;
  customerId: string;
  date: string;
  occupancyRate: number;
  totalSpace: number;
  occupiedSpaces: number;
  averageOccupancy: number;
  peakOccupancy: number;
  lowOccupancy: number;
  growthRate: number;
  type: StatusOccupancy;
  threshold: number;
  currentValue: number;
  workspaceType: WorkSpaceType;
  isActive: boolean;
  triggeredAt: DateISO;
  constructor(data:{
    id?: ID,
    period: TimePeriod,
    roomId: string,
    customerId: string,
    date: string,
    occupancyRate: number,
    totalSpace: number,
    occupiedSpaces: number,
    averageOccupancy: number,
    peakOccupancy: number,
    lowOccupancy: number,
    growthRate: number,
    
    type: StatusOccupancy,
    threshold: number,
    currentValue: number,
    workspaceType: WorkSpaceType,
    isActive: boolean,
    triggeredAt: DateISO
  }) {
    // Trend
    this.id=data.id;
    this.period = data.period||" ";
    this.roomId = data.roomId||" ";
    this.customerId = data.customerId||" ";
    this.date = data.date||" ";
    this.occupancyRate = data.occupancyRate;
    this.totalSpace = data.totalSpace;
    this.occupiedSpaces = data.occupiedSpaces;
    this.averageOccupancy = data.averageOccupancy;
    this.peakOccupancy = data.peakOccupancy;
    this.lowOccupancy = data.lowOccupancy;
    this.growthRate = data.growthRate;
    // Alert
    
    this.type = data.type||" ";
    this.threshold = data.threshold;
    this.currentValue = data.currentValue;
    this.workspaceType = data.workspaceType;
    this.isActive = data.isActive;
    this.triggeredAt = data.triggeredAt||" ";
  }
  toDatabaseFormat() {
    return {
      period: this.period,
      room_id: this.roomId,
      customer_id: this.customerId,
      date: this.date,
      occupancy_rate: this.occupancyRate,
      total_space: this.totalSpace,
      occupied_spaces: this.occupiedSpaces,
      average_occupancy: this.averageOccupancy,
      peak_occupancy: this.peakOccupancy,
      low_occupancy: this.lowOccupancy,
      growth_rate: this.growthRate,
      
      type: this.type,
      thresho_id: this.threshold,
      current_value: this.currentValue,
      workspace_type: this.workspaceType,
      is_active: this.isActive,
      triggered_at: this.triggeredAt,
    };
  }
  static fromDatabaseFormat(dbData: any): OccupancyTrendModel {
    return new OccupancyTrendModel({
      id: dbData.id,
      period: dbData.period,
      roomId: dbData.room_id,
      customerId: dbData.customer_id,
      date: dbData.date,
      occupancyRate: dbData.occupancy_rate,
      totalSpace: dbData.total_space,
      occupiedSpaces: dbData.occupied_spaces,
      averageOccupancy: dbData.average_occupancy,
      peakOccupancy: dbData.peak_occupancy,
      lowOccupancy: dbData.low_occupancy,
      growthRate: dbData.growth_rate,
      type: dbData.type,
      threshold: dbData.threshold,
      currentValue: dbData.current_value,
      workspaceType: dbData.workspace_type,
      isActive: dbData.is_active,
      triggeredAt: dbData.triggered_at,
    });
}
static fromDatabaseFormatArray(dbDataArray: any[] ): OccupancyTrendModel[] {
    return dbDataArray.map(dbData => OccupancyTrendModel.fromDatabaseFormat(dbData));
}
}
