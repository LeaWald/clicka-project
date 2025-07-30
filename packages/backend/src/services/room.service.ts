
import { createClient } from '@supabase/supabase-js';
import { RoomModel } from "../models/room.model";
import { RoomFeatureModel } from '../models/roomFeature.model';
import type { ID } from "shared-types";
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function logUserActivity(userId: string, action: string) {
  console.log(`[Activity Log] ${userId}: ${action}`);
}
//יצירת חדר
export class RoomService {
async  createRoomRequest(room: RoomModel): Promise<RoomModel | null> {
        console.log('📦 Inserting room:', room.toDatabaseFormat());
        const { data, error } = await supabase
          .from('room')
          .insert([room.toDatabaseFormat()])
          .select()
          .single();
    
    
       if (error) {
      console.log('❌ Supabase Insert Error:', error); // ✅ הוספתי הדפסה מפורטת
    throw new Error(`Failed to create booking: ${error.message}`);
      }
    
        const createdroom =   RoomModel.fromDatabaseFormat(data);
        logUserActivity(room.id ?? room.name, 'book created');
        return createdroom;
}
//קבלת כל החדרים
//החזרת כל החדרים מהמסד נתונים
      async getAllrooms() {
    try {
      const { data, error } = await supabase
        .from('room') 
      .select('*'); 
      const { data: features, error: featureError } = await supabase
      .from("feature")
      .select("*");
    
      if (error) {
        console.error('Supabase error:', error.message);
        return null;
      }
 const createdroom = RoomModel.fromDatabaseFormatArray(data)
 console.log('Rooms fetched from database:', createdroom);
      return createdroom;
    } catch (err) {
      console.error('Unexpected error:', err);
      return null;
    }
  }

//עדכון חדר
//בעדכון Room.status= לא פעיל יש להוסיף בדיקה האם קימת הזמנה עתידית אם כן לשלוח שגיאה
//ב-Controller לעדכון תכונות / ציוד: לפני שמוחקים — לבדוק אם יש Booking.
//בשמשנים discountedHourlyRate או hourlyRate צריך לשמור את המחיר בזמן ההזמנה ולהזמנות קימות לא לשנות מחיר אוטומטי
      async updateRoom(id: string, updatedData: RoomModel): Promise<RoomModel | null> {
    
        const { data, error } = await supabase
            .from('room')
            .update([updatedData.toDatabaseFormat()])
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating room:', error);
            return null;
        }
        const room =  RoomModel.fromDatabaseFormat(data); 
        // רישום פעילות המשתמש
        //logUserActivity(feature.description, 'feature updated');
        // מחזיר את המשתמש המעודכן
        return room; 
}
//מחיקת חדר
async  deleteRoom(id:string) {
            const { error } = await supabase
            .from('room')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting room:', error);
            return false;
        }
        
       // logUserActivity(id, 'User deleted');
        // מחזיר true אם הפיצ'ר נמחק בהצלחה
        return true; 
}

//קבלת  חדר
async  getRoomById(id:string) {
         const { data, error } = await supabase
                .from('room')
                .select('*')
                .eq('id', id)
                .single();
    
            if (error) {
                console.error('Error fetching room:', error);
                return null;
            }
    
             const room =  RoomModel.fromDatabaseFormat(data); 
            // רישום פעילות המשתמש
           // logUserActivity(feature.id? feature.id:feature.description, 'User fetched by ID');
            // מחזיר את המשתמש שנמצא
            return room;
}
//טיפול בכשלים באינטגרציה עם יומן גוגל
//יש לבדוק אם ההרשאות תקינות ואם TOKEN בתוקפו 
//וכן יש לבדוק אם הפגשיה נשמרת
async  integrationWithGoogle(id:any) {
    //להשתמש ב-try,catch
    //לשמור שגיאות במסד נתונים
    //לשלוח הודעות למנהל במקרה של כשל
}

}

