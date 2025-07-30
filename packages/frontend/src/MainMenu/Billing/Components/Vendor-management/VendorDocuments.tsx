import { useRef, useState, useEffect } from 'react';
import { SelectField } from '../../../../Common/Components/BaseComponents/Select';
import { useForm, FormProvider } from 'react-hook-form';
import { DocumentType } from 'shared-types';
import { Button } from '../../../../Common/Components/BaseComponents/Button';
import axiosInstance from '../../../../Service/Axios';

interface BackendDocument {
  id: string;
  name: string;
  path: string;
  mime_type: string;
  size: number;
  url: string;
  google_drive_id: string;
  created_at: string;
  updated_at: string;
  type?: string;
}

type FormValues = {
  documentType: DocumentType;
};

type VendorDocumentsProps = {
  vendorId: string;
};

export default function VendorDocuments({ vendorId }: VendorDocumentsProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [documents, setDocuments] = useState<BackendDocument[]>([]);
  const methods = useForm<FormValues>({
    defaultValues: { documentType: DocumentType.INVOICE },
  });
  const fileInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const res = await axiosInstance.get(`/document/vendor/${vendorId}`);
        const raw: any[] = res.data;

        const data: BackendDocument[] = raw.map(d => ({
          id:             d.id ?? d.document_id,
          name:           d.name,
          path:           d.path,
          mime_type:      d.mime_type,
          size:           d.size,
          url:            d.url,
          google_drive_id:d.google_drive_id,
          created_at:     d.created_at,
          updated_at:     d.updated_at,
          type:           d.type,
        }));

        setDocuments(data);
      } catch (error) {
        console.error('Error fetching documents:', error);
        setMessage('שגיאה בטעינת המסמכים');
        setTimeout(() => setMessage(null), 4000);
      }
    }

    fetchDocuments();
  }, [vendorId]);

  const uploadDocument = async () => {
    const docType = methods.getValues('documentType');
    const file = fileInput.current?.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('vendor_id', vendorId);
      formData.append('name', file.name);
      formData.append('type', docType);
      formData.append('file', file);

      const res = await axiosInstance.post('/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newDoc: BackendDocument = res.data;
      setDocuments((docs) => [...docs, newDoc]);
      setMessage('המסמך נוסף בהצלחה!');
      if (fileInput.current) fileInput.current.value = '';
    } catch (error) {
      console.error('Error uploading document:', error);
      setMessage('שגיאה בהעלאת המסמך');
    }

    setTimeout(() => setMessage(null), 4000);
  };

  const deleteDocument = async (docId: string) => {
    try {
      await axiosInstance.delete(`/document/${docId}`);
      setDocuments((docs) => docs.filter((d) => d.id !== docId));
      setMessage('המסמך נמחק!');
    } catch (error) {
      console.error('Error deleting document:', error);
      setMessage('שגיאה במחיקת המסמך');
    }

    setTimeout(() => setMessage(null), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto p-4" dir="rtl">
      <h3 className="text-xl font-semibold mb-4">מסמכים</h3>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(() => {})} className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
            <SelectField
              name="documentType"
              label="סוג מסמך"
              options={[
                { value: DocumentType.INVOICE, label: 'חשבונית' },
                { value: DocumentType.RECEIPT, label: 'קבלה' },
                { value: DocumentType.CREDIT_NOTE, label: 'זיכוי' },
                { value: DocumentType.STATEMENT, label: 'דוח' },
                { value: DocumentType.TAX_INVOICE, label: 'חשבונית מס' },
              ]}
            />

            <input
              type="file"
              ref={fileInput}
              className="border p-1 rounded"
              aria-label="בחר קובץ להעלאה"
            />

            <Button variant="primary" onClick={uploadDocument} className="mt-2 sm:mt-0">
              העלה מסמך
            </Button>
          </div>
        </form>
      </FormProvider>

      {message && <div className="mb-4 text-green-600">{message}</div>}

      <ul className="space-y-2">
        {documents.length === 0 && <div className="text-gray-500">אין מסמכים</div>}

        {documents.map((doc) => (
          <li key={doc.id} className="flex items-center justify-between border p-3 rounded shadow-sm">
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {doc.name}
            </a>

            <div className="text-sm text-gray-600 ml-4 whitespace-nowrap">
              <span>({doc.type})</span> | <span>{Math.round(doc.size / 1024)} KB</span> |{' '}
              <span>{new Date(doc.created_at).toLocaleDateString()}</span>
            </div>

            <Button variant="accent" size="sm" onClick={() => deleteDocument(doc.id)} className="ml-4">
              מחק
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}