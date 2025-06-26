import type { ID } from "shared-types";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY|| ''; // שימי לב לשם המדויק


if (!supabaseUrl || !supabaseKey) {
  console.error("חסרים ערכים ל־SUPABASE_URL או SUPABASE_SERVICE_KEY בקובץ הסביבה");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export class baseService<T> {
  // בשביל שם המחלקה
  constructor(private tableName: string) {}

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

  getByFilters = async (filters: Partial<T>): Promise<T[]> => {
    const orConditions = Object.entries(filters).map(([key, value]) => {
      if (typeof value === "string") {
        return `${key}.ilike.%${value}%`;
      } else {
        return `${key}.eq.${value}`;
      }
    });

    let query = supabase
      .from(this.tableName)
      .select("*")
      .or(orConditions.join(","));

    const { data, error } = await query;

    if (error) {
      console.error("שגיאה בשליפת נתונים עם פילטרים:", error);
      throw error;
    }

    return data ?? [];
  };

  getAll = async (): Promise<T[]> => {
    console.log("🧾 טבלה:", this.tableName);

    const { data, error } = await supabase.from(this.tableName).select("*");

    if (!data || data.length === 0) {
      console.log(`🔍 אין נתונים בטבלה ${this.tableName}`);
      return []; // תחזירי מערך ריק במקום לזרוק שגיאה
    }

    if (error) {
      console.error("שגיאה בשליפת נתונים:", error);
      throw error;
    }

    return data;
  };

  patch = async (dataToUpdate: Partial<T>, id: ID): Promise<T> => {
    const { data, error } = await supabase
      .from(this.tableName)
      .update(dataToUpdate)
      .eq("id", id)
      .select();

    if (error) {
      console.error("שגיאה בעדכון הנתונים:", error);
      throw error;
    }

    if (!data || data.length === 0)
      throw new Error("לא התקבלה תשובה מהשרת אחרי העדכון");

    return data[0];
  };

  post = async (dataToAdd: T): Promise<T> => {
    console.log("come to function");

    let dataForInsert = dataToAdd;
    console.log("tableName:", this.tableName);

    // אם יש פונקציה toDatabaseFormat - נשתמש בה כדי להמיר את האובייקט
    // if (typeof (dataToAdd as any).toDatabaseFormat === "function") {
    //   dataForInsert = (dataToAdd as any).toDatabaseFormat();
    // }

    const { data, error } = await supabase
      .from(this.tableName)
      //   .insert([dataForInsert])
      .select();

    console.log("added");
    console.log(data);

    if (error) {
      console.log("enter to log", error);

      console.error("שגיאה בהוספת הנתונים:", error);
      throw error;
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
