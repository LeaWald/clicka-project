
import { createClient } from '@supabase/supabase-js';
import { RoomModel } from "../models/room.model";
import type { ID } from "shared-types";
import { WorkspaceModel } from '../models/workspace.model'
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function logUserActivity(userId: string, action: string) {
  console.log(`[Activity Log] ${userId}: ${action}`);
}
export class WorkspaceService {
  async createWorkspace(Workspace: WorkspaceModel): Promise<WorkspaceModel | null> {
    console.log('📦 Inserting Workspace:', Workspace.toDatabaseFormat());
    const { data, error } = await supabase
      .from('workspace')
      .insert([Workspace.toDatabaseFormat()])
      .select()
      .single();
    if (error) {
      console.log('❌ Supabase Insert Error:', error); // ✅ הוספתי הדפסה מפורטת
      throw new Error(`Failed to create workspace: ${error.message}`);
    }

    const createWorkspace = WorkspaceModel.fromDatabaseFormat(data);
    // logUserActivity(room.id ?? room.name, 'book created');
    return createWorkspace;
  }
  //קבלת כל החדרים
  //החזרת כל החדרים מהמסד נתונים


  async getAllWorkspace() {
    try {
      const { data, error } = await supabase
        .from('workspace') // שם הטבלה שלך ב-Supabase
        .select('*');

      if (error) {
        console.error('Supabase error:', error.message);
        return null;
      }
      const createworkspace = WorkspaceModel.fromDatabaseFormatArray(data)
      return createworkspace;
    } catch (err) {
      console.error('Unexpected error:', err);
      return null;
    }
  }

  //עדכון חדר
  //בעדכון Room.status= לא פעיל יש להוסיף בדיקה האם קימת הזמנה עתידית אם כן לשלוח שגיאה
  //ב-Controller לעדכון תכונות / ציוד: לפני שמוחקים — לבדוק אם יש Booking.
  //בשמשנים discountedHourlyRate או hourlyRate צריך לשמור את המחיר בזמן ההזמנה ולהזמנות קימות לא לשנות מחיר אוטומטי

  async updateWorkspace(id: string, updatedData: WorkspaceModel): Promise<WorkspaceModel | null> {
    const { data, error } = await supabase
      .from('workspace')
      .update([updatedData.toDatabaseFormat()])
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Error updating room:', error);
      return null;
    }
    const workspce = WorkspaceModel.fromDatabaseFormat(data);
    return workspce;
  }
  
  //מחיקת חדר
  async deleteWorkspace(id: string) {
    const { error } = await supabase
      .from('workspace')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting workspace:', error);
      return false;
    }

    // logUserActivity(id, 'User deleted');
    // מחזיר true אם הפיצ'ר נמחק בהצלחה
    return true;
  }

  async getworkspaceById(id: string) {
    const { data, error } = await supabase
      .from('workspace')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching workspace:', error);
      return null;
    }
    const workspace = WorkspaceModel.fromDatabaseFormat(data);
    return workspace;
  }


  //טיפול בכשלים באינטגרציה עם יומן גוגל
  //יש לבדוק אם ההרשאות תקינות ואם TOKEN בתוקפו 
  //וכן יש לבדוק אם הפגשיה נשמרת
  async integrationWithGoogle(id: any) {
    //להשתמש ב-try,catch
    //לשמור שגיאות במסד נתונים
    //לשלוח הודעות למנהל במקרה של כשל
  }
}