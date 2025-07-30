import React, { useState } from 'react';
import {Button,Box,Typography,Card,CardContent,LinearProgress,IconButton,Chip} from '@mui/material';
import {  Upload,  X,  CheckCircle,  AlertCircle,  File,  Image,  FileText} from 'lucide-react';
import { designSystem, spacing } from '../../Css/theme';


interface FileItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
}

interface FileUploaderProps {
  onFilesUploaded?: (files: FileItem[]) => void;
}

// קומפוננטת העלאת קבצים ל-Google Drive
const FileUploader: React.FC<FileUploaderProps> = ({ onFilesUploaded }) => {
  // מצב הקבצים שנבחרו להעלאה
  const [files, setFiles] = useState<FileItem[]>([]);
  // האם המשתמש גורר קובץ מעל האזור
  const [isDragOver, setIsDragOver] = useState(false);
  // שדות מידע נוספים להעלאה
  const [category, setCategory] = useState<'חוזה' | 'חשבונית' | 'קבלה' | 'שונות'>('שונות');
  const [customerId, setCustomerId] = useState<string>('');
  const [folderId, setFolderId] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // טיפול בבחירת קבצים דרך input
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  // טיפול בגרירת קבצים לאזור ההעלאה
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  // הוספת קבצים לרשימת הקבצים להעלאה
  const addFiles = (newFiles: File[]) => {
    const filesWithId: FileItem[] = newFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      status: 'pending',
      progress: 0,
    }));

    setFiles(prev => [...prev, ...filesWithId]);
  };

  // הסרת קובץ מרשימת הקבצים
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  // שליחת קובץ לשרת (כולל מידע נוסף)
  const uploadFile = (fileItem: FileItem, retryCount = 0) => {
    console.log('Starting upload for file:', fileItem.file.name);
    
    setFiles(prev =>
      prev.map(f =>
        f.id === fileItem.id ? { ...f, status: 'uploading', progress: 0 } : f
      )
    );

    const formData = new FormData();
    formData.append('file', fileItem.file);
    formData.append('category', category);
    formData.append('folderPath', 'test/folder'); // הוספת folderPath
    if (customerId) formData.append('customerId', customerId);
    if (folderId) formData.append('folderId', folderId);
    if (description) formData.append('description', description);
    
    console.log('FormData contents:');
    console.log('File:', fileItem.file.name);
    console.log('Category:', category);
    console.log('FolderPath: test/folder');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${process.env.REACT_APP_API_URL}/document/save`);

    // עדכון התקדמות העלאה
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded * 100) / event.total);
        setFiles(prev =>
          prev.map(f =>
            f.id === fileItem.id ? { ...f, progress: percent } : f
          )
        );
      }
    };

    // טיפול בסיום העלאה
    xhr.onload = () => {
      console.log('Upload response status:', xhr.status);
      console.log('Upload response text:', xhr.responseText);
      
      if (xhr.status === 200 || xhr.status === 201) {
        console.log('Upload successful for file:', fileItem.file.name);
        setFiles(prev =>
          prev.map(f =>
            f.id === fileItem.id ? { ...f, status: 'success', progress: 100 } : f
          )
        );
      } else if (retryCount < 2) {
        console.log('Upload failed, retrying...', xhr.status, xhr.responseText);
        uploadFile(fileItem, retryCount + 1);
      } else {
        console.error('Upload failed after retries:', xhr.status, xhr.responseText);
        setFiles(prev =>
          prev.map(f =>
            f.id === fileItem.id ? { ...f, status: 'error' } : f
          )
        );
      }
    };

    // טיפול בשגיאת רשת
    xhr.onerror = () => {
      if (retryCount < 2) {
        uploadFile(fileItem, retryCount + 1);
      } else {
        setFiles(prev =>
          prev.map(f =>
            f.id === fileItem.id ? { ...f, status: 'error' } : f
          )
        );
      }
    };

    xhr.send(formData);
  };

  // עיצוב גודל קובץ לקריאה נוחה
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 בתים';
    const k = 1024;
    const sizes = ['בתים', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // קבלת אייקון מתאים לפי סוג קובץ
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/'))
      return <Image size={24} color={designSystem.colors.primary} />;
    if (fileType === 'application/pdf')
      return <FileText size={24} color={designSystem.colors.error} />;
    return <File size={24} color={designSystem.colors.neutral[500]} />;
  };

  // קבלת אייקון סטטוס (הצלחה/שגיאה)
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={20} color={designSystem.colors.success} />;
      case 'error':
        return <AlertCircle size={20} color={designSystem.colors.error} />;
      default:
        return null;
    }
  };

  // קבלת תגית סטטוס (צ'יפ)
  const getStatusChip = (status: string) => {
    switch (status) {
      case 'pending':
        return <Chip label="ממתין" size="small" sx={{
          backgroundColor: designSystem.colors.neutral[100],
          color: designSystem.colors.neutral[700]
        }} />;
      case 'uploading':
        return <Chip label="מעלה..." size="small" sx={{
          backgroundColor: designSystem.colors.primary,
          color: 'white'
        }} />;
      case 'success':
        return <Chip label="הועלה בהצלחה" size="small" sx={{
          backgroundColor: designSystem.colors.success,
          color: 'white'
        }} />;
      case 'error':
        return <Chip label="שגיאה" size="small" sx={{
          backgroundColor: designSystem.colors.error,
          color: 'white'
        }} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{
      maxWidth: 800,
      mx: 'auto',
      p: spacing(6),
      fontFamily: designSystem.typography.fontFamily.hebrew,
      direction: 'rtl'
    }}>
      {/* שדות העלאה מתקדמים */}
      <Card sx={{ mb: spacing(6), p: spacing(4) }}>
        <Typography variant="h6" sx={{ mb: spacing(2) }}>פרטי העלאה</Typography>
        <Box sx={{ display: 'flex', gap: spacing(4), flexWrap: 'wrap' }}>
          <Box>
            <label>קטגוריה:</label>
            <select value={category} onChange={e => setCategory(e.target.value as any)} style={{ marginRight: 8 }}>
              <option value="חוזה">חוזה</option>
              <option value="חשבונית">חשבונית</option>
              <option value="קבלה">קבלה</option>
              <option value="שונות">שונות</option>
            </select>
          </Box>
          <Box>
            <label>מזהה לקוח:</label>
            <input value={customerId} onChange={e => setCustomerId(e.target.value)} style={{ marginRight: 8 }} />
          </Box>
          <Box>
            <label>מזהה תיקיה:</label>
            <input value={folderId} onChange={e => setFolderId(e.target.value)} style={{ marginRight: 8 }} />
          </Box>
          <Box>
            <label>תיאור:</label>
            <input value={description} onChange={e => setDescription(e.target.value)} style={{ marginRight: 8 }} />
          </Box>
        </Box>
      </Card>

      {/* כותרת */}
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        align="center"
        sx={{
          color: designSystem.colors.primary,
          fontWeight: 'bold',
          mb: spacing(8),
          fontSize: designSystem.typography.fontSize['3xl']
        }}
      >
        📁 העלאת קבצים ל-Google Drive
      </Typography>

      {/* אזור גרירה */}
      <Card
        sx={{
          mb: spacing(6),
          border: isDragOver
            ? `3px dashed ${designSystem.colors.primary}`
            : `2px dashed ${designSystem.colors.neutral[300]}`,
          backgroundColor: isDragOver
            ? designSystem.colors.neutral[50]
            : 'white',
          borderRadius: designSystem.borderRadius.lg,
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          '&:hover': {
            borderColor: designSystem.colors.primary,
            backgroundColor: designSystem.colors.neutral[50],
            boxShadow: designSystem.shadows.md
          }
        }}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
      >
        <CardContent sx={{ textAlign: 'center', py: spacing(12) }}>
          <Box sx={{ mb: spacing(6) }}>
            <Upload
              size={80}
              color={isDragOver ? designSystem.colors.primary : designSystem.colors.neutral[300]}
              style={{ transition: 'color 0.3s ease' }}
            />
          </Box>

          <Typography variant="h5" gutterBottom sx={{
            color: designSystem.colors.neutral[700],
            fontSize: designSystem.typography.fontSize.xl,
            fontWeight: 600
          }}>
            גרור קבצים לכאן
          </Typography>

          <Typography variant="body1" sx={{
            color: designSystem.colors.neutral[500],
            mb: spacing(6),
            fontSize: designSystem.typography.fontSize.base
          }}>
            או לחץ לבחירת קבצים מהמחשב
          </Typography>

          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<Upload size={20} />}
              size="large"
              sx={{
                backgroundColor: designSystem.colors.primary,
                px: spacing(8),
                py: spacing(3),
                fontSize: designSystem.typography.fontSize.lg,
                fontWeight: 600,
                borderRadius: designSystem.borderRadius.md,
                '&:hover': {
                  backgroundColor: designSystem.colors.primary,
                  opacity: 0.9,
                  transform: 'translateY(-2px)',
                  boxShadow: designSystem.shadows.lg
                },
                transition: 'all 0.3s ease'
              }}
              disabled={files.length === 0}
              // הוסף כאן:
              onClick={() => {
                files.forEach(fileItem => {
                  if (fileItem.status === 'pending' || fileItem.status === 'error') {
                    uploadFile(fileItem);
                  }
                });
              }}
            >
              🚀 העלה ל-Google Drive ({files.length} קבצים)

            </Button>
          </label>
        </CardContent>
      </Card>

      {/* רשימת קבצים */}
      {files.length > 0 && (
        <Card sx={{
          boxShadow: designSystem.shadows.lg,
          borderRadius: designSystem.borderRadius.lg,
          overflow: 'hidden'
        }}>
          <CardContent sx={{ p: 0 }}>
            {/* כותרת רשימה */}
            <Box sx={{
              p: spacing(6),
              borderBottom: `1px solid ${designSystem.colors.neutral[200]}`,
              backgroundColor: designSystem.colors.neutral[50]
            }}>
              <Typography variant="h6" sx={{
                color: designSystem.colors.neutral[700],
                fontSize: designSystem.typography.fontSize.lg,
                fontWeight: 600
              }}>
                📋 קבצים שנבחרו ({files.length})
              </Typography>
            </Box>

            {/* רשימת קבצים */}
            <Box sx={{ p: spacing(4) }}>
              {files.map((fileItem, index) => (
                <Card
                  key={fileItem.id}
                  sx={{
                    mb: index === files.length - 1 ? 0 : spacing(4),
                    border: `1px solid ${designSystem.colors.neutral[200]}`,
                    borderRadius: designSystem.borderRadius.md,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: designSystem.shadows.md,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent sx={{ p: spacing(6) }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: spacing(4) }}>
                      {/* אייקון קובץ */}
                      <Box sx={{
                        p: spacing(4),
                        borderRadius: designSystem.borderRadius.md,
                        backgroundColor: designSystem.colors.neutral[50],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {getFileIcon(fileItem.file.type)}
                      </Box>
                      {/* תצוגה מקדימה */}
                      {fileItem.file.type.startsWith('image/') && (
                        <Box sx={{ mt: spacing(2) }}>
                          <img
                            src={URL.createObjectURL(fileItem.file)}
                            alt={fileItem.file.name}
                            style={{ maxWidth: 120, maxHeight: 120, borderRadius: 8, border: '1px solid #eee' }}
                          />
                        </Box>
                      )}
                      {fileItem.file.type === 'application/pdf' && (
                        <Box sx={{ mt: spacing(2) }}>
                          <embed
                            src={URL.createObjectURL(fileItem.file)}
                            type="application/pdf"
                            width="120"
                            height="120"
                            style={{ borderRadius: 8, border: '1px solid #eee' }}
                          />
                        </Box>
                      )}
                      {/* פרטי קובץ */}
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{
                          color: designSystem.colors.neutral[900],
                          mb: spacing(1),
                          fontWeight: 600,
                          fontSize: designSystem.typography.fontSize.base
                        }}>
                          {fileItem.file.name}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: spacing(4) }}>
                          <Typography variant="body2" sx={{
                            color: designSystem.colors.neutral[500],
                            fontSize: designSystem.typography.fontSize.sm
                          }}>
                            {formatFileSize(fileItem.file.size)}
                          </Typography>
                          {getStatusChip(fileItem.status)}
                        </Box>

                        {/* פס התקדמות */}
                        {fileItem.status === 'uploading' && (
                          <LinearProgress
                            variant="determinate"
                            value={fileItem.progress}
                            sx={{
                              mt: spacing(4),
                              height: spacing(2),
                              borderRadius: designSystem.borderRadius.sm,
                              backgroundColor: designSystem.colors.neutral[200],
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: designSystem.colors.secondary,
                                borderRadius: designSystem.borderRadius.sm
                              }
                            }}
                          />
                        )}
                      </Box>

                      {/* כפתורים */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: spacing(2) }}>
                        {getStatusIcon(fileItem.status)}
                        <IconButton
                          onClick={() => removeFile(fileItem.id)}
                          size="small"
                          sx={{
                            color: designSystem.colors.error,
                            '&:hover': {
                              backgroundColor: designSystem.colors.error + '10',
                              transform: 'scale(1.1)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <X size={18} />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {/* כפתור העלאה */}
            <Box sx={{
              p: spacing(6),
              borderTop: `1px solid ${designSystem.colors.neutral[200]}`
            }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<Upload size={24} />}
                sx={{
                  backgroundColor: designSystem.colors.secondary,
                  color: designSystem.colors.neutral[900],
                  py: spacing(4),
                  fontSize: designSystem.typography.fontSize.lg,
                  fontWeight: 'bold',
                  borderRadius: designSystem.borderRadius.md,
                  '&:hover': {
                    backgroundColor: designSystem.colors.secondary,
                    opacity: 0.9,
                    transform: 'translateY(-2px)',
                    boxShadow: designSystem.shadows.lg
                  },
                  '&:disabled': {
                    backgroundColor: designSystem.colors.neutral[300],
                    color: designSystem.colors.neutral[500]
                  },
                  transition: 'all 0.3s ease'
                }}
                disabled={files.length === 0}
                onClick={() => {
                  files.forEach(fileItem => {
                    if (fileItem.status === 'pending' || fileItem.status === 'error') {
                      uploadFile(fileItem);
                    }
                  });
                }}
              >
                🚀 העלה ל-Google Drive ({files.length} קבצים)
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default FileUploader;