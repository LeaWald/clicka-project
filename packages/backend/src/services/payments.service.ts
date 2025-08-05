import type{ ID,Payment } from "shared-types";
import { baseService } from "./baseService";
import { PaymentModel } from "../models/payments.model";
import { supabase } from "../db/supabaseClient";
import { EmailTemplateService } from "./emailTemplate.service";
import { sendEmail } from "./gmail-service";

export class PaymentService extends baseService<PaymentModel> {

  constructor() {
    super("payment");
  }
  
  // static getCustomerBalance(customerId: string) {
  //   throw new Error('Method not implemented.');
  // }
  // static recordPayment(body: any, id: any) {
  //   throw new Error('Method not implemented.');
  // }
  getPaymentsByText = async (text: string): Promise<PaymentModel[]> => {
  const searchFields = ["customerName", "customerId", "amount"]; // כל השדות שאת רוצה לבדוק בהם

  const filters = searchFields
    .map((field) => `${field}.ilike.%${text}%`)
    .join(",");

  const { data, error } = await supabase
    .from("payment")
    .select("*")
    .or(filters);

  if (error) {
    console.error("שגיאה:", error);
    return [];
  }

  return data as PaymentModel[];
};
async getPaymentByDateAndCIds(params: {
  dateFrom: string;
  dateTo: string;
  customerIds?: ID[]; // תמיכה בריבוי לקוחות
}): Promise<Payment[]> {
  try {
    let query = supabase.from('payment').select('*');

    if (params.customerIds?.length) {
      query = query.in('customer_id', params.customerIds); // ✅ סינון לפי כמה לקוחות
    }
    if (params.dateFrom) {
      query = query.gte('date', params.dateFrom);
    }
    if (params.dateTo) {
      query = query.lte('date', params.dateTo);
    }

    query = query.order('date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching payments:', error);
      return [];
    }

    return data as Payment[];
  } catch (err) {
    console.error('Unexpected error fetching payments:', err);
    return [];
  }
}
  getPaymentByPage = async (filters: {
        page?: string ;
        limit?: number;
      }): Promise<PaymentModel[]> => {
        console.log("Fetching payments with filters:", filters);
        const { page, limit } = filters;
    
        const pageNum = Number(filters.page);
        const limitNum = Number(filters.limit);
    
        if (!Number.isInteger(pageNum) || !Number.isInteger(limitNum)) {
          throw new Error("Invalid filters provided for pagination");
        }
    
        const from = (pageNum - 1) * limitNum;
        const to = from + limitNum - 1;
    
        const { data, error } = await supabase
          .from("payment")
          .select("*")
          .order("created_at", { ascending: false })
          .range(from, to);
    
        console.log("Supabase data:", data);
        console.log("Supabase error:", error);
    
        if (error) {
          console.error("❌ Supabase error:", error.message || error);
          return Promise.reject(
            new Error(`Supabase error: ${error.message || JSON.stringify(error)}`)
          );
        }
    
          const customers = data || [];
          PaymentModel
        return PaymentModel.fromDatabaseFormatArray(customers)
      };


    async getPaymentByDate(params: { dateFrom: string; dateTo: string; customerId?: ID }): Promise<Payment[]> {
    try {
      let query = supabase.from('payment').select('*');

      if (params.customerId) {
        query = query.eq('customer_id', params.customerId);
      }
      if (params.dateFrom) {
        query = query.gte('date', params.dateFrom);
      }
      if (params.dateTo) {
        query = query.lte('date', params.dateTo);
      }

      // מיון מהחדש לישן לפי תאריך
      query = query.order('date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching payments:', error);
        return [];
      }

      return data as Payment[];
    } catch (err) {
      console.error('Unexpected error fetching payments:', err);
      return [];
    }
  }
   /**
   * שליפת תשלומים לפי טווח תאריכים
   * @param params - אובייקט עם תאריך התחלה ותאריך סיום
   * @returns רשימת תשלומים
   */

  //שליחת מייל תזכורת

  sendPaymentReminderEmail = async (
    customerName: string,
    amount: number,
    invoiceNumber: string,
    dueDate: string,
    token: any,
  ): Promise<void> => {

    try {
      // טוענים את תבנית המייל בשם "תזכורת תשלום"
      const template = await emailService.getTemplateByName("תזכורת לתשלום על חשבונית");
      if (!template) {
        console.warn("Email template 'תזכורת תשלום' not found");
        return;
      }

      // ממלאים את התבנית עם הנתונים הדינמיים
      const renderedHtml = await emailService.renderTemplate(template.bodyHtml, {
        customerName,
        amount: amount.toString(),
        invoiceNumber,
        dueDate,
      });

      // שולחים את המייל
      const response = await sendEmail(
        "me",
        {
          to: ["ettylax@gmail.com"],
          subject: encodeSubject(template.subject),
          body: renderedHtml,
          isHtml: true,
        },
        token,
      );

      console.log("Payment reminder email sent successfully:", response);
    } catch (err) {
      console.error("Error sending payment reminder email:", err);
    }
  };
}
const emailService = new EmailTemplateService();

export const sendPaymentProblemEmailInternal = async (
  customerName: string,
  invoiceNumber: string,
  amount: number,
  paymentStatus: string,
  invoiceUrl: string,
  customerEmail: string,
  token: any
): Promise<void> => {
  const template = await emailService.getTemplateByName("בעיית תשלום");

  if (!template) {
    throw new Error("Template 'בעיית תשלום' not found.");
  }

  const renderedHtml = await emailService.renderTemplate(template.bodyHtml, {
    customerName,
    invoiceNumber,
    amount: amount.toFixed(2),
    paymentStatus,
    invoiceUrl,
  });

  await sendEmail(
    "me",
    {
      to: ["ettylax@gmail.com"],
      subject: encodeSubject(template.subject),
      body: renderedHtml,
      isHtml: true,
    },
    token
  );
};

function encodeSubject(subject: string): string {
  return `=?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`;
}
    
    
//   getCustomerBalance(customerId: ID)/*: CustomerBalance*/ {
//     // שליפת כל החשבוניות של הלקוח שלא שולמו במלואן
//     // חישוב סך כל החשבוניות שעדיין פתוחות
//     // חישוב סך הסכומים שעדיין לא שולמו
//     // שליפת היסטוריית תשלומים של הלקוח
//     // חישוב היתרה הנוכחית של הלקוח (לדוגמה: סך החיובים פחות סך התשלומים)
//     // שליפת תאריך התשלום האחרון במידה ויש
//   }

//   getOverdueInvoices()/*: OverdueInvoiceSummary[] */{
//     // שליפת כל החשבוניות מהמערכת (DB / API)
//     // שליפת כל הלקוחות מהמערכת
//     // שליפת כל התשלומים מהמערכת
//     // סינון חשבוניות שלא שולמו או שולמו חלקית בלבד
//     // סינון חשבוניות שמועד הפירעון שלהן עבר (כלומר היום כבר אחרי due_date)
//     // בניית מערך סיכום לכל חשבונית באיחור
//     // איתור הלקוח לפי מזהה הלקוח בחשבונית
//     // שליפת כל התשלומים של הלקוח ומיון מהתאריך האחרון לישן יותר
//   }

//   matchPaymentsToInvoices(customerId: ID, currentPayment: Payment): void {
//     // שליפת כל החשבוניות של הלקוח
//     // סינון חשבוניות שלא שולמו במלואן
//     // לולאה על כל תשלום פתוח עד שנגמר סכום התשלום
//     // עדכון של החשבוניות בהתאם לסכום שנכנס
//     // אם התשלום הושלם, להכניס את היתרה ליתרה בחשבון של המשתמש
//   }

//   matchPaymentsToInvoice(customerId: ID, currentPayment: Payment, invoice: Invoice): void {
//     // שליפת כל החשבוניות של הלקוח
//     // סינון חשבוניות שלא שולמו במלואן
//     // לולאה על כל תשלום פתוח עד שנגמר סכום התשלום
//     // עדכון של החשבוניות בהתאם לסכום שנכנס
//     // אם התשלום הושלם, להכניס את היתרה ליתרה בחשבון של המשתמש
//   }

//   getPaymentHistory(customerId: ID)/*: Payment[]*/ {
//     // שליפת כל התשלומים מהמסד (פונקציה כללית שמחזירה את כולם)
//     // סינון לפי מזהה הלקוח
//     // מיון תשלומים מהחדש לישן לפי תאריך תשלום
//   }

//   //לרחל
//   /**
//    * תיעוד תשלום חדש ללקוח ועדכון מצב החשבוניות והיתרה
//    * @param customerId מזהה הלקוח
//    * @param paymentData פרטי התשלום (סכום, תאריך, אמצעי תשלום וכו')
//    * @param recordedBy מי תיעד את התשלום (משתמש/מערכת)
//    * @returns אובייקט תשלום חדש לאחר עדכון החשבוניות והיתרה
//    */
//   recordAndApplyPayment(
//     customerId: ID,
//     // paymentData: PaymentRecordRequest,
//     recordedBy: ID
//   )/*: Payment*/ {
//     // כאן יבוא המימוש בפועל
//   }

//   /**
//    * מחזירה דוח גבייה כללי לכל הלקוחות (סיכום מצב גבייה).
//    * @returns Promise<CollectionSummary>
//    */
//   async getCollectionSummaryReport()/*: Promise<CollectionSummary>*/ {

//   }

//   /**
//    * מחזירה דוח גבייה מפורט ללקוח מסוים.
//    * @param customerId מזהה הלקוח
//    * @returns Promise<CustomerCollectionReport>
//    */
//   async getCustomerCollectionReport(customerId: ID)/*: Promise<CustomerCollectionReport>*/ {
  
//   }
  
// }