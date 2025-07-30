import { Router } from 'express';
import multer from 'multer';
import {
  postFile,
  getFile,
  deleteFile,
  shareFile,
  getFileMetadata,
  uploadFile
} from '../controllers/drive-controller';

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // תיקון קידוד UTF-8 לשמות קבצים בעברית
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, true);
  }
});
const router = Router();

// בלי as any - אמור לעבוד עכשיו!
router.get('/v3/files/:fileId/metadata', getFileMetadata);
router.get('/v3/files/:fileId', getFile);
router.post('/v3/files', upload.single('file'), postFile);
router.delete('/v3/files/:fileId', deleteFile);
router.post('/v3/files/:fileId/permissions', shareFile);

// נתיב העלאה נוסף
router.post('/upload', upload.single('file'), uploadFile);
router.post('/plainUpload', upload.single('file'), postFile);

export default router;
