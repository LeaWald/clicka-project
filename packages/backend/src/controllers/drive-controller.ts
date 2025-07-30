import { Request, Response, NextFunction } from 'express';
import * as tokenService from '../services/tokenService';
import {
  uploadFileToDrive,
  getFileFromDrive,
  deleteFileFromDrive,
  shareDriveFile,
  getFileMetadataFromDrive ,
  uploadFileToFolderPath,
  uploadFileAndReturnReference 
} from '../services/drive-service';
import {
  validateUploadFile,
  validateFileId,
  validateSharePermissions
} from '../utils/validateDriveInput';
import { UserTokenService } from '../services/userTokenService';

interface MulterRequest extends Request {
  file: Express.Multer.File;
}

//חדש
export async function postFile(req: Request, res: Response, next: NextFunction) {
  console.log('uploadFile hit');
  console.log('req.file:', req.file);
  console.log('req.body:', req.body);
  const user = await tokenService.getUserFromCookie(req);
    const userTokenService = new UserTokenService();
    let token;
    if (user) {
      token = await userTokenService.getAccessTokenByUserId(user.userId);
    }
  //const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next({ status: 401, message: 'Missing token' });

  const file = req.file;
  if (!file) return next({ status: 400, message: 'Missing file' });

  // קבל פרמטרים מה-body
  const { folderId, folderPath, category, customerId, description } = req.body;
          
  try {
    validateUploadFile(req);
    
    let result;
    
    if (folderPath) {
      // אם נשלח path, השתמש בפונקציה החדשה
      console.log(`Uploading to folder path: ${folderPath}`);
      result = await uploadFileToFolderPath(file, token, folderPath);
    } else if (folderId) {
      // אם נשלח ID ישירות
      console.log(`Uploading to folder ID: ${folderId}`);
      result = await uploadFileToDrive(file, token, folderId);
    } else {
      // אם לא נשלח כלום, העלה לשורש
      console.log('Uploading to root folder');
      result = await uploadFileToDrive(file, token);
    }
    
    res.status(201).json({
      ...result,
      message: 'קובץ הועלה בהצלחה',
      uploadedToPath: folderPath || 'Root',
      folderId: result.parents?.[0] || 'Root'
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    if (!err.status) err.status = 500;
    next(err);
  }
}

export async function getFile(req: Request, res: Response, next: NextFunction) {
  const userTokenService = new UserTokenService();
  const token = await userTokenService.getSystemAccessToken(); 
  const fileId = req.params.fileId;
  console.log('fileId:', req.params.fileId);
  if (!token) return next({ status: 401, message: 'Missing token' });
  try {
    validateFileId(fileId);
    const fileStream = await getFileFromDrive(fileId, token);
    fileStream.pipe(res);
  } catch (err: any) {
    if (!err.status) err.status = 500;
    next(err);
  }
}

export async function getFileMetadata(req: Request, res: Response, next: NextFunction) {
  const userTokenService = new UserTokenService();
  const token = await userTokenService.getSystemAccessToken(); 
  const fileId = req.params.fileId;
  if (!token) return next({ status: 401, message: 'Missing token' });
  try {
    validateFileId(fileId);
    const metadata = await getFileMetadataFromDrive(fileId, token);
    res.status(200).json(metadata);
  } catch (err: any) {
    if (!err.status) err.status = 500;
    next(err);
  }
}

export async function deleteFile(req: Request, res: Response, next: NextFunction) {
  const userTokenService = new UserTokenService();
  const token = await userTokenService.getSystemAccessToken(); 
  const fileId = req.params.fileId;
  if (!token) return next({ status: 401, message: 'Missing token' });
  try {
    validateFileId(fileId);
    await deleteFileFromDrive(fileId, token);
    res.sendStatus(204);
  } catch (err: any) {
    if (!err.status) err.status = 500;
    next(err);
  }
}

export async function shareFile(req: Request, res: Response, next: NextFunction) {
  const userTokenService = new UserTokenService();
  const token = await userTokenService.getSystemAccessToken(); 
  const fileId = req.params.fileId;
  const permissions = req.body;
  if (!token) return next({ status: 401, message: 'Missing token' });
  try {
    validateFileId(fileId);
    await shareDriveFile(fileId, permissions, token);
    res.sendStatus(200);
  } catch (err: any) {
    if (!err.status) err.status = 500;
    next(err);
  }
}

// export async function uploadFile(req: Request, res: Response, next: NextFunction) {
//   const token =  req.cookies.session;
//   const file = req.file; // multer middleware אמור להעלות את הקובץ לפה
//   const folderPath = req.body.folderPath;

//   if (!token) return next({ status: 401, message: 'Missing token' });
//   if (!file) return next({ status: 400, message: 'Missing file' });
//   if (!folderPath) return next({ status: 400, message: 'Missing folder path' });

//   try {
//     const fileRef = await uploadFileAndReturnReference(file, folderPath);
//     res.status(201).json(fileRef);
//   } catch (err: any) {
//     if (!err.status) err.status = 500;
//     next(err);
//   }
// }

export async function uploadFile(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.session;
  const file = req.file; // multer middleware אמור להעלות את הקובץ לפה
  const folderPath = req.body.folderPath;
  const contractId = req.body.contractId; // אופציונלי

  if (!token) return next({ status: 401, message: 'Missing token' });
  if (!file) return next({ status: 400, message: 'Missing file' });
  if (!folderPath) return next({ status: 400, message: 'Missing folder path' });

  try {
    const fileRef = await uploadFileAndReturnReference(file, folderPath);
    res.status(201).json(fileRef);
  } catch (err: any) {
    if (!err.status) err.status = 500;
    next(err);
  }
}
