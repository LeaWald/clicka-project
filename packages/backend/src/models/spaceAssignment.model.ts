//import { daysInWeek } from "date-fns";
import { AssignmentStatus, SpaceAssign } from "shared-types/spaceAssignment";

export class SpaceAssignmentModel implements SpaceAssign {
    id?: string;
    workspaceId: string;
    customerId?: string;
    assignedDate: Date;
    unassignedDate?: Date;
    daysOfWeek?: number[];
    hours?: number[];
    notes?: string;
    assignedBy: string;
    status: AssignmentStatus;
    createdAt: Date;
    updatedAt: Date;
  
    constructor(params: {
        id: string;
        workspaceId: string;
        customerId?: string;
        assignedDate: Date;
        unassignedDate?: Date;
        daysOfWeek?: number[];
        notes?: string;
        assignedBy: string;
        status: AssignmentStatus;
        createdAt: Date;
        updatedAt: Date;
    }) {
        this.id = params.id || undefined;
        this.workspaceId = params.workspaceId;
        this.customerId = params.customerId;
        this.assignedDate = params.assignedDate;
        this.unassignedDate = params.unassignedDate;
        this.daysOfWeek = params.daysOfWeek;
        this.notes = params.notes;
        this.assignedBy = params.assignedBy;
        this.status = params.status;
        this.createdAt = params.createdAt;
        this.updatedAt = params.updatedAt;
    }

    toDatabaseFormat() {
        return {
            workspace_id: this.workspaceId,
            customer_id: this.customerId,
            assigned_date: this.assignedDate,
            unassigned_date: this.unassignedDate,
            days_of_week: this.daysOfWeek,
            notes: this.notes,
            assigned_by: this.assignedBy,
            status: this.status,
            created_at: this.createdAt,
            updated_at: this.updatedAt,
        };
    }
    static fromDatabaseFormat(dbData: any): SpaceAssignmentModel {
        return new SpaceAssignmentModel({
            id: dbData.id,
            workspaceId: dbData.workspace_id,
            customerId: dbData.customer_id,
            assignedDate: dbData.assigned_date,
            unassignedDate: dbData.unassigned_date,
            daysOfWeek: dbData.days_of_week,
            notes: dbData.notes,
            assignedBy: dbData.assigned_by,
            status: dbData.status,
            createdAt: dbData.created_at,
            updatedAt: dbData.updated_at,
        });
    }
    static fromDatabaseFormatArray(dbDataArray: any[]): SpaceAssignmentModel[] {
        return dbDataArray.map(dbData => SpaceAssignmentModel.fromDatabaseFormat(dbData));
    }
}