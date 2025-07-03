import type { ID } from "shared-types";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_KEY || ""; // שימי לב לשם המדויק

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "חסרים ערכים ל־SUPABASE_URL או SUPABASE_SERVICE_KEY בקובץ הסביבה"
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

  getByFilters = async (filters: { q?: string; page?: number; limit?: number; }): Promise<T[]> => {
    const { q, page, limit } = filters;

    let query = supabase.from(this.tableName).select("*");

    if (q) {
      const searchValue = `%${q}%`;
      query = query.or(
        `name.ilike.${searchValue},email.ilike.${searchValue},phone.ilike.${searchValue},id_number.ilike.${searchValue}`
      );
    }
    if (page && limit) {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching filtered data:", error);
      throw error;
    }

    return data ?? [];
  };

  getAll = async (): Promise<T[]> => {
    console.log("🧾 טבלה:", this.tableName);

    const { data, error } = await supabase
    .from(this.tableName)
    .select("*, lead_interaction(*)")

    console.log(data);
    
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
    if (typeof (dataToUpdate as any).toDatabaseFormat === "function") {
      try {
        dataForInsert = (dataToUpdate as any).toDatabaseFormat();
        console.log(dataForInsert);

      } catch (error) {
        console.error("שגיאה בהמרה", error)
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

    if (!data || data.length === 0)
      throw new Error("לא התקבלה תשובה מהשרת אחרי העדכון");

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
