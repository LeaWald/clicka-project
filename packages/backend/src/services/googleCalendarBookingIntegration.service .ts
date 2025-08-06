import type { CalendarEventInput, CreateGoogleCalendarEventRequest, DeleteGoogleCalendarEventRequest, GoogleCalendarEvent, ID, UpdateGoogleCalendarEventRequest } from "shared-types";
import { CalendarConflict, CalendarSync, CalendarSyncStatus } from "shared-types/calendarSync";
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv';
import { CalendarSyncModel } from "../models/calendarSync.model";
import { getEvents, updateEvent } from './calendar-service';
import { createEvent } from './calendar-service'
import { BookingModel } from "../models/booking.model";
import * as syncController from "../controllers/googleCalendarBookingIntegration.controller";
import {BookingService} from "./booking.service"
import { Event } from "shared-types/google";
// טוען את משתני הסביבה מקובץ .env
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || ''; // החלף עם ה-URL של פרויקט ה-Supabase שלך
const supabaseAnonKey = process.env.SUPABASE_KEY || ''; // החלף עם ה-Anon Key שלך
const supabase = createClient(supabaseUrl, supabaseAnonKey);
//נחמי קוזיץ getAll עבור event שליפת כל האירועים והמרת לאובייקט  
export const getGoogleCalendarEvents = async (calendarId: string, token: string): Promise<Event[]> => {
    const events = await getEvents(calendarId, token);
    
    const newEvents: Event[] = await Promise.all(events.map(async event => {
        console.log("event in the getGoogleCalendarEvents\n", event);
        console.log("event.id in the getGoogleCalendarEvents\n", event.id);

        const bookings = await BookingService.getBookingByEventId(event.id!);
        console.log(bookings, "bookings in the getGoogleCalendarEvents\n");
        
        // בחר את הסטטוס של ההזמנה הראשונה אם קיים
        const status = bookings && bookings.status ? bookings.status : null;

        console.log(status, "status in the getGoogleCalendarEvents\n");

        return {
            id: event.id || '',
            calendarId: calendarId,
            summary: event.summary || '',
            description: event.description || '',
            location: event.location || '',
            start: {
                dateTime: event.start?.dateTime || '',
                timeZone: event.start?.timeZone || '',
            },
            end: {
                dateTime: event.end?.dateTime || '',
                timeZone: event.end?.timeZone || '',
            },
            attendees: event.attendees ? event.attendees.map(attendee => ({
                email: attendee.email || '',
                displayName: attendee.displayName || '',
            })) : [],
            status: status, // השתמש בסטטוס שנבחר
            created: event.created || '',
            updated: event.updated || '',
            htmlLink: event.htmlLink || '',
        };
    }));

    return newEvents; // החזר את המערך של האירועים
}

//יצירת אובייקט סינכרון כרגע לא רלוונטי
export const createCalendarSync = async (sync: CalendarSyncModel): Promise<CalendarSyncModel | null> => {
    const { data, error } = await supabase
        .from('calendar_sync') // שם הטבלה ב-Supabase
        // .insert([map]) // כך זה עובד?
        .insert([sync.toDatabaseFormat()])
        //לא צריך עם המרה?
        .select()
        .single();

    if (error) {
        console.error('Error creating sync:', error);
        return null;
    }

    const createdSync = CalendarSyncModel.fromDatabaseFormat(data); // המרה לסוג WorkspaceMapModel

    return createdSync;
}

//עדכון אובייקט סנכרון כרגע לא רלוונטי
export async function updateCalendarSync(id: string, updatedData: CalendarSyncModel): Promise<CalendarSyncModel | null> {

    console.log('Prepared sync data for update:', JSON.stringify(updatedData, null, 2));
    const { data, error } = await supabase
        .from('calendar_sync')
        .update([updatedData.toDatabaseFormat()])
        .eq('id', id)
        .select()
        .single();
    if (error) {
        console.error('Error updating sync:', error);
        return null;
    }
    const sync = CalendarSyncModel.fromDatabaseFormat(data);
    return sync;



}

//מחיקת אובייקט סנכרון כרגע לא רלוונטי ה 
export async function deleteCalendarSync(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('calendar_sync')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting sync:', error);
        return false;
    }

    return true;
}
// שליפת כל אובייקטי הסנכרון כרגע לא רלוונטי
export const gatAllCalendarSync = async (): Promise<CalendarSync[] | null> => {
    const { data, error } = await supabase
        .from('calendar_sync')
        .select('*')
    if (error) {
        console.error('Error fetching maps layout :', error);
        return null;
    }
    // const layouts = CalendarSyncModel.fromDatabaseFormatArray(data);


    return data;
}

//שליפת סנכרון לפי id כרגע לא רלוונטי`
export async function getCalendarSyncById(id: string) {
    const { data, error } = await supabase
        .from('calendar_sync')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching layout:', error);
        return null;
    }

    const layout = CalendarSyncModel.fromDatabaseFormat(data);

    return layout;
}

//המרת הזמנה לאובייקט תואם לקלנדר
export async function convertBookingToCalendarEvent(booking: BookingModel): Promise<CalendarEventInput> {
    console.log("booking in in the convert\n",booking);
    
    let newName="";
    if(booking.customerName){
        newName = booking.customerName;
    }
    else if(booking.externalUserName){
        newName = booking.externalUserName;
    }
    return {
        summary: `פגישה עבור ${newName}`,
        description: booking.notes,
        location: booking.roomName,
        start: {
            dateTime: booking.startTime,
            timeZone: 'Asia/Jerusalem' // ניתן לשנות לפי הצורך
        },
        end: {
            dateTime: booking.endTime,
            timeZone: 'Asia/Jerusalem' // ניתן לשנות לפי הצורך
        },
        //לבדוק האם צריך להוסיף פרטים של לקוח קיים- אם משתמשים בכלל בעמודה
        attendees: booking.externalUserEmail ? [{ email: booking.externalUserEmail }] : [],
        reminders: {
            useDefault: true // או false, תלוי בצורך שלך
        }
    };
}
export const createCalendarEvent = async (calendarId: string,
    booking: BookingModel,
    token: string) => {
    // השלבים העדכניים של הפונקציה 
    //להמיר הזמנה לאירוע
    //להוסיף את האירוע בקלנדר
    //לקחת את הid שנוצר
    //ולהוסיף אותו לאובייקט המתאים במסד

    //אם ההזמנה לא מאושרת-אין אפשרות ליצור אירוע
    console.log('Booking object:', booking);
    console.log('token object:', token);
    console.log('calendarId object:', calendarId);
    console.log("booking before the convert\n",booking);
    const calendarEvent = await convertBookingToCalendarEvent(booking);
    try {
        const statusEvent = await createEvent(calendarId, calendarEvent, token);
        console.log("statusEvent\n", statusEvent);
        
        if (statusEvent.id != null) {
            booking.googleCalendarEventId = statusEvent.id;
        }
        console.log("booking.googleCalendarEventId",booking.googleCalendarEventId);
        

        //לעדכן את נאווה שחייבים לשלוח id
          if (!booking.id) {
            throw new Error('Booking ID is required to update the booking.');
          }
          console.log('Type of updatedData:', booking.constructor.name);

          console.log(booking, "booking in ??????????????????????????\n  ,",booking.id);
          
        const bookingModel = booking instanceof BookingModel
  ? booking
  : new BookingModel(booking);
await BookingService.updateBooking(bookingModel.id!, bookingModel);

       
    } catch (error) {
        console.log("checking the type of", error);

        let errorMessage = 'An unknown error occurred'; // הודעת שגיאה ברירת מחדל

        if (error instanceof Error) {
            errorMessage = error.message; // אם error הוא אובייקט שגיאה
        } else if (typeof error === 'string') {
               errorMessage = error; // אם error הוא מחרוזת
        }

    
    }

}



export const deleteEnevt = async (enevt: DeleteGoogleCalendarEventRequest) => {
    // פונקציה זו תמחק אירוע.
    // לאה שארר-deleteGoogleCalendarEvent ע"י שליחה לפונקצית מחיקה
    // המתאים calendarSync ותמחק את ה 
    //deleteCalendarSyncByEventId() ע"י הפונקציה 
}



export const updateEnevtOnChangeBooking =  async (calendarId: string,
    eventId : string,
    booking: BookingModel,
    token: string) => {
    // פונקציה זו תעדכן אירוע קיים בלוח השנה כאשר פרטי ההזמנה משתנים.
    // לאה שארר-updateGoogleCalendarEvent ע"י שליחה לפונקצית עדכון
    // המתאים calendarSync ותעדכן את ה 
    //updateCalendarSync() ע"י  מציאתו בפונקציה 
    console.log('Booking object:', booking);
    console.log('token object:', token);
    console.log('calendarId object:', calendarId);
    console.log("booking before the convert\n",booking);
    const calendarEvent = await convertBookingToCalendarEvent(booking);
    try {
        const statusEvent = await updateEvent(calendarId,eventId, calendarEvent, token);
        console.log("statusEvent\n", statusEvent);
        
        if (statusEvent.id != null) {
            booking.googleCalendarEventId = statusEvent.id;
        }
        console.log("booking.googleCalendarEventId",booking.googleCalendarEventId);
        

        //לעדכן את נאווה שחייבים לשלוח id
          if (!booking.id) {
            throw new Error('Booking ID is required to update the booking.');
          }
          console.log('Type of updatedData:', booking.constructor.name);

          console.log(booking, "booking in ??????????????????????????\n  ,",booking.id);
          
        const bookingModel = booking instanceof BookingModel
  ? booking
  : new BookingModel(booking);
await BookingService.updateBooking(bookingModel.id!, bookingModel);

       
    } catch (error) {
        console.log("checking the type of", error);

        let errorMessage = 'An unknown error occurred'; // הודעת שגיאה ברירת מחדל

        if (error instanceof Error) {
            errorMessage = error.message; // אם error הוא אובייקט שגיאה
        } else if (typeof error === 'string') {
               errorMessage = error; // אם error הוא מחרוזת
        }

    
    }

}



export const getCalendarByRoom = async (roomId: ID): Promise<CalendarSync | null> => {
    //  לקבלת לוח שנה עפ"י קוד חדר
    return null;
}


export const manageCalendarPermissions = async (calendarId: string, email: string, role?: string): Promise<void> => {
    //Google Calendar API כדי לנהל את ההרשאות
    // לדוגמה, אפשר להשתמש ב-ACL (Access Control Lists) כדי להוסיף או לעדכן הרשאות
}

export const shareCalendar = async (calendarId: string, email: string): Promise<void> => {
    // אפשר להשתמש ב-Google Calendar API כדי לשתף את לוח השנה עם כתובת המייל
}









