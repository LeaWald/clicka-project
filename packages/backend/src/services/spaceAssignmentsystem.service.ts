import { createClient } from '@supabase/supabase-js';
import { RoomModel } from "../models/room.model";
import { SpaceStatus, type DateRangeFilter, type ID, type OccupancyReportResponse, type Space } from "shared-types";
import dotenv from 'dotenv';
import { SpaceAssignmentModel } from '../models/spaceAssignment.model';
dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);
function logUserActivity(userId: string, action: string) {
  console.log(`[Activity Log] ${userId}: ${action}`);
}
//הקצאת מרחב
export class SpaceAssignmentService {
async  createSpace(space: SpaceAssignmentModel): Promise<SpaceAssignmentModel | null> {
        console.log(':package: Inserting space:', space.toDatabaseFormat());
        const { data, error } = await supabase
          .from('space_assignment')
          .insert([space.toDatabaseFormat()])
          .select()
          .single();
       if (error) {
      console.log(':x: Supabase Insert Error:', error);
    throw new Error(`Failed to create space: ${error.message}`);
      }
        const createdspace = SpaceAssignmentModel.fromDatabaseFormat(data);
        //logUserActivity(room.id ?? room.name, 'book created');
        return createdspace;
}
//קבלת כל ההקצאות
 async getAllSpaces() {
    try {
      const { data, error } = await supabase
        .from('space_assignment') // שם הטבלה שלך ב-Supabase
        .select('*');
      if (error) {
        console.error('Supabase error:', error.message);
        return null;
      }
 const createdspace = SpaceAssignmentModel.fromDatabaseFormatArray(data)
      return createdspace;
    } 
   catch (err) {
      console.error('Unexpected error:', err);
      return null;
    }
}
//עדכון הקצאה
      async updateSpace(id: string, updatedData: SpaceAssignmentModel): Promise<SpaceAssignmentModel | null> {
        const { data, error } = await supabase
            .from('space_assignment')
            .update([updatedData.toDatabaseFormat()])
            .eq('id', id)
            .select()
            .single();
        if (error) {
            console.error('Error updating space:', error);
            return null;
        }
        const space = SpaceAssignmentModel.fromDatabaseFormat(data);
        //logUserActivity(feature.description, 'feature updated');
        return space;
      
}
//מחיקת הקצאה
async  deleteSpace(id:string) {
            const { error } = await supabase
            .from('space_assignment')
            .delete()
            .eq('id', id);
        if (error) {
            console.error('Error deleting space:', error);
            return false;
        }
       // logUserActivity(id, 'User deleted');
        return true;
}
//קבלת  מרחב לפי ID
async  getSpaceById(id:string) {
         const { data, error } = await supabase
                .from('space_assignment')
                .select('*')
                .eq('id', id)
                .single();
            if (error) {
                console.error('Error fetching space:', error);
                return null;
            }
            const space = SpaceAssignmentModel.fromDatabaseFormat(data);
            return space;
}

   // בדיקת קונפליקטים
    async checkConflicts(
        workspaceId: string, 
        assignedDate: string, 
        unassignedDate?: string, 
        excludeId?: string
    ): Promise<SpaceAssignmentModel[]> {
        try {
            console.log('Checking conflicts in DB for:', { workspaceId, assignedDate, unassignedDate, excludeId });
            
            let query = supabase
                .from('space_assignment')
                .select('*')
                .eq('workspace_id', workspaceId)
                .in('status', ['ACTIVE']); // לא כולל ENDED
            
            // אם יש excludeId (למקרה של עדכון), לא לכלול אותו
            if (excludeId) {
                query = query.neq('id', excludeId);
            }
            
            const { data, error } = await query;
            
            if (error) {
                console.error('Supabase error in checkConflicts:', error);
                throw new Error(`Failed to check conflicts: ${error.message}`);
            }
            
            if (!data || data.length === 0) {
                console.log('No existing assignments found');
                return [];
            }
            
            // המרה לאובייקטים
            const existingAssignments = data.map(item => SpaceAssignmentModel.fromDatabaseFormat(item));
            console.log('Found existing assignments:', existingAssignments.length);
            
            // בדיקת חפיפות
            const conflicts = existingAssignments.filter(existing => {
                const existingStart = new Date(existing.assignedDate);
                const existingEnd = existing.unassignedDate ? new Date(existing.unassignedDate) : null;
                const newStart = new Date(assignedDate);
                const newEnd = unassignedDate ? new Date(unassignedDate) : null;
                
                // אם ההקצאה הקיימת אין לה תאריך סיום - היא פעילה לתמיד
                if (!existingEnd) {
                    // אם ההקצאה החדשה מתחילה אחרי הקיימת - יש קונפליקט
                    return newStart >= existingStart;
                }
                
                // אם להקצאה החדשה אין תאריך סיום
                if (!newEnd) {
                    // אם היא מתחילה לפני שהקיימת מסתיימת - יש קונפליקט
                    return newStart <= existingEnd;
                }
                
                // בדיקת חפיפה רגילה
                return (newStart <= existingEnd && newEnd >= existingStart);
            });
            
            console.log('Found conflicts:', conflicts.length);
            return conflicts;
            
        } catch (error) {
            console.error('Error in checkConflicts:', error);
            throw error;
        }
    }


async getHistory(date: Date): Promise<Space[] | null> {
  const dateStr = date.toISOString().split('T')[0];
  console.log('🔍 dateStr:', dateStr);

  const { data: assignments, error } = await supabase
    .from('space_assignment')
    .select('*')
    .lte('assigned_date', dateStr); // לשלוף רק הקצאות שהתחילו עד התאריך

  if (error) return null;
  if (!assignments || assignments.length === 0) return [];

  const workspaceIds = [...new Set(assignments.map((a) => a.workspace_id))];
  const { data: workspaceData, error: workspaceError } = await supabase
    .from('workspace')
    .select('*')
    .in('id', workspaceIds);

  if (workspaceError || !workspaceData) return null;

  const customerIds = [...new Set(assignments.map((a) => a.customer_id))];
  const { data: customerData, error: customerError } = await supabase
    .from('customer')
    .select('id, name')
    .in('id', customerIds);

  if (customerError || !customerData) return null;

  const workspaceMap = new Map(workspaceData.map((w) => [w.id, w]));
  const customerMap = new Map(customerData.map((c) => [c.id, c.name]));

  const targetDate = new Date(dateStr);

  const workspaces: Space[] = assignments.flatMap((record) => {
    const assignedDate = new Date(record.assigned_date);
    const unassignedDate = record.unassigned_date ? new Date(record.unassigned_date) : null;

    const isRelevant =
      targetDate >= assignedDate &&
      (unassignedDate === null || targetDate <= unassignedDate);

    if (!isRelevant) return []; // התאריך לא בטווח – מדלגים

    const workspace = workspaceMap.get(record.workspace_id);
    const customerName = customerMap.get(record.customer_id) ?? '';

    let sStatus: SpaceStatus = SpaceStatus.AVAILABLE;

    switch (record.status) {
      case 'ACTIVE':
      case 'ENDED':
        sStatus = SpaceStatus.OCCUPIED;
        break;
      case 'SUSPENDED':
        sStatus = SpaceStatus.RESERVED;
        break;
      case 'INACTIVE':
        sStatus =SpaceStatus.INACTIVE;
        break;
    }

    return [{
      id: record.workspace_id,
      workspaceMapId: workspace?.workspace_map_id,
      name: workspace?.name ?? '',
      description: workspace?.description ?? '',
      type: workspace?.type ?? '',
      status: sStatus,
      currentCustomerId: record.customer_id,
      currentCustomerName: customerName,
      positionX: workspace?.position_x,
      positionY: workspace?.position_y,
      width: workspace?.width,
      height: workspace?.height,
      location: workspace?.location ?? '',
      createdAt: record.created_at ?? '',
      updatedAt: record.updated_at ?? '',
    }];
  });

  return workspaces;
}
    
   // קבלת דו"ח תפוסה על פי תאריך וסוג חלל
async getOccupancyReport(type: string, startDate: string, endDate: string): Promise<{
    count: number;           // סה"כ חללים מהסוג הזה
    data: SpaceAssignmentModel[];  // חללים תפוסים בתאריכים
    occupancyRate: number; }        // אחוז תפוסה
    > {
    let rate = 0;
    const { count, error } = await supabase
        .from('workspace')
        .select('*', { count: 'exact', head: true })
        .eq('type', type);
 if( error){
  console.error('Error fetching workspace', error);
 }
    const { data:spaces, error: DataError } = await supabase
        .from('space_assignment')
        .select(`
            *,
            workspace_id (
                id,
                name,
                type,
                room,
                current_customer_name
            )
        `)
        .eq('workspace_id.type', type)
        .lte('assigned_date', startDate)
        .or(`unassigned_date.is.null,unassigned_date.gte.${endDate}`);
    if (DataError) {
        console.error('Error fetching assignement_space:', DataError);
    }
 if(count!==null){
        rate = count ? (spaces?.length || 0) / count * 100 : 0;
   } 
    return {
        count: count || 0,
        data: spaces ||[],
        occupancyRate: rate || 0,
    };
}
}
