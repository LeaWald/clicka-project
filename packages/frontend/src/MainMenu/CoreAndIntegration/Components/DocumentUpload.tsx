import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, FormControl, InputLabel, Select, MenuItem, Alert } from '@mui/material';
import { Upload, Users, FileText, RefreshCw } from 'lucide-react';
import FileUploader from '../../../Common/Components/BaseComponents/FileUploader/FileUploader';
import axios from 'axios';
import { useTheme } from '../../../Common/Components/themeConfig';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Contract {
  id: string;
  customerId: string;
  contractNumber: string;
  status: string;
}

const DocumentUpload: React.FC = () => {
  const { theme } = useTheme();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedContract, setSelectedContract] = useState<string>('');
  const [fileType, setFileType] = useState<'חוזה' | 'חשבונית' | 'קבלה' | 'שונות'>('שונות');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer && fileType === 'חוזה') {
      fetchContracts(selectedCustomer);
    }
  }, [selectedCustomer, fileType]);

  const fetchCustomers = async () => {
    console.log('Fetching customers...');
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/customers`, {
        withCredentials: true,
        timeout: 5000
      });
      console.log('Raw response:', response);
      console.log('Response data:', response.data);
      console.log('Response data type:', typeof response.data);
      console.log('Is array:', Array.isArray(response.data));
      
      if (Array.isArray(response.data)) {
        console.log('Number of customers:', response.data.length);
        console.log('First customer:', response.data[0]);
      }
      
      setCustomers(response.data || []);
      setError('');
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      console.error('Error response:', error.response);
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        setError('השרת לא זמין - ודא שהשרת רץ');
      } else {
        setError('שגיאה בטעינת רשימת הלקוחות');
      }
    }
  };

  const fetchContracts = async (customerId: string) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/contract/customer/${customerId}`, {
        withCredentials: true,
        timeout: 5000
      });
      setContracts(response.data);
    } catch (error: any) {
      console.error('Error fetching contracts:', error);
      setContracts([]);
      if (error.code !== 'ECONNREFUSED') {
        console.warn('לא ניתן לטעון חוזים עבור לקוח זה');
      }
    }
  };

  const handleFilesUploaded = async (files: any[]) => {
    console.log('handleFilesUploaded called with:', { files, fileType, selectedCustomer });
    
    if (fileType === 'חוזה' && selectedCustomer) {
      for (const file of files) {
        try {
          console.log('Processing contract document for customer:', selectedCustomer, 'document:', file.id);
          
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/contract/customer/${selectedCustomer}/document`, {
            customerId: selectedCustomer,
            documentId: file.id
          }, {
            withCredentials: true
          });
          
          console.log('Contract create/update response:', response.data);
        } catch (error) {
          console.error('Error creating/updating contract with document:', error);
        }
      }
    } else {
      console.log('Not processing contract - fileType:', fileType, 'selectedCustomer:', selectedCustomer);
    }
  };

  const getFolderPath = () => {
    const customer = customers.find(c => c.id === selectedCustomer);
    const customerEmail = customer ? customer.email : 'לקוח לא ידוע';
    
    switch (fileType) {
      case 'חוזה':
        return `לקוחות/${customerEmail}/חוזים`;
      case 'חשבונית':
        return `לקוחות/${customerEmail}/חשבוניות`;
      case 'קבלה':
        return `לקוחות/${customerEmail}/קבלות`;
      default:
        return `לקוחות/${customerEmail}/שונות`;
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: theme.colors.neutral[0],
      p: 3,
      fontFamily: theme.typography.fontFamily.hebrew,
      direction: 'rtl'
    }}>
      <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
        <Card sx={{
          mb: 3,
          background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
          color: 'white',
          borderRadius: '12px'
        }}>
          <CardContent sx={{ textAlign: 'center', p: 3 }}>
            <Upload size={40} style={{ marginBottom: '12px' }} />
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              העלאת מסמכים
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              בחר לקוח וסוג מסמך להעלאה מאורגנת
            </Typography>
          </CardContent>
        </Card>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <button 
                onClick={fetchCustomers}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                title="נסה שוב"
              >
                <RefreshCw size={16} />
              </button>
            }
          >
            {error}
          </Alert>
        )}
        
        {customers.length === 0 && !error && (
          <Alert severity="info" sx={{ mb: 3 }}>
            אין לקוחות במערכת. יש ליצור לקוח ראשון בעמוד הלקוחות.
          </Alert>
        )}

        <Card sx={{ mb: 3, borderRadius: '12px' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ 
              mb: 3, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: theme.colors.text
            }}>
              <Users size={20} />
              פרטי העלאה
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel>בחר לקוח ({customers.length} לקוחות)</InputLabel>
                <Select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  label="בחר לקוח"
                >
                  {customers.length === 0 ? (
                    <MenuItem disabled>אין לקוחות זמינים</MenuItem>
                  ) : (
                    customers.map((customer) => (
                      <MenuItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.email}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>סוג מסמך</InputLabel>
                <Select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value as any)}
                  label="סוג מסמך"
                >
                  <MenuItem value="חוזה">חוזה</MenuItem>
                  <MenuItem value="חשבונית">חשבונית</MenuItem>
                  <MenuItem value="קבלה">קבלה</MenuItem>
                  <MenuItem value="שונות">שונות</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {fileType === 'חוזה' && selectedCustomer && (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>בחר חוזה</InputLabel>
                <Select
                  value={selectedContract}
                  onChange={(e) => setSelectedContract(e.target.value)}
                  label="בחר חוזה"
                >
                  {contracts.map((contract) => (
                    <MenuItem key={contract.id} value={contract.id}>
                      חוזה #{contract.contractNumber} - {contract.status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Box sx={{
              p: 2,
              backgroundColor: theme.colors.neutral[0],
              borderRadius: '8px',
              border: `1px solid ${theme.colors.neutral[1]}`
            }}>
              <Typography variant="body2" sx={{ 
                color: theme.colors.accent,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 1
              }}>
                <FileText size={16} />
                מיקום שמירה:
              </Typography>
              <Typography variant="body2" sx={{ 
                color: theme.colors.text,
                fontWeight: 500
              }}>
                {getFolderPath()}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {selectedCustomer ? (
          <FileUploader
            folderPath={getFolderPath()}
            category={fileType}
            customerId={selectedCustomer}
            contractId={fileType === 'חוזה' ? selectedContract : undefined}
            onFilesUploaded={handleFilesUploaded}
          />
        ) : (
          <Card sx={{ 
            borderRadius: '12px',
            border: `2px dashed ${theme.colors.neutral[1]}`,
            backgroundColor: theme.colors.neutral[0]
          }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <Users size={48} color={theme.colors.accent} style={{ marginBottom: '16px' }} />
              <Typography variant="h6" sx={{ color: theme.colors.text, mb: 1 }}>
                בחר לקוח להמשך
              </Typography>
              <Typography variant="body2" sx={{ color: theme.colors.accent }}>
                יש לבחור לקוח וסוג מסמך לפני העלאת הקבצים
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default DocumentUpload;