import { Router } from 'express';
import { DocumentController } from '../controllers/document-template.controller';

const router = Router();
const documentController = new DocumentController();

// ==================== TEMPLATE ROUTES ====================

// יצירת תבנית חדשה
router.post('/', documentController.createTemplate);

// שליפת כל התבניות
router.get('/', documentController.getAllTemplates);

// שליפת תבניות פעילות בלבד
router.get('/active', documentController.getActiveTemplates);

// שליפת תבנית לפי מזהה
router.get('/:id', documentController.getTemplateById);

// שליפת תבניות לפי סוג
router.get('/type/:type', documentController.getTemplatesByType);

// שליפת תבנית ברירת מחדל לפי סוג
router.get('/default/:type', documentController.getDefaultTemplate);

// עדכון תבנית
router.put('/:id', documentController.updateTemplate);

// הפעלה/השבתה של תבנית
router.patch('/:id/toggle-status', documentController.toggleTemplateStatus);

// מחיקת תבנית
router.delete('/:id', documentController.deleteTemplate);

export default router;