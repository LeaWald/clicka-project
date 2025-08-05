import { Request, Response } from 'express';
import { GeneratedDocumentService, GeneratedDocumentFilter } from '../services/generate-d-template.service';
import { ID } from 'shared-types';

export class GeneratedDocumentController {
  private generatedDocumentService: GeneratedDocumentService;

  constructor() {
    this.generatedDocumentService = new GeneratedDocumentService();
  }

  // יצירת PDF מ-HTML (לבדיקות)
  generatePdfTest = async (req: Request, res: Response) => {
    try {
      const html = req.body.html || '<h1>מסמך לדוגמה</h1><p>שלום עולם</p>';
      const fileName = 'test_document_' + Date.now();
      const filePath = await this.generatedDocumentService.generatePdfFromHtml(html, fileName);

      res.status(200).json({ 
        success: true,
        message: 'PDF נוצר בהצלחה', 
        path: filePath 
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'שגיאה לא ידועה';
      res.status(500).json({ 
        success: false,
        error: 'שגיאה ביצירת PDF', 
        details: msg 
      });
    }
  };

  // יצירת PDF מתבנית
  generateDocumentPdf = async (req: Request, res: Response): Promise<void> => {
    try {
      const { templateId, entityId, variables } = req.body;

      if (!templateId || !entityId || !variables) {
        res.status(400).json({
          success: false,
          message: 'חסרים פרמטרים נדרשים: templateId, entityId, variables'
        });
        return;
      }

      const filePath = await this.generatedDocumentService.generatePdfFromTemplate(
        templateId, 
        entityId, 
        variables
      );

      res.status(200).json({
        success: true,
        message: 'קובץ PDF נוצר בהצלחה',
        path: filePath
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'שגיאה ביצירת PDF',
        error: error instanceof Error ? error.message : 'שגיאה לא ידועה'
      });
    }
  };

  // יצירת מסמך מלא ושמירה במערכת
  generateAndStoreDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        templateId, 
        entityId, 
        variables, 
        customerId, 
        deliveryMethod 
      } = req.body;

      if (!templateId || !entityId || !variables) {
        res.status(400).json({
          success: false,
          message: 'חסרים פרמטרים נדרשים: templateId, entityId, variables'
        });
        return;
      }

      const result = await this.generatedDocumentService.generateAndStoreDocument(
        templateId,
        entityId,
        variables,
        deliveryMethod
      );

      res.status(201).json({
        success: true,
        message: 'מסמך נוצר ונשמר בהצלחה',
        data: {
          document: result.document,
          filePath: result.filePath
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'שגיאה ביצירת ושמירת מסמך',
        error: error instanceof Error ? error.message : 'שגיאה לא ידועה'
      });
    }
  };

  // שליפת מסמך לפי מזהה
  getGeneratedDocumentById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const document = await this.generatedDocumentService.getGeneratedDocumentById(id as ID);

      if (!document) {
        res.status(404).json({
          success: false,
          message: 'מסמך לא נמצא',
          data: null
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'מסמך נמצא בהצלחה',
        data: document
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'שגיאה בשליפת מסמך',
        data: null
      });
    }
  };

  // שליפת מסמכים עם פילטרים
  getGeneratedDocuments = async (req: Request, res: Response): Promise<void> => {
    try {
      const filter: GeneratedDocumentFilter = {};

      // בניית פילטר מפרמטרי השאילתה
      if (req.query.entityId) {
        filter.entityId = req.query.entityId as ID;
      }
      if (req.query.type) {
        filter.type = req.query.type as string;
      }
      if (req.query.templateId) {
        filter.templateId = req.query.templateId as ID;
      }
      if (req.query.pending === 'true') {
        filter.deliveredAt = '';
      }

      const documents = await this.generatedDocumentService.getGeneratedDocuments(filter);

      res.status(200).json({
        success: true,
        message: 'מסמכים נשלפו בהצלחה',
        data: documents,
        count: documents.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'שגיאה בשליפת מסמכים',
        data: null
      });
    }
  };

  // שליפת מסמכים ממתינים למשלוח
  getPendingDocuments = async (req: Request, res: Response): Promise<void> => {
    try {
      const documents = await this.generatedDocumentService.getPendingDocuments();

      res.status(200).json({
        success: true,
        message: 'מסמכים ממתינים נשלפו בהצלחה',
        data: documents,
        count: documents.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'שגיאה בשליפת מסמכים ממתינים',
        data: null
      });
    }
  };

  // שליפת מסמכים לפי תבנית
  getDocumentsByTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { templateId } = req.params;
      const documents = await this.generatedDocumentService.getDocumentsByTemplate(templateId as ID);

      res.status(200).json({
        success: true,
        message: 'מסמכים לפי תבנית נשלפו בהצלחה',
        data: documents,
        count: documents.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'שגיאה בשליפת מסמכים לפי תבנית',
        data: null
      });
    }
  };

  // עדכון סטטוס משלוח
  updateDeliveryStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { deliveredAt, deliveryMethod } = req.body;

      if (!deliveredAt || !deliveryMethod) {
        res.status(400).json({
          success: false,
          message: 'חסרים פרמטרים נדרשים: deliveredAt, deliveryMethod'
        });
        return;
      }

      const updatedDocument = await this.generatedDocumentService.updateDeliveryStatus(
        id as ID,
        deliveredAt,
        deliveryMethod
      );

      res.status(200).json({
        success: true,
        message: 'סטטוס משלוח עודכן בהצלחה',
        data: updatedDocument
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'שגיאה בעדכון סטטוס משלוח',
        data: null
      });
    }
  };

  // מחיקת מסמך
  deleteGeneratedDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.generatedDocumentService.deleteGeneratedDocument(id as ID);

      res.status(200).json({
        success: true,
        message: 'מסמך נמחק בהצלחה',
        data: null
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'שגיאה במחיקת מסמך',
        data: null
      });
    }
  };

  // סטטיסטיקות מסמכים
  getDocumentStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const allDocuments = await this.generatedDocumentService.getGeneratedDocuments();
      const pendingDocuments = await this.generatedDocumentService.getPendingDocuments();

      const stats = {
        total: allDocuments.length,
        pending: pendingDocuments.length,
        delivered: allDocuments.length - pendingDocuments.length,
        byType: {} as Record<string, number>
      };

      // חישוב סטטיסטיקות לפי סוג
      allDocuments.forEach((doc: { type: string | number; }) => {
        stats.byType[doc.type] = (stats.byType[doc.type] || 0) + 1;
      });

      res.status(200).json({
        success: true,
        message: 'סטטיסטיקות מסמכים נשלפו בהצלחה',
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'שגיאה בשליפת סטטיסטיקות',
        data: null
      });
    }
  };
}