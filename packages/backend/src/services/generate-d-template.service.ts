import { createClient } from "@supabase/supabase-js";
import { GeneratedDocument } from 'shared-types';
import { DocumentService } from './document-template.service.ts';
import { ID, DateISO ,FileReference} from 'shared-types';
import puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { file } from "googleapis/build/src/apis/file";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("חסרים ערכים ל־SUPABASE_URL או SUPABASE_SERVICE_KEY בקובץ הסביבה");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export interface GeneratedDocumentFilter {
  entityId?: ID;
  type?: string;
  templateId?: ID;
  deliveredAt?: DateISO;
}

export class GeneratedDocumentService {
  private documentService: DocumentService;

  constructor() {
    this.documentService = new DocumentService();
  }

  // ==================== PDF GENERATION METHODS ====================

  // יצירת PDF מ-HTML
  async generatePdfFromHtml(html: string, fileName?: string, outputDir: string = 'generated_pdfs'): Promise<string> {
    try {
      const finalFileName = fileName || `document_${uuidv4()}`;
      const outputPath = path.resolve(outputDir, `${finalFileName}.pdf`);
      
      // יצירת תיקייה אם לא קיימת
      await fs.mkdir(outputDir, { recursive: true });

      const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      
      // הגדרת תמיכה בעברית
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // יצירת PDF
      const pdfBuffer = await page.pdf({ 
        format: 'A4', 
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });

      await browser.close();
      
      // שמירת הקובץ
      await fs.writeFile(outputPath, pdfBuffer);
      
      return outputPath;
    } catch (error) {
      throw new Error(`שגיאה ביצירת PDF: ${error}`);
    }
  }

  // יצירת PDF מתבנית
  async generatePdfFromTemplate(
    templateId: ID,
    entityId: ID,
    variables: Record<string, string>
  ): Promise<string> {
    try {
      const template = await this.documentService.getTemplateById(templateId);
      if (!template) {
        throw new Error('תבנית לא נמצאה');
      }

      // החלפת משתנים בתבנית
      let html = template.template;
      for (const [key, value] of Object.entries(variables)) {
        html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }

      // יצירת שם קובץ ייחודי
      const fileName = `document_${entityId}_${Date.now()}`;
      const filePath = await this.generatePdfFromHtml(html, fileName);

      return filePath;
    } catch (error) {
      throw new Error(`שגיאה ביצירת PDF מתבנית: ${error}`);
    }
  }

  // יצירת מסמך מתוך תבנית ושמירה במערכת
  async generateAndStoreDocument(
    templateId: ID,
    entityId: ID,
    variables: Record<string, string>,
    deliveryMethod?: string
  ): Promise<{ document: GeneratedDocument; filePath: string }> {
    try {
      const template = await this.documentService.getTemplateById(templateId);
      if (!template) {
        throw new Error('תבנית לא נמצאה');
      }

      // החלפת משתנים בתבנית
      let html = template.template;
      for (const [key, value] of Object.entries(variables)) {
        html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }

      // יצירת PDF
      const fileName = `document_${entityId}_${Date.now()}`;
      const filePath = await this.generatePdfFromHtml(html, fileName);

      // יצירת מספר מסמך ייחודי
      const documentNumber = `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // שמירת המסמך במסד הנתונים
      const documentData: Omit<GeneratedDocument, 'id'> = {
        type: template.type,
        entityId,
        name: template.name,
        documentNumber,
        templateId,
        //זה ריק צריך לשנות בהמשך
        file:{} as FileReference,
        htmlContent: html,
        generatedAt: new Date().toISOString(),
        deliveryMethod
      };

      const document = await this.createGeneratedDocument(documentData);
      return { document, filePath };
    } catch (error) {
      throw new Error(`שגיאה ביצירת ושמירת מסמך: ${error}`);
    }
  }

  // ==================== DATABASE METHODS ====================

  // יצירת רשומת מסמך חדש במסד הנתונים
  async createGeneratedDocument(documentData: Omit<GeneratedDocument, 'id'>): Promise<GeneratedDocument> {
    try {
      const now = new Date().toISOString();
      
      const documentToInsert = {
        type: documentData.type,
        entity_id: documentData.entityId,
        document_number: documentData.documentNumber,
        template_id: documentData.templateId,
        html_content: documentData.htmlContent,
        generated_at: documentData.generatedAt || now,
        delivered_at: documentData.deliveredAt,
        delivery_method: documentData.deliveryMethod
      };

      const { data, error } = await supabase
        .from('generated_documents')
        .insert([documentToInsert])
        .select()
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return this.mapGeneratedDocFromDatabase(data);
    } catch (error) {
      throw new Error(`שגיאה ביצירת מסמך: ${error}`);
    }
  }

  // שליפת מסמך לפי מזהה
  async getGeneratedDocumentById(id: ID): Promise<GeneratedDocument | null> {
    try {
      const { data, error } = await supabase
        .from('generated_documents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Database error: ${error.message}`);
      }

      return this.mapGeneratedDocFromDatabase(data);
    } catch (error) {
      throw new Error(`שגיאה בשליפת מסמך: ${error}`);
    }
  }

  // שליפת מסמכים עם פילטרים
  async getGeneratedDocuments(filter: GeneratedDocumentFilter = {}): Promise<GeneratedDocument[]> {
    try {
      let query = supabase.from('generated_documents').select('*');

      // הוספת פילטרים
      if (filter.entityId) {
        query = query.eq('entity_id', filter.entityId);
      }
      if (filter.type) {
        query = query.eq('type', filter.type);
      }
      if (filter.templateId) {
        query = query.eq('template_id', filter.templateId);
      }
      if (filter.deliveredAt === null) {
        query = query.is('delivered_at', null);
      } else if (filter.deliveredAt) {
        query = query.eq('delivered_at', filter.deliveredAt);
      }

      query = query.order('generated_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return (data || []).map(item => this.mapGeneratedDocFromDatabase(item));
    } catch (error) {
      throw new Error(`שגיאה בשליפת מסמכים: ${error}`);
    }
  }

  // שליפת מסמכים ממתינים למשלוח
  async getPendingDocuments(): Promise<GeneratedDocument[]> {
    return this.getGeneratedDocuments({ deliveredAt: undefined });
  }

  // שליפת מסמכים לפי תבנית
  async getDocumentsByTemplate(templateId: ID): Promise<GeneratedDocument[]> {
    return await this.getGeneratedDocuments({ templateId });
  }

  // עדכון סטטוס משלוח
  async updateDeliveryStatus(
    id: ID,
    deliveredAt: DateISO,
    deliveryMethod: string
  ): Promise<GeneratedDocument> {
    try {
      const { data, error } = await supabase
        .from('generated_documents')
        .update({
          delivered_at: deliveredAt,
          delivery_method: deliveryMethod
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('מסמך לא נמצא לעדכון');
        }
        throw new Error(`Database error: ${error.message}`);
      }

      return this.mapGeneratedDocFromDatabase(data);
    } catch (error) {
      throw new Error(`שגיאה בעדכון סטטוס משלוח: ${error}`);
    }
  }

  // מחיקת מסמך
  async deleteGeneratedDocument(id: ID): Promise<void> {
    try {
      const { error } = await supabase
        .from('generated_documents')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`שגיאה במחיקת מסמך: ${error}`);
    }
  }

  // ==================== HELPER METHODS ====================

  private mapGeneratedDocFromDatabase(data: any): GeneratedDocument {
    return {
      name: data.name,
      id: data.id,
      type: data.type,
      entityId: data.entity_id,
      documentNumber: data.document_number,
      templateId: data.template_id,
      htmlContent: data.html_content,
      generatedAt: data.generated_at,
      deliveredAt: data.delivered_at,
      deliveryMethod: data.delivery_method,
      file:data.file
    };
  }
}