import { createClient } from '@supabase/supabase-js';
import { BookingModel } from "../models/booking.model";
// import type { ID, Room } from "shared-types";
import dotenv from 'dotenv';
import { customerService } from './customer.service';
import { getCurrentMeetingRoomPricing, getMeetingRoomPricingHistory } from './pricing.service';
import { EmailTemplateService } from './emailTemplate.service';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);


function logUserActivity(userId: string, action: string) {
  console.log(`[Activity Log] ${userId}: ${action}`);
}

export class BookingService {
  //פונקציה לחישוב סכום חיובים עבור הזמנת חדר ישיבות
  //אם הלקוח הוא חיצוני תשלום רגיל
  //אם  הלקוח הוא קיים:
  //1.אם מוקצה לו כרגע חלל - זה בחינם ?
  //2.אם יש לו כרטיס קליקה משודרג הוא מקבל  3 שעות ראשונות חינם 
  //ואח"כ לכל שעה נוספת 100 שח
  //3.אחרת מחיר הרגיל
  static async calculateExtrenalCharges(totalHours: number) {
    const roomPricing = await getCurrentMeetingRoomPricing();
    if (!roomPricing) {
      console.log("there is no pricing");
      return null;
    }
    let totalCharge: number = 0;
    let chargeableHours: number = 0;
    chargeableHours = totalHours
    totalCharge = (totalHours * roomPricing.hourlyRate)
    return {
      chargeableHours
      , totalCharge
    }
  }
  static async calculateCustomerCharges(customerId: string, totalHours: number) {
    console.log('Received request to update booking:', customerId);
    // בדיקה האם ללקוח כרטיס קליקה משודרג
    const customerServic = new customerService()
    const customers = await customerServic.getAllCustomers();
    console.log("customers" + customers);
    const currentCustomerType = customers?.find(customer => customer.id === customerId)?.currentWorkspaceType
    if (!currentCustomerType) {
      console.log("there is no customer type");
    }
    console.log("currentCustomerType" + currentCustomerType);
    let totalCharge: number = 0;
    let chargeableHours: number = 0;
    
    if (currentCustomerType === "KLIKAH_CARD") {
      if (totalHours <= 3) {
        totalCharge = 0;
        chargeableHours = 0
      }
      else {
        chargeableHours = totalHours - 3
        totalCharge = chargeableHours * 100
      }
    }
    else {
      await this.calculateExtrenalCharges(totalHours)
    }
    return {
      chargeableHours,
      totalCharge
    }
  }
  async createBooking(book: BookingModel): Promise<BookingModel | null> {
    try {
      let chargeableHour: number = 0 ;
let totalCharge: number = 0;

if (book.externalUserName) {
  const result = await BookingService.calculateExtrenalCharges(book.totalHours);
  if (result) {
    chargeableHour = result.chargeableHours;
    totalCharge = result.totalCharge;
  }
} else if (book.customerId) {
  const result = await BookingService.calculateCustomerCharges(book.customerId, book.totalHours);
  if (result) {
    chargeableHour = result.chargeableHours;
    totalCharge = result.totalCharge;
  }
}
console.log("chargeableHour , totalCharge"+chargeableHour , totalCharge);
 
book.chargeableHours = chargeableHour
book.totalCharge = totalCharge
      console.log('📦 Inserting booking:', book);
      const { data, error } = await supabase
        .from('booking')
        .insert([book.toDatabaseFormat()])
        .select()
        .single();
      if (error) {
        console.log('❌ Supabase Insert Error:', error);
        throw new Error(`Failed to create booking: ${error.message}`);
      }

      const createdBook = BookingModel.fromDatabaseFormat(data);
      logUserActivity(book.id ?? book.roomName, 'book created');
      return createdBook;
    } catch (err) {
      console.error('❌ Error in createBooking:', err);
      return null;
    }
  }
  async getAllBooking() {
    try {
      const { data, error } = await supabase
        .from('booking')
        .select('*');
      if (error) {
        console.error('Supabase error:', error.message);
        return null;
      }
      const booking = BookingModel.fromDatabaseFormatArray(data)
      return booking;
    } catch (err) {
      console.error('Unexpected error:', err);
      return null;
    }
  }
  
  static async updateBooking(id: string, updatedData: BookingModel): Promise<BookingModel | null> {
    //אם התקבל לקוח יש לו מחיר מיוחד ואם זה משתמש חיצוני המחיר שלו הוא רגיל
  let chargeableHours: number ;
let totalCharge: number ;

if (updatedData.externalUserName) {
  const result = await this.calculateExtrenalCharges(updatedData.totalHours);
  if (result) {
    chargeableHours = result.chargeableHours;
    totalCharge = result.totalCharge;
  }
} else if (updatedData.customerId) {
  const result = await this.calculateCustomerCharges(updatedData.customerId, updatedData.totalHours);
  if (result) {
    chargeableHours = result.chargeableHours;
    totalCharge = result.totalCharge;
  }
}
    const formattedData = updatedData.toDatabaseFormat();
    console.log(":rocket: Trying to update booking with ID:", id);
    console.log(":memo: Data being sent:", formattedData);
    const { data, error } = await supabase
      .from('booking')
      .update([formattedData])
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error(':fire: Supabase update error:', error);
      return null;
    }
    if (!data) {
      console.warn(':warning: No data returned. ID might not exist.');
      return null;
    }
    console.log(":white_check_mark: Successfully updated booking:", data);
    return BookingModel.fromDatabaseFormat(data);

  }
  //מחיקת פגישה
  async deleteBooking(id: string) {
    const { error } = await supabase
      .from('booking')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting booking:', error);
      return false;
    }

    // logUserActivity(id, 'User deleted');
    // מחזיר true אם הפיצ'ר נמחק בהצלחה
    return true;
  }

  //קבלת  פגישה לפי ID
  static async getBookingById(id?: string | null) {
    const { data, error } = await supabase
      .from('booking')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching booking:', error);
      return null;
    }

    const booking = BookingModel.fromDatabaseFormat(data); // המרה לסוג UserModel
    // רישום פעילות המשתמש
    // logUserActivity(feature.id? feature.id:feature.description, 'User fetched by ID');
    // מחזיר את המשתמש שנמצא
    return booking;
  }
  //googleeventIdקבלת  פגישה לפי ID
  static async getBookingByEventId(googleEventId: string) {
    const { data, error } = await supabase
      .from('booking')
      .select('*')
      .eq('google_calendar_event_id', googleEventId)
      .single();

    if (error) {
      console.error('Error fetching booking:', error);
      return null;
    }

    const booking = BookingModel.fromDatabaseFormat(data); // המרה לסוג UserModel
    // רישום פעילות המשתמש
    // logUserActivity(feature.id? feature.id:feature.description, 'User fetched by ID');
    // מחזיר את המשתמש שנמצא
    return booking;
  } 
  //אישור הזמנה 
  async bookingApproval(id: string): Promise<BookingModel | null> {

    const { data, error } = await supabase
      .from('booking')
      .update({ 'approved_by': "", 'status': "APPROVED", 'approved_at': new Date() })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Error updating booking:', error);
      return null;
    }
//  const sendCustomerEmail = async () => {
 
//     const emailService = new EmailTemplateService()
//       const template =
//         await emailService.getTemplateByName("");
//       if (!template) {
//         console.warn("Customer email template not found");
//         return;
//       }
      //const renderedHtml = await emailService.renderTemplate(
        //template.bodyHtml,
//         {
//           שם:data.customerId,
//            שם חדר ישיבות:data.roo,
//             שעת התחלה,
//  שעת סיום
        
//         }
    //  );
    //  console.log("HTML before sending:\n", renderedHtml);
      // return sendEmail(
      //   "me",
      //   {
      //     to: [customer.email ?? ""],
      //     subject:  encodeSubject(template.subject),
      //     body: renderedHtml,
      //     isHtml: true,
      //   },
      //   token
      // );
    
  
  
    const booking = BookingModel.fromDatabaseFormat(data);
    return booking;
  }
  
}