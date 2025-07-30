import { Router } from 'express';
import multer from 'multer';
import { deleteDocuments, getDocumentByIdController, getVendorDocuments, saveDocuments, uploadDocument } from '../controllers/document.controller';

const documentRouter = Router();
const upload = multer({ storage: multer.memoryStorage() }); // שמירת קובץ בזיכרון

documentRouter.post('/', upload.single('file'), uploadDocument);
documentRouter.get('/vendor/:vendorId', getVendorDocuments);
documentRouter.delete('/:documentId', deleteDocuments);
documentRouter.get('/id/:documentId', getDocumentByIdController);
documentRouter.post('/save', upload.single('file'), saveDocuments);


export default documentRouter;