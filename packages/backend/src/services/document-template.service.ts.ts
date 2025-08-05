import { createClient } from "@supabase/supabase-js";
import { DocumentTemplateModel } from '../models/document-template.model';
import { ID,DocumentType } from 'shared-types';

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("חסרים ערכים ל־SUPABASE_URL או SUPABASE_SERVICE_KEY בקובץ הסביבה");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export interface CreateDocumentTemplateRequest {
  name: string;
  type: DocumentType;
  language: 'hebrew' | 'english';
  template: string;
  variables: string[];
  isDefault?: boolean;
  active?: boolean;
}

export interface UpdateDocumentTemplateRequest {
  name?: string;
  template?: string;
  variables?: string[];
  isDefault?: boolean;
  active?: boolean;
}

export class DocumentService {
  
  // יצירת תבנית מסמך חדשה
  async createDocumentTemplate(newDocuments: DocumentTemplateModel): Promise<DocumentTemplateModel> {
    try {
      if (!newDocuments.template) {
        throw new Error('תוכן התבנית הוא שדה חובה');
      }

      if (newDocuments.isDefault) {
        await this.unsetDefaultTemplates(newDocuments.type);
      }

      const now = new Date().toISOString();
      
      const templateToInsert = {
        name: newDocuments.name,
        type: newDocuments.type ?? "RECEIPT",
        language: newDocuments.language ?? 'english',
        template: newDocuments.template ?? "",
        variables: newDocuments.variables ?? [],
        is_default: newDocuments.isDefault ?? false,
        active: newDocuments.active ?? true,
        created_at: now,
        updated_at: now
      };

      const { data, error } = await supabase
        .from('document_template')
        .insert([templateToInsert])
        .select()
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return this.mapTemplateFromDatabase(data);
    } catch (error) {
      throw new Error(`שגיאה ביצירת תבנית מסמך: ${error}`);
    }
  }

  // שליפת תבנית לפי מזהה
  async getTemplateById(id: ID): Promise<DocumentTemplateModel> {
    try {
      const { data, error } = await supabase
        .from('document_template')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('תבנית המסמך לא נמצאה');
        }
        throw new Error(`Database error: ${error.message}`);
      }

      return this.mapTemplateFromDatabase(data);
    } catch (error) {
      throw new Error(`שגיאה בשליפת תבנית מסמך: ${error}`);
    }
  }

  // שליפת כל התבניות
  async getAllTemplates(): Promise<DocumentTemplateModel[]> {
    try {
      const { data, error } = await supabase
        .from('document_template')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return (data || []).map(item => this.mapTemplateFromDatabase(item));
    } catch (error) {
      throw new Error(`שגיאה בשליפת תבניות מסמכים: ${error}`);
    }
  }

  // שליפת תבניות לפי סוג
  async getTemplatesByType(type: DocumentType): Promise<DocumentTemplateModel[]> {
    try {
      const { data, error } = await supabase
        .from('document_template')
        .select('*')
        .eq('type', type)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return (data || []).map(item => this.mapTemplateFromDatabase(item));
    } catch (error) {
      throw new Error(`שגיאה בשליפת תבניות לפי סוג: ${error}`);
    }
  }

  // שליפת תבניות פעילות בלבד
  async getActiveTemplates(): Promise<DocumentTemplateModel[]> {
    try {
      const { data, error } = await supabase
        .from('document_template')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return (data || []).map(item => this.mapTemplateFromDatabase(item));
    } catch (error) {
      throw new Error(`שגיאה בשליפת תבניות פעילות: ${error}`);
    }
  }

  // עדכון תבנית - static method לתאימות לאחור
  static async updateTemplate(id: string, data: UpdateDocumentTemplateRequest): Promise<DocumentTemplateModel> {
    const service = new DocumentService();
    return await service.updateTemplateById(id as ID, data);
  }

  // עדכון תבנית
  async updateTemplateById(id: ID, data: UpdateDocumentTemplateRequest): Promise<DocumentTemplateModel> {
    try {
      if (data.isDefault) {
        const currentTemplate = await this.getTemplateById(id);
        await this.unsetDefaultTemplates(currentTemplate.type);
      }

      const updated_at = new Date().toISOString();
      
      const updateData: any = { ...data, updated_at };
      if (data.isDefault !== undefined) {
        updateData.is_default = data.isDefault;
        delete updateData.isDefault;
      }

      const { data: updatedData, error } = await supabase
        .from('document_template')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('תבנית המסמך לא נמצאה לעדכון');
        }
        throw new Error(`Database error: ${error.message}`);
      }

      return this.mapTemplateFromDatabase(updatedData);
    } catch (error) {
      throw new Error(`שגיאה בעדכון תבנית מסמך: ${error}`);
    }
  }

  // מחיקת תבנית
  async deleteTemplate(id: ID): Promise<void> {
    try {
      const { error } = await supabase
        .from('document_template')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`שגיאה במחיקת תבנית מסמך: ${error}`);
    }
  }

  // שליפת תבנית ברירת מחדל לפי סוג
  async getDefaultTemplate(type: DocumentType): Promise<DocumentTemplateModel | null> {
    try {
      const templates = await this.getTemplatesByType(type);
      return templates.find(template => template.isDefault && template.active) || null;
    } catch (error) {
      throw new Error(`שגיאה בשליפת תבנית ברירת מחדל: ${error}`);
    }
  }

  // הפעלה/השבתה של תבנית
  async toggleTemplateStatus(id: ID): Promise<DocumentTemplateModel> {
    try {
      const template = await this.getTemplateById(id);
      if (!template) {
        throw new Error('תבנית המסמך לא נמצאה');
      }

      const updatedTemplate = await this.updateTemplateById(id, { active: !template.active });
      return updatedTemplate;
    } catch (error) {
      throw new Error(`שגיאה בשינוי סטטוס תבנית: ${error}`);
    }
  }

  // ==================== HELPER METHODS ====================

  private async unsetDefaultTemplates(type: DocumentType): Promise<void> {
    try {
      const templates = await this.getTemplatesByType(type);
      for (const template of templates) {
        if (template.isDefault) {
          await this.updateTemplateById(template.id!, { isDefault: false });
        }
      }
    } catch (error) {
      throw new Error(`שגיאה בביטול ברירות מחדל: ${error}`);
    }
  }

  private mapTemplateFromDatabase(data: any): DocumentTemplateModel {
    return {
      name: data.name,
      id: data.id,
      type: data.type,
      language: data.language,
      template: data.template,
      variables: data.variables,
      isDefault: data.is_default,
      active: data.active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    } as DocumentTemplateModel;
  }
}

// ==================== BACKWARD COMPATIBILITY FUNCTIONS ====================

export const getAllDocumentTemplates = async (): Promise<DocumentTemplateModel[]> => {
  const service = new DocumentService();
  return await service.getAllTemplates();
};

export const getActiveDocumentTemplates = async (): Promise<DocumentTemplateModel[]> => {
  const service = new DocumentService();
  return await service.getActiveTemplates();
};

export const createDocumentTemplate = async (templateData: DocumentTemplateModel): Promise<DocumentTemplateModel> => {
  const service = new DocumentService();
  return await service.createDocumentTemplate(templateData);
};

export const getDocumentTemplateById = async (id: string): Promise<DocumentTemplateModel | null> => {
  const service = new DocumentService();
  try {
    return await service.getTemplateById(id as ID);
  } catch (error) {
    return null;
  }
};

export const getDocumentTemplatesByType = async (type: DocumentType): Promise<DocumentTemplateModel[]> => {
  const service = new DocumentService();
  return await service.getTemplatesByType(type);
};
