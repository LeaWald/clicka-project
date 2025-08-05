import { Request, Response } from 'express';
import { DocumentService} from '../services/document-template.service.ts';
import { DocumentTemplateModel } from '../models/document-template.model';
import { ID } from 'shared-types';
import{ DocumentType } from 'shared-types';

export class DocumentController {
  private documentService: DocumentService;

  constructor() {
    this.documentService = new DocumentService();
  }

  // יצירת תבנית חדשה
  createTemplate = async (req: Request, res: Response) => {
    console.log(req.body, "req.body in createTemplate");
    
    try {
      const {
        newDocuments      }: {
        newDocuments: DocumentTemplateModel,
      } = req.body;
      console.log(newDocuments, "יצירת תבנית חדשהההה");
      
      const newTemplate = await this.documentService.createDocumentTemplate(newDocuments);
      
      res.status(201).json({
        success: true,
        message: 'תבנית נוצרה בהצלחה',
        data: newTemplate
      });

    } catch (error) {
      console.log(error, "Error in createTemplate");
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        success: false,
        error: 'Failed to create template', 
        details: errorMessage 
      });
    }
  };

  // שליפת תבנית לפי מזהה
  getTemplateById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const template = await this.documentService.getTemplateById(id as ID);

      res.status(200).json({
        success: true,
        message: 'תבנית המסמך נמצאה בהצלחה',
        data: template
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'תבנית המסמך לא נמצאה',
        data: null
      });
    }
  };

  // שליפת כל התבניות
  getAllTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      const templates = await this.documentService.getAllTemplates();
      if(templates)
      res.status(200).json(templates);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'שגיאה בשליפת תבניות מסמכים',
        data: null
      });
    }
  };

  // שליפת תבניות לפי סוג
  getTemplatesByType = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type } = req.params;

      if (!Object.values(DocumentType).includes(type as DocumentType)) {
        res.status(400).json({
          success: false,
          message: 'סוג מסמך לא תקין',
          data: null
        });
        return;
      }

      const templates = await this.documentService.getTemplatesByType(type as DocumentType);

      res.status(200).json({
        success: true,
        message: `תבניות מסוג ${type} נשלפו בהצלחה`,
        data: templates
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'שגיאה בשליפת תבניות לפי סוג',
        data: null
      });
    }
  };

  // שליפת תבניות פעילות
  getActiveTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      const templates = await this.documentService.getActiveTemplates();

      res.status(200).json({
        success: true,
        message: 'תבניות פעילות נשלפו בהצלחה',
        data: templates
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'שגיאה בשליפת תבניות פעילות',
        data: null
      });
    }
  };

  // עדכון תבנית
  updateTemplate = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updatedTemplate = req.body;
console.log(updatedTemplate, "updatedTemplate in updateTemplate");
      const result = await DocumentService.updateTemplate(id, updatedTemplate);      
      res.status(200).json({
        success: true,
        message: 'תבנית עודכנה בהצלחה',
        data: result
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Failed to update template',
        message: error instanceof Error ? error.message : 'שגיאה בעדכון תבנית'
      });
    }
  };

  // מחיקת תבנית
  deleteTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.documentService.deleteTemplate(id as ID);

      res.status(200).json({
        success: true,
        message: 'תבנית המסמך נמחקה בהצלחה',
        data: null
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'שגיאה במחיקת תבנית מסמך',
        data: null
      });
    }
  };

  // שליפת תבנית ברירת מחדל לפי סוג
  getDefaultTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type } = req.params;

      if (!Object.values(DocumentType).includes(type as DocumentType)) {
        res.status(400).json({
          success: false,
          message: 'סוג מסמך לא תקין',
          data: null
        });
        return;
      }

      const template = await this.documentService.getDefaultTemplate(type as DocumentType);

      if (!template) {
        res.status(404).json({
          success: false,
          message: 'לא נמצאה תבנית ברירת מחדל לסוג זה',
          data: null
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'תבנית ברירת מחדל נמצאה בהצלחה',
        data: template
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'שגיאה בשליפת תבנית ברירת מחדל',
        data: null
      });
    }
  };

  
  // הפעלה/השבתה של תבנית
  toggleTemplateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updatedTemplate = await this.documentService.toggleTemplateStatus(id as ID);

      res.status(200).json({
        success: true,
        message: `תבנית המסמך ${updatedTemplate.active ? 'הופעלה' : 'הושבתה'} בהצלחה`,
        data: updatedTemplate
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'שגיאה בשינוי סטטוס תבנית',
        data: null
      });
    }
  };
}