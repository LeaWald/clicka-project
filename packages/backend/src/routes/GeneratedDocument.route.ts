import { Router } from 'express';
import { GeneratedDocumentController } from '../controllers/GeneratedDocument.controller';

const router = Router();
const generatedDocumentController = new GeneratedDocumentController();

// ==================== PDF GENERATION ROUTES ====================

// יצירת PDF מ-HTML (לבדיקות)
router.post('/test-pdf', generatedDocumentController.generatePdfTest);

// יצירת PDF מתבנית
router.post('/generate-pdf', generatedDocumentController.generateDocumentPdf);

// יצירת מסמך מלא ושמירה במערכת
router.post('/generate-and-store', generatedDocumentController.generateAndStoreDocument);

// ==================== DOCUMENT MANAGEMENT ROUTES ====================

// שליפת כל המסמכים עם פילטרים
router.get('/', generatedDocumentController.getGeneratedDocuments);

// שליפת מסמך לפי מזהה
router.get('/:id', generatedDocumentController.getGeneratedDocumentById);

// שליפת מסמכים ממתינים למשלוח
router.get('/status/pending', generatedDocumentController.getPendingDocuments);

// שליפת מסמכים שנמסרו
// router.get('/status/delivered', generatedDocumentController.getDeliveredDocuments);

// שליפת מסמכים לפי תבנית
router.get('/template/:templateId', generatedDocumentController.getDocumentsByTemplate);

// שליפת מסמכים לפי לקוח
// router.get('/customer/:customerId', generatedDocumentController.getDocumentsByCustomer);

// שליפת מסמכים לפי ישות
// router.get('/entity/:entityId', generatedDocumentController.getDocumentsByEntity);

// עדכון סטטוס משלוח
router.patch('/:id/delivery-status', generatedDocumentController.updateDeliveryStatus);

// מחיקת מסמך
router.delete('/:id', generatedDocumentController.deleteGeneratedDocument);

// ==================== STATISTICS ROUTES ====================

// סטטיסטיקות מסמכים
router.get('/stats/overview', generatedDocumentController.getDocumentStats);

// סטטיסטיקות לפי סוג מסמך
// router.get('/stats/by-type', generatedDocumentController.getStatsByType);

// סטטיסטיקות לפי תקופה
// router.get('/stats/by-period', generatedDocumentController.getStatsByPeriod);

export default router;