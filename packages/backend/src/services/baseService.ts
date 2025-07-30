import type { ID } from "shared-types";
import { supabase } from "../db/supabaseClient";
import { sendEmailToConfrim } from "./gmail-service";
import { ca } from "date-fns/locale";

export class baseService<T> {
  // בשביל שם המחלקה
  constructor(private tableName: string) { }

  getById = async (id: ID): Promise<T> => {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .single();

    if (!data) {
      throw new Error(`לא נמצא רשומה עם מזהה ${id}`);
    }

    if (error) {
      console.error("שגיאה בשליפת נתונים:", error);
      throw error;
    }

    return data;
  };

  getAll = async (): Promise<T[]> => {
    console.log("🧾 טבלה:", this.tableName);

    let query = supabase.from(this.tableName).select("*");

    // אם זה טבלת customer, נוסיף מיון לפי created_at
    if (this.tableName === 'customer') {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    // console.log(data);

    if (!data || data.length === 0) {
      console.log(` אין נתונים בטבלה ${this.tableName}`);
      return []; // תחזירי מערך ריק במקום לזרוק שגיאה
    }

    if (error) {
      console.error("שגיאה בשליפת נתונים:", error);
      throw error;
    }

    return data;
  };

  patch = async (dataToUpdate: Partial<T>, id: ID): Promise<T> => {
    let dataForInsert = dataToUpdate;
    (dataToUpdate as any).updated_at = new Date().toISOString();

    if (typeof (dataToUpdate as any).toDatabaseFormat === "function") {
      try {
        dataForInsert = (dataToUpdate as any).toDatabaseFormat();
        console.log(dataForInsert);
      } catch (error) {
        console.error("שגיאה בהמרה", error);
      }
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .update(dataForInsert)
      .eq("id", id)
      .select();

    if (error) {
      console.error("שגיאה בעדכון הנתונים:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error("לא התקבלה תשובה מהשרת אחרי העדכון");
    }

    return data[0];
  };

  post = async (dataToAdd: T): Promise<T> => {
    console.log("come to function");

    let dataForInsert = dataToAdd;
    console.log("tableName:", this.tableName);

    if (typeof (dataToAdd as any).toDatabaseFormat === "function") {
      dataForInsert = (dataToAdd as any).toDatabaseFormat();
      console.log(dataForInsert);
    }

    // אם זה הוספת לקוח לא מוסיפים לו מייל עד שמאמתים את הלקוח והמייל נוסף רק בצורת עדכון אחרי שהשלקוח נוצר
    let emailToSave: string | undefined;

    if (this.tableName === "customer") {
      const { email, ...rest } = dataForInsert as any;
      emailToSave = email; // שומרת את המייל במשתנה
      dataForInsert = rest; // dataForInsert בלי המייל
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .insert([dataForInsert])
      .select();

    console.log("added");
    console.log(data);


    if (error) {
      console.log("enter to log", error);

      console.error("שגיאה בהוספת הנתונים:", error);
      throw error;
    }

    const createdRecord = data?.[0];

    if (this.tableName === "customer") {
      try {
        await sendEmailToConfrim(emailToSave, createdRecord.id);
        console.log("📧 after send email Confirmation email sent to:", emailToSave);

      }
      catch (error) {
        console.error("שגיאה בשליחת מייל אימות:", error);
      }
    }


    if (!data) throw new Error("לא התקבלה תשובה מהשרת אחרי ההוספה");
    console.log(data);

    return data[0]; // מחזיר את מה שנוצר
  };

  delete = async (id: ID): Promise<void> => {
    const { data, error } = await supabase
      .from(this.tableName)
      .delete()
      .eq("id", id);

    if (error) {
      console.error("שגיאה במחיקת הנתונים:", error);
      throw error;
    }
  };
}
