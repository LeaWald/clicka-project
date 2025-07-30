import { baseService } from "./baseService";
import { LeadModel } from "../models/lead.model";
import Papa, { parse } from "papaparse";
import { CreateLeadRequest, ID, LeadSource, LeadStatus, UpdateLeadRequest } from "shared-types";
import { supabase } from "../db/supabaseClient";
import * as XLSX from 'xlsx';


export class leadService extends baseService<LeadModel> {
  constructor() {
    super("leads");
  }

  getAllLeads = async (): Promise<LeadModel[] | null> => {


    const { data, error } = await supabase
    .from("leads")
    .select("*, lead_interaction(*)");

    // console.log(data);

    if (!data || data.length === 0) {
      console.log(` אין נתונים בטבלה leads`);
      return []; // תחזירי מערך ריק במקום לזרוק שגיאה
    }

    if (error) {
      console.error("שגיאה בשליפת נתונים:", error);
      throw error;
    }

    return LeadModel.fromDatabaseFormatArray(data); // המרה לסוג UserModel
  };

  getSourcesLeadById = async (id: string): Promise<LeadSource[]> => {
    const { data, error } = await supabase
      .from("leads")
      .select("source")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching sources for lead by ID:", error);
      throw new Error("Failed to fetch sources for lead by ID");
    }
    if (!data) {
      console.warn(`No lead found with ID: ${id}`);
      return [];
    }
    return [data.source] as LeadSource[]; // הנחה שהשדה נקרא 'source'
  };

  addLeadFromCSV = async (csvData: string): Promise<void> => {
    // const parsedData = parse(csvData, { header: true }).data as UpdateLeadRequestModel[];
    const parsedData = parse(csvData, { header: true })
      .data as UpdateLeadRequest[];
    for (const lead of parsedData) {
      const isFullLead = this.checkIfFullLead(lead);

      if (!isFullLead) {
        console.warn("Incomplete lead data:", lead);
        continue; // דלג על ליד לא מלא
      }
      const { error } = await supabase.from("leads").insert(lead);
      if (error) {
        console.error("Error adding lead:", error);
        throw new Error("Failed to add lead");
      }
    }
  };

  checkIfFullLead(lead: UpdateLeadRequest): boolean {
    return !!(
      lead &&
      lead.name &&
      lead.email &&
      lead.businessType &&
      lead.phone &&
      lead.interestedIn
    );
  }

  convertCsvToLeads = (csvData: string): Promise<LeadModel[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse<LeadModel>(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data);
        },
        error: (err: any) => {
          reject(err);
        },
      });
    });
  };

  getOpenReminders = async (): Promise<LeadModel[]> => {
    // אמור לשלוף לידים עם תזכורות פתוחות
    // להחזיר מערך של לידים עם תזכורות פתוחות
    return [];
  };

  checkIfLeadBecomesCustomer = async (leadId: ID): Promise<boolean> => {
    const lead = await this.getById(leadId);

    if (lead.status === "CONVERTED") return true;
    return false;
  };

  getLeadsByPage = async (filters: {
    page?: number;
    limit?: number;
  }): Promise<LeadModel[]> => {
    console.log("Service getLeadsByPage called with:", filters);

    const { page, limit } = filters;

    const pageNum = Number(filters.page);
    const limitNum = Number(filters.limit);

    if (!Number.isInteger(pageNum) || !Number.isInteger(limitNum)) {
      throw new Error("Invalid filters provided for pagination");
    }

    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("name", { ascending: false })
      .range(from, to);

    // console.log("Supabase data:", data);
    console.log("Supabase error:", error);

    if (error) {
      console.error("❌ Supabase error:", error.message || error);
      return Promise.reject(
        new Error(`Supabase error: ${error.message || JSON.stringify(error)}`)
      );
    }

    const leads = data || [];
    return LeadModel.fromDatabaseFormatArray(leads);
  };

  addInteraction = async (
    leadId: string,
    interaction: {
      type: string;
      date: string;
      notes: string;
      userEmail: string;
    }
  ) => {
    console.log(leadId, interaction);

    const { data, error } = await supabase.from("lead_interaction").insert([
      {
        lead_id: leadId,
        type: interaction.type.toUpperCase(),
        date: interaction.date,
        notes: interaction.notes,
        user_email: interaction.userEmail,
        user_id: leadId,
      },
    ]);
    if (data) return data;
    if (error) console.log(error);
  };

  createLead = async (newLead: CreateLeadRequest): Promise<LeadModel> => {
    // יצירת אובייקט LeadModel
    const leadData: LeadModel = {
      idNumber: "UNKNOWN",
      name: newLead.name,
      phone: newLead.phone,
      email: newLead.email,
      businessType: newLead.businessType,
      interestedIn: newLead.interestedIn,
      source: newLead.source,
      status: LeadStatus.NEW, // או כל סטטוס רלוונטי אחר
      contactDate: new Date().toISOString(),
      followUpDate: newLead.followUpDate,
      notes: newLead.notes || "",
      interactions: [], // אם יש אינטראקציות, תוכל להעביר אותן כאן
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      toDatabaseFormat() {
        return {
          id_number: this.idNumber,
          name: this.name,
          phone: this.phone,
          email: this.email,
          business_type: this.businessType,
          interested_in: this.interestedIn,
          source: this.source,
          status: this.status,
          contact_date: this.contactDate,
          follow_up_date: this.followUpDate,
          notes: this.notes,
          created_at: this.createdAt,
          updated_at: this.updatedAt,
        };
      },
    };
    // הוספת הליד למסד הנתונים
    const savedLead = await this.post(leadData);
    return savedLead;
  };

  deleteInteraction = async (
    leadId: string,
    interactionId: string
  ): Promise<void> => {
    try {
      // שליחה של בקשה למחוק אינטראקציה מתוך המערך
      const { data, error } = await supabase
        .from("lead_interaction")
        .delete()
        .eq("id", interactionId)
        .eq("lead_id", leadId);

      if (error) {
        console.log(error + "--------------------------");
      }
      // console.log(data); // יוכל להדפיס את התוצאה של העדכון
    } catch (error) {
      console.error("Error deleting interaction:", error);
      throw new Error("Failed to delete interaction");
    }
  };

  getLeadsByText = async (text: string): Promise<LeadModel[]> => {
    const searchFields = ["name", "status", "phone", "email", "city"]; // כל השדות שאת רוצה לבדוק בהם

    const filters = searchFields
      .map((field) => `${field}.ilike.%${text}%`)
      .join(",");

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .or(filters);

    if (error) {
      console.error("שגיאה:", error);
      return [];
    }

    return data as LeadModel[];
  };
  importLeadsFromExcelBuffer = async (buffer: Buffer): Promise<void> => {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
    const [headerRow, ...dataRows] = rawData;
    const headers = [
      'שם', 'טלפון', 'מייל', 'תחום העסק', 'מה מעניין את הלקוח',
      'איך ליצור קשר', 'תאריך ליד', 'תאריך שיחת מכירה', 'סטטוס', 'אופן פניה', 'הערות'
    ];
    // מפות כפי שהגדרת
    const leadStatusMap: Record<string, string> = { /* כפי שהגדרת */ };
    const leadSourceMap: Record<string, string> = { /* כפי שהגדרת */ };
    const interestedInMap: Record<string, string> = { /* כפי שהגדרת */ };
    // פונקציות עזר (formatDate ו-normalizePhone)
    function formatDate(value: any): string | null {
      if (!value) return null;
      if (typeof value === 'number') {
        const excelStartDate = new Date(1900, 0, 1);
        const parsed = new Date(excelStartDate.getTime() + (value - 2) * 86400000);
        return parsed.toISOString().split('T')[0];
      }
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0];
    }
    function normalizePhone(value: any): string {
      let phoneStr = String(value ?? '').replace(/\D/g, '');
      if (!phoneStr.startsWith('0')) {
        phoneStr = '0' + phoneStr;
      }
      return phoneStr;
    }
    for (const row of dataRows) {
      if (row[0] === 'שם') continue;
      const rowObj: Record<string, any> = {};
      headers.forEach((key, i) => {
        rowObj[key] = row[i];
      });
      const isEmptyRow = Object.values(rowObj).every(val => val === undefined || val === null || String(val).trim() === '');
      if (isEmptyRow) continue;
      if (!rowObj['שם'] || !rowObj['מייל'] || !rowObj['טלפון']) continue;
      const status = leadStatusMap[(rowObj['סטטוס'] || '').toUpperCase()] || 'NEW';
      const source = leadSourceMap[(rowObj['אופן פניה'] || '').toUpperCase()] || 'OTHER';
      const interestedInRaw = (rowObj['מה מעניין את הלקוח'] || '').toUpperCase();
      const interestedIn = interestedInMap[interestedInRaw] || 'OPEN_SPACE';
      const lead = {
        name: rowObj['שם'],
        phone: normalizePhone(rowObj['טלפון']),
        email: rowObj['מייל'],
        business_type: rowObj['תחום העסק'] || null,
        interested_in: interestedIn,
        status,
        source,
        notes: rowObj['הערות'] || null,
        id_number: rowObj['ת.ז.'] || 'UNKNOWN',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { error: insertError } = await supabase.from('leads').insert(lead);
      if (insertError) {
        console.error('Error inserting lead:', insertError.message);
        continue;
      }
      console.log('Lead inserted:', lead.name);
      const { data: insertedLead } = await supabase.from('leads').select('id').eq('email', lead.email).single();
      if (!insertedLead) continue;
      const leadId = insertedLead.id;
      const entryDate = formatDate(rowObj['תאריך ליד']);
      const contactDate = formatDate(rowObj['תאריך שיחת מכירה']);
      const exitDate = formatDate(rowObj['תאריך יציאה']) || '1900-01-01';
      if (entryDate && contactDate) {
        const { error: periodError } = await supabase.from('lead_period').insert({
          lead_id: leadId,
          entry_date: entryDate,
          contact_date: contactDate,
          exit_date: exitDate,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        if (periodError) console.error('Error inserting lead period:', periodError.message);
      }
      const interactionDate = formatDate(rowObj['תאריך ליד']);
      if (!interactionDate) {
        console.error('Missing interaction date');
        continue;
      }
      const { error: interactionError } = await supabase.from('lead_interaction').insert({
        lead_id: leadId,
        date: interactionDate,
        notes: rowObj['הערות'] || '',
        type: rowObj['איך ליצור קשר'] || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (interactionError) {
        console.error('Error inserting lead interaction:', interactionError.message);
      }
    }
  }
}
