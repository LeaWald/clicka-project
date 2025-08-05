import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, LinearProgress, IconButton, Chip } from '@mui/material';
import { Upload, X, CheckCircle, AlertCircle, File, Image, FileText, ExternalLink, Copy, CloudUpload } from 'lucide-react';
import axios from 'axios';
import { Button as CustomButton } from '../Button';
import { showAlert } from '../../BaseComponents/ShowAlert';
import { useTheme } from '../../themeConfig';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain', 'application/zip'
];



export interface FileUploaderProps {
  folderPath?: string;
  category?: 'חוזה' | 'חשבונית' | 'קבלה' | 'שונות';
  description?: string;
  customerId?: string;
   contractId?: string;
  folderId?: string;
  onFilesUploaded?: (files: FileItem[]) => void;
  dir?: 'rtl' | 'ltr';
  className?: string;
  "data-testid"?: string;
}

export interface FileUploadRequest {
  file: File;
  folderId?: string;
  category: 'חוזה' | 'חשבונית' | 'קבלה' | 'שונות';
  customerId?: string;
  description?: string;
}

export interface FileItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  fileUrl?: string;
  errorMessage?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesUploaded,
  folderPath,
  category = 'שונות',
  customerId = '',
  contractId = '',
  folderId = '',
  description = '',
  dir,
  className,
  "data-testid": testId,
}) => {
  console.log('📋 FileUploader initialized with:', {
    folderPath, category, customerId, folderId, description
  });

  const { theme } = useTheme();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const effectiveDir = dir || theme.direction;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      console.log('📥 Files selected via input:', selectedFiles);
      addFiles(selectedFiles);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    console.log('📥 Files dropped:', droppedFiles);
    addFiles(droppedFiles);
  };

  const addFiles = (newFiles: File[]) => {
    console.log('📥 Adding files:', newFiles);

    const validFiles = newFiles.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        showAlert(
          'קובץ גדול מדי',
          `הקובץ "${file.name}" גדול מדי (${formatFileSize(file.size)}). מקסימום: ${formatFileSize(MAX_FILE_SIZE)}`,
          'warning'
        );
        return false;
      }

      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        console.warn(`⚠️ סוג קובץ לא נתמך: ${file.type} עבור ${file.name}`);
      }

      return true;
    });

    const filesWithId: FileItem[] = validFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      status: 'pending',
      progress: 0,
    }));

    setFiles(prev => {
      const updated = [...prev, ...filesWithId];
      console.log('📄 Updated files list:', updated);
      return updated;
    });
  };

  const removeFile = (id: string) => {
    console.log('🗑️ Removing file with id:', id);
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const uploadFile = async (fileItem: FileItem, retryCount = 0) => {
    console.log(`🚀 Starting upload for file "${fileItem.file.name}", attempt #${retryCount + 1}`);

    setFiles(prev =>
      prev.map(f =>
        f.id === fileItem.id ? { ...f, status: 'uploading', progress: 0 } : f
      )
    );

    const formData = new FormData();
    formData.append('file', fileItem.file);
    formData.append('category', category);
    formData.append('contractId', contractId);
    formData.append('conflictResolution', 'rename');
    if (customerId) formData.append('customerId', customerId);
    if (folderId) formData.append('folderId', folderId);
    if (description) formData.append('description', description);
    if (folderPath) formData.append('folderPath', folderPath);
    const token = localStorage.getItem('accessToken') || '';
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/document/save`,
        formData,
        {
          withCredentials: true,
          timeout: 120000,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (event) => {
            if (event.total) {
              const percent = Math.round((event.loaded * 100) / event.total);
              setFiles(prev =>
                prev.map(f =>
                  f.id === fileItem.id ? { ...f, progress: percent } : f
                )
              );
              console.log(`⬆️ Upload progress for "${fileItem.file.name}": ${percent}%`);
            }
          }
        },
      );
    // const fileRef:FileReference = res.data;
    //  await fetch(`http://localhost:3001/api/contracts/documents`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       Authorization: `Bearer ${token}`,
    //     },
    //     body: JSON.stringify({ fileReference: fileRef }),
    //   });
      console.log('📥 Response data:', res.data);
      console.log('📥 Document data:', res.data.document);
      console.log('📥 Google Drive ID:', res.data.document?.googleDriveId);
      console.log('📥 File URL:', res.data.document?.url);
      const googleDriveId = res.data.document?.url;
      const fileUrl = res.data.document?.url || (googleDriveId ? `https://drive.google.com/uc?id=${googleDriveId}&export=download` : null);
      
      console.log('🔗 קישור לקובץ בדרייב:', fileUrl);
      
      if (!fileUrl) {
        console.error('❌ No valid file URL found in response');
        throw new Error('לא ניתן ליצור קישור לקובץ');
      }
      setFiles(prev =>
        prev.map(f =>
          f.id === fileItem.id ? { ...f, status: 'success', progress: 100, fileUrl: fileUrl } : f
        )
      );
      const uploadedFile = { 
        ...fileItem,
        status: 'success' as const,
        progress: 100,
        fileUrl: fileUrl,
        id: res.data.document.id,
        name: res.data.document.name,
        path: res.data.document.path,
        mimeType: res.data.document.mimeType,
        size: res.data.document.size,
        url: res.data.document.url,
        googleDriveId: res.data.document.googleDriveId,
        created_at: res.data.document.created_at,
        updated_at: res.data.document.updated_at
      };
      
      console.log('Calling onFilesUploaded with:', uploadedFile);
      if (onFilesUploaded) onFilesUploaded([uploadedFile]);
      console.log(`✅ Upload successful for "${fileItem.file.name}"`);
    } catch (error: any) {
      console.error(`❌ Upload failed for "${fileItem.file.name}"`, error);
      if (error.response?.status === 409) {
        const errorMessage = 'קובץ בשם זה כבר קיים בדרייב. שנה את שם הקובץ ונסה שוב.';
        setFiles(prev =>
          prev.map(f =>
            f.id === fileItem.id ? { ...f, status: 'error', errorMessage } : f
          )
        );
        showAlert('קובץ כפול', errorMessage, 'warning');
        return;
      }

      if (retryCount < 2) {
        console.log(`🔄 Retrying upload for "${fileItem.file.name}"`);
        uploadFile(fileItem, retryCount + 1);
      } else {
        let errorMessage = 'שגיאה בהעלאה';
        if (error.response?.status === 413) {
          errorMessage = 'הקובץ גדול מדי';
        } else if (error.response?.status === 403) {
          errorMessage = 'אין הרשאות או מקום בדרייב';
        } else if (error.response?.status === 429) {
          errorMessage = 'יותר מדי בקשות - נסה שוב מאוחר יותר';
        } else if (error.code === 'ECONNABORTED') {
          errorMessage = 'זמן ההעלאה פג - הקובץ גדול מדי';
        }

        setFiles(prev =>
          prev.map(f =>
            f.id === fileItem.id ? { ...f, status: 'error', errorMessage } : f
          )
        );
        showAlert(
          'שגיאה בהעלאה',
          `${errorMessage}: ${fileItem.file.name}`,
          'error'
        );
      }
    }
  };

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
      return <Image size={20} color={theme.colors.primary} />;
    if (fileType === 'application/pdf')
      return <FileText size={20} color={theme.colors.semantic.error} />;
    return <File size={20} color={theme.colors.accent} />;
  };

  // קבלת אייקון סטטוס (הצלחה/שגיאה)
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} color={theme.colors.semantic.success} strokeWidth={2} />;
      case 'error':
        return <AlertCircle size={16} color={theme.colors.semantic.error} strokeWidth={2} />;
      default:
        return null;
    }
  };

  // קבלת תגית סטטוס (צ'יפ)
  const getStatusChip = (status: string) => {
    switch (status) {
      case 'pending':
        return <Chip label="ממתין" size="small" sx={{
          backgroundColor: theme.colors.neutral[0],
          color: theme.colors.text,
          fontSize: '0.75rem',
          height: '24px'
        }} />;
      case 'uploading':
        return <Chip label="מעלה..." size="small" sx={{
          backgroundColor: theme.colors.primary,
          color: 'white',
          fontSize: '0.75rem',
          height: '24px'
        }} />;
      case 'success':
        return <Chip label="הועלה בהצלחה" size="small" sx={{
          backgroundColor: theme.colors.semantic.success,
          color: 'white',
          fontSize: '0.75rem',
          height: '24px'
        }} />;
      case 'error':
        return <Chip label="שגיאה" size="small" sx={{
          backgroundColor: theme.colors.semantic.error,
          color: 'white',
          fontSize: '0.75rem',
          height: '24px'
        }} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{
      maxWidth: '600px',
      width: '100%',
      mx: 'auto',
      p: 2,
      fontFamily: theme.typography.fontFamily.hebrew,
      direction: effectiveDir
    }}
      className={className}
      data-testid={testId}
    >
      {/* כותרת מעוצבת */}
      <Box sx={{
        textAlign: 'center',
        mb: 3,
        background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
        borderRadius: '12px',
        p: 3,
        color: 'white',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
      }}>
        <CloudUpload size={32} style={{ marginBottom: '8px' }} />
        <Typography
          variant="h5"
          sx={{
            fontSize: '1.25rem',
            fontWeight: 600,
            mb: 1,
            lineHeight: 1.3
          }}
        >
          העלאת קבצים ל-Google Drive
        </Typography>
        <Typography variant="body2" sx={{
          opacity: 0.9,
          fontSize: '0.875rem',
          lineHeight: 1.4
        }}>
          גרור קבצים או לחץ לבחירה • מקסימום {formatFileSize(MAX_FILE_SIZE)} לקובץ
        </Typography>
      </Box>

      {/* אזור גרירה מאוזן */}
      <Card sx={{
        mb: 3,
        border: isDragOver
          ? `2px dashed ${theme.colors.primary}`
          : `2px dashed ${theme.colors.neutral[1]}`,
        backgroundColor: isDragOver
          ? `${theme.colors.primary}08`
          : 'white',
        borderRadius: '12px',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        '&:hover': {
          borderColor: theme.colors.primary,
          backgroundColor: `${theme.colors.primary}05`,
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
        }
      }}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
      >
        <CardContent sx={{
          textAlign: 'center',
          width: '100%',
          py: 4,
          px: 3
        }}>
          <Box sx={{ mb: 2 }}>
            <Upload
              size={48}
              color={isDragOver ? theme.colors.primary : theme.colors.accent}
              style={{ transition: 'color 0.3s ease' }}
            />
          </Box>

          <Typography variant="h6" gutterBottom sx={{
            color: theme.colors.text,
            fontSize: '1.125rem',
            fontWeight: 600,
            mb: 1
          }}>
            גרור קבצים לכאן
          </Typography>

          <Typography variant="body1" sx={{
            color: theme.colors.accent,
            mb: 3,
            fontSize: '0.875rem',
            lineHeight: 1.5
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
          <CustomButton
            variant="primary"
            size="md"
            onClick={() => document.getElementById('file-upload')?.click()}
            style={{
              backgroundColor: theme.colors.primary,
              padding: '12px 24px',
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: '8px',
              minWidth: '200px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              margin: '0 auto'
            }}
          >
            <Upload size={16} />
            בחר קבצים מהמחשב
          </CustomButton>
        </CardContent>
      </Card>
      {/* רשימת קבצים מאוזנת */}
      {files.length > 0 && (
        <Card sx={{
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          overflow: 'hidden',
          border: `1px solid ${theme.colors.neutral[1]}`
        }}>
          <CardContent sx={{ p: 0 }}>
            {/* כותרת רשימה */}
            <Box sx={{
              p: 2.5,
              borderBottom: `1px solid ${theme.colors.neutral[1]}`,
              backgroundColor: `${theme.colors.primary}08`
            }}>
              <Typography variant="h6" sx={{
                color: theme.colors.text,
                fontSize: '1rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                📋 קבצים שנבחרו ({files.length})
              </Typography>
            </Box>

            {/* רשימת קבצים */}
            <Box sx={{ p: 2 }}>
              {files.map((fileItem, index) => (
                <Card
                  key={fileItem.id}
                  sx={{
                    mb: index === files.length - 1 ? 0 : 1.5,
                    border: `1px solid ${theme.colors.neutral[1]}`,
                    borderRadius: '8px',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      minHeight: '48px'
                    }}>
                      {/* אייקון קובץ */}
                      <Box sx={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: `${theme.colors.primary}10`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {getFileIcon(fileItem.file.type)}
                      </Box>

                      {/* תצוגה מקדימה קטנה */}
                      {fileItem.file.type.startsWith('image/') && (
                        <Box sx={{
                          width: '40px',
                          height: '40px',
                          flexShrink: 0,
                          borderRadius: '6px',
                          overflow: 'hidden',
                          border: `1px solid ${theme.colors.neutral[1]}`
                        }}>
                          <img
                            src={URL.createObjectURL(fileItem.file)}
                            alt={fileItem.file.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </Box>
                      )}

                      {/* פרטי קובץ */}
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{
                          color: theme.colors.text,
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          lineHeight: 1.3,
                          mb: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {fileItem.file.name}
                        </Typography>

                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          flexWrap: 'wrap'
                        }}>
                          <Typography variant="caption" sx={{
                            color: theme.colors.accent,
                            fontSize: '0.75rem'
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
                              mt: 1,
                              height: '4px',
                              borderRadius: '2px',
                              backgroundColor: theme.colors.neutral[1],
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: theme.colors.secondary,
                                borderRadius: '2px'
                              }
                            }}
                          />
                        )}

                        {/* הודעת שגיאה */}
                        {fileItem.status === 'error' && fileItem.errorMessage && (
                          <Typography variant="caption" sx={{
                            color: theme.colors.semantic.error,
                            fontSize: '0.75rem',
                            display: 'block',
                            mt: 0.5
                          }}>
                            {fileItem.errorMessage}
                          </Typography>
                        )}
                      </Box>

                      {/* כפתורי פעולה */}
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        flexShrink: 0
                      }}>
                        {fileItem.status === 'success' && fileItem.fileUrl && (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => window.open(fileItem.fileUrl, '_blank')}
                              sx={{
                                color: theme.colors.primary,
                                width: '32px',
                                height: '32px',
                                '&:hover': {
                                  backgroundColor: `${theme.colors.primary}15`
                                }
                              }}
                              title="פתח בדרייב"
                            >
                              <ExternalLink size={14} />
                            </IconButton>

                            <IconButton
                              size="small"
                              onClick={() => navigator.clipboard.writeText(fileItem.fileUrl!)}
                              sx={{
                                color: theme.colors.accent,
                                width: '32px',
                                height: '32px',
                                '&:hover': {
                                  backgroundColor: theme.colors.neutral[0]
                                }
                              }}
                              title="העתק קישור"
                            >
                              <Copy size={14} />
                            </IconButton>
                          </>
                        )}

                        {getStatusIcon(fileItem.status)}

                        <IconButton
                          onClick={() => removeFile(fileItem.id)}
                          size="small"
                          sx={{
                            color: theme.colors.semantic.error,
                            width: '32px',
                            height: '32px',
                            '&:hover': {
                              backgroundColor: `${theme.colors.semantic.error}15`
                            }
                          }}
                        >
                          <X size={14} />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {/* כפתור העלאה */}
            <Box sx={{
              p: 2.5,
              borderTop: `1px solid ${theme.colors.neutral[1]}`,
              backgroundColor: theme.colors.neutral[0]
            }}>
              <CustomButton
                variant="secondary"
                size="md"
                disabled={files.filter(f => f.status === 'pending' || f.status === 'error').length === 0}
                onClick={() => {
                  files.forEach(fileItem => {
                    if (fileItem.status === 'pending' || fileItem.status === 'error') {
                      uploadFile(fileItem);
                    }
                  });
                }}
                style={{
                  width: '100%',
                  height: '48px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: theme.colors.secondary,
                  color: 'white',
                  border: 'none',
                  cursor: files.filter(f => f.status === 'pending' || f.status === 'error').length === 0 ? 'not-allowed' : 'pointer',
                  opacity: files.filter(f => f.status === 'pending' || f.status === 'error').length === 0 ? 0.5 : 1
                }}
              >
                <Upload size={18} />
                העלה ל-Google Drive ({files.filter(f => f.status === 'pending' || f.status === 'error').length} קבצים)
              </CustomButton>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default FileUploader;