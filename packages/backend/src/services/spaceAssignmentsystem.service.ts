import { createClient } from '@supabase/supabase-js';
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


  async createSpace(space: SpaceAssignmentModel): Promise<SpaceAssignmentModel | null> {
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

  const createdSpace = SpaceAssignmentModel.fromDatabaseFormat(data);

  // 🧠 שלב 1: בדיקה האם ה-workspace הזה הוא חדר פרטי
  const { data: roomWorkspace, error: workspaceError } = await supabase
    .from('workspace')
    .select('type')
    .eq('id', createdSpace.workspaceId)
    .single();

  if (workspaceError) {
    console.error('Error fetching workspace type:', workspaceError);
    return createdSpace;
  }

  if (roomWorkspace?.type === 'PRIVATE_ROOM') {
    // 🪑 שלב 2: שליפת כל השולחנות שממוקמים בתוך אותו חדר (location === workspaceId)
    const { data: desks, error: deskError } = await supabase
      .from('workspace')
      .select('id')
      .eq('location', createdSpace.workspaceId)
      .eq('type', 'DESK');

    if (deskError) {
      console.error('Error fetching desks in room:', deskError);
    }

    if (desks && desks.length > 0) {
      const deskAssignments = desks.map((desk: any) =>
        new SpaceAssignmentModel({
          id: '',
          workspaceId: desk.id,
          customerId: createdSpace.customerId,
          assignedDate: createdSpace.assignedDate,
          unassignedDate: createdSpace.unassignedDate,
          daysOfWeek: createdSpace.daysOfWeek,
          notes: createdSpace.notes,
          assignedBy: createdSpace.assignedBy,
          status: createdSpace.status,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).toDatabaseFormat()
      );

      const { error: insertDesksError } = await supabase
        .from('space_assignment')
        .insert(deskAssignments);

      if (insertDesksError) {
        console.error('Error assigning desks in room:', insertDesksError);
      }
    }
  }

  return createdSpace;
}

  //קבלת כל המרחבים
  //החזרת כל המרחבים מהמסד נתונים
  async getAllSpaces() {
    try {
      const { data, error } = await supabase
        .from('space_assignment') // שם הטבלה שלך ב-Supabase
        .select('*');
      if (error) {
        console.error('Supabase error:', error.message);
        return null;
      }
      // const createdspace = SpaceAssignmentModel.fromDatabaseFormat(data)
      const createdspace = SpaceAssignmentModel.fromDatabaseFormatArray(data);

      return createdspace;
    } 
   catch (err) {
      console.error('Unexpected error:', err);
      return null;
    }
  }
  //עדכון מרחב
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
  //מחיקת מרחב
  async deleteSpace(id: string) {
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
  async getSpaceById(id: string) {
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
  excludeId?: string,
  daysOfWeek?: number[]
): Promise<SpaceAssignmentModel[]> {
  try {
    console.log('Checking conflicts in DB for:', {
      workspaceId, assignedDate, unassignedDate, excludeId
    });

    let query = supabase
      .from('space_assignment')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in('status', ['ACTIVE']);

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

    const existingAssignments = data.map(item =>
      SpaceAssignmentModel.fromDatabaseFormat(item)
    );
    console.log('Found existing assignments:', existingAssignments.length);

    const conflicts = existingAssignments.filter(existing => {
      const existingStart = new Date(existing.assignedDate);
      const existingEnd = existing.unassignedDate
        ? new Date(existing.unassignedDate)
        : null;
      const newStart = new Date(assignedDate);
      const newEnd = unassignedDate ? new Date(unassignedDate) : null;

      // שלב 1: בדיקת חפיפת תאריכים
      let hasDateConflict = false;

      if (!existingEnd) {
        hasDateConflict = newStart >= existingStart;
      } else if (!newEnd) {
        hasDateConflict = newStart <= existingEnd;
      } else {
        hasDateConflict = newStart <= existingEnd && newEnd >= existingStart;
      }

      if (!hasDateConflict) return false;

      // שלב 2: בדיקת חפיפת ימים – רק אם שני הצדדים כוללים daysOfWeek
      const existingDays = existing.daysOfWeek;
      const newDays = daysOfWeek;

      if (
        Array.isArray(existingDays) && existingDays.length > 0 &&
        Array.isArray(newDays) && newDays.length > 0
      ) {
        const overlap = newDays.some(day => existingDays.includes(day));
        if (!overlap) return false;
      }

      // יש חפיפה בלו"ז ובימים – קונפליקט
      return true;
    });

    console.log('Found conflicts:', conflicts.length);
    return conflicts;

  } catch (error) {
    console.error('Error in checkConflicts:', error);
    throw error;
  }
}

// async getHistory(date: Date): Promise<SpaceAssignmentModel[]> {
//   try {
//     const { data, error } = await supabase
//       .from('space_assignment')
//       .select('*')
//       .lte('assigned_date', date.toISOString()) 
//       .or(`unassigned_date.is.null,unassigned_date.gte.${date.toISOString()}`); // שעדיין בתוקף

//     if (error) {
//       console.error('Supabase error in getHistory:', error.message);
//       throw new Error('Failed to fetch history');
//     }

//     const allAssignments = data.map((item: any) => SpaceAssignmentModel.fromDatabaseFormat(item));

   
//     const weekday = date.getDay(); 

//     const filtered = allAssignments.filter(assign => {
//       if (!assign.daysOfWeek || assign.daysOfWeek.length === 0) {
//         return true; 
//       }
//       return assign.daysOfWeek.includes(weekday);
//     });

//     return filtered;

//   } catch (err) {
//     console.error('Error in getHistory:', err);
//     throw err;
//   }
// }


async getHistory(date: Date): Promise<any[]> { // שים לב: מחזיר מערך של אובייקטים, לא של SpaceAssignmentModel
  try {
    const formatted = date.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('space_assignment')
      .select('*, customer:customer_id(name)')
      .lte('assigned_date', formatted)
      .or(`unassigned_date.is.null,unassigned_date.gte.${formatted}`);

    if (error) {
      console.error('Supabase error in getHistory:', error.message);
      throw new Error('Failed to fetch history');
    }

    const allAssignments = data.map((item: any) => {
      const model = SpaceAssignmentModel.fromDatabaseFormat(item);
      return {
        ...model,
        customerName: item.customer?.name || '',
      };
    });

    const weekday = date.getDay();

    const filtered = allAssignments.filter(assign => {
      if (!assign.daysOfWeek || assign.daysOfWeek.length === 0) {
        return true;
      }
      return assign.daysOfWeek.includes(weekday);
    });

    return filtered;

  } catch (err) {
    console.error('Error in getHistory:', err);
    throw err;
  }
}


}