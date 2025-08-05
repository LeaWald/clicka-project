

import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import { Form } from '../../../../Common/Components/BaseComponents/Form';
import { InputField } from '../../../../Common/Components/BaseComponents/Input';
import { NumberInputField } from '../../../../Common/Components/BaseComponents/InputNumber';
import { SelectField } from '../../../../Common/Components/BaseComponents/Select';
import { Button } from '../../../../Common/Components/BaseComponents/Button';
import { Modal } from '../../../../Common/Components/BaseComponents/Modal';
import FileUploader from '../../../../Common/Components/BaseComponents/FileUploader';
// import { getExpenseCategories } from '../../../../';

import {
  ExpenseStatus,
  Vendor,
  VendorCategory,
  VendorStatus,
  PaymentMethod,
} from 'shared-types';


import { Trash2 } from "lucide-react";

// --------------------------------------------------
// סכימות ותרגומים
// --------------------------------------------------
const expenseSchema = z.object({
  vendorId: z.string().min(1, 'יש לבחור ספק'),
  category: z.string().min(1, 'יש לבחור קטגוריה'),
  description: z.string().min(2, 'נא להזין תיאור'),
  amount: z.coerce.number({ invalid_type_error: 'נא להזין סכום תקין' }).positive('הסכום חייב להיות חיובי'),
  date: z.string().min(1, 'נא להזין תאריך'),
  status: z.nativeEnum(ExpenseStatus, { required_error: 'יש לבחור סטטוס' }),
  is_income: z.string(),
  source_type: z.enum(['VENDOR', 'STORE']),
  purchaser_name: z.string().min(1, 'נא להזין שם הקונה'),
  reference: z.string().optional(),
  notes: z.string().optional(),
  receiptUrl: z.string().url('יש להזין קישור תקין').optional().or(z.literal('')),
});
type ExpenseFormValues = z.infer<typeof expenseSchema>;
const vendorSchema = z.object({
  name: z.string().min(2, 'יש להזין שם'),
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('כתובת לא תקינה').optional(),
  address: z.string().optional(),
  website: z.string().url('כתובת אתר לא תקינה').optional(),
  taxId: z.string().optional(),
  preferred_payment_method: z.nativeEnum(PaymentMethod).optional(),
  category: z.nativeEnum(VendorCategory).default(VendorCategory.Other),
  status: z.nativeEnum(VendorStatus).default(VendorStatus.Active),
  notes: z.string().optional(),
});
type NewVendor = z.infer<typeof vendorSchema>;

const expenseStatusLabels: Record<ExpenseStatus, string> = {
  PENDING: 'ממתין',
  APPROVED: 'מאושר',
  PAID: 'שולם',
  REJECTED: 'נדחה',
};
const vendorCategoryLabels: Record<VendorCategory, string> = {
  Equipment: 'ציוד',
  Services: 'שירותים',
  Maintenance: 'תחזוקה',
  Other: 'אחר',
};
const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: 'מזומן',
  CREDIT_CARD: 'כרטיס אשראי',
  BANK_TRANSFER: 'העברה בנקאית',
  CHECK: 'שיק',
  OTHER: 'אחר',
};
const vendorStatusLabels: Record<VendorStatus, string> = {
  Active: 'פעיל',
  Inactive: 'לא פעיל',
  Suspended: 'מושהה',
};
// --------------------------------------------------
// קומפוננטת פופאפ ליצירת הוצאה
// --------------------------------------------------
interface CreateExpenseModalProps {
  open: boolean;
  onClose: () => void;
  isPettyCash?: boolean; // האם זה מגיע מדף הקופה הקטנה
}
export const CreateExpenseModal: React.FC<CreateExpenseModalProps> = ({ open, onClose, isPettyCash = false }) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isCategoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [newVendor, setNewVendor] = useState<NewVendor>({
    name: '',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    taxId: '',
    preferred_payment_method: undefined,
    category: VendorCategory.Other,
    status: VendorStatus.Active,
    notes: '',
  });
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [pettyCashCategoryId, setPettyCashCategoryId] = useState<string>('');

  useEffect(() => {
    const fetchVendorsAndCategories = async () => {
      try {
        console.log('מתחיל לשלוף ספקים וקטגוריות...');
        
        // שליפת ספקים
        const vendorRes = await fetch(`${process.env.REACT_APP_API_BASE ?? 'http://localhost:3001'}/api/vendor/`);
        if (vendorRes.ok) {
          const vendorData = await vendorRes.json();
          setVendors(vendorData);
          console.log('ספקים נשלפו:', vendorData.length);
        } else {
          console.error('שגיאה בשליפת ספקים:', vendorRes.status);
        }
        
        const categoryRes = await fetch(`${process.env.REACT_APP_API_BASE ?? 'http://localhost:3001'}/api/expenses/categories`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!categoryRes.ok) throw new Error('Failed to fetch categories');
        const categoryJson = await categoryRes.json();
        console.log('קטגוריות נשלפו:', categoryJson);
        
        const formattedCategories = categoryJson.map((cat: any) => ({
          value: cat.id,
          label: cat.name,
        }));
        setCategories(formattedCategories);
        
        // מציאת קטגוריית קופה קטנה
        const pettyCashCategory = categoryJson.find((cat: any) => 
          cat.name === 'קופה קטנה' || 
          cat.name === 'PETTY_CASH' ||
          cat.name === 'Petty Cash'
        );
        if (pettyCashCategory) {
          setPettyCashCategoryId(pettyCashCategory.id);
        }
      } catch (error) {
        console.error('שגיאה בשליפת מידע:', error);
        alert('שגיאה בטעינת נתונים: ' + error);
      } finally {
        setLoading(false);
      }
    };

    if (open) fetchVendorsAndCategories();
  }, [open]);

  useEffect(() => {
    const handleFormChange = (e: any) => {
      if (e.target?.name === 'category') {
        setSelectedCategoryId(e.target.value);
      }
    };
    document.addEventListener('change', handleFormChange);
    return () => document.removeEventListener('change', handleFormChange);
  }, []);

 
  const handleSubmit = async (data: ExpenseFormValues) => {
    const vendor = vendors.find(v => v.id === data.vendorId);
    const payload = {
      vendor_id: data.vendorId,
      vendor_name: vendor?.name ?? '',
      category_id: (isPettyCash && pettyCashCategoryId) ? pettyCashCategoryId : data.category,
      description: data.description,
      amount: data.amount,
      date: data.date,
      status: data.status,
      // שדות חדשים
      is_income: data.is_income === 'true',
      source_type: data.source_type,
      purchaser_name: data.purchaser_name,
      reference: data.reference ?? null,
      notes: data.notes ?? null,
      receipt_file: data.receiptUrl ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE ?? 'http://localhost:3001'}/api/expenses/createExpense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await response.text());
      alert('ההוצאה נשמרה בהצלחה!');
      onClose(); // סגירת הפופאפ אחרי הצלחה
    } catch (error: any) {
      alert('שגיאה בשמירת ההוצאה: ' + (error.message || error));
    }
  };


  
  const handleDeleteCategory = async (categoryId: string) => {
    const confirmDelete = window.confirm('האם אתה בטוח שברצונך למחוק את הקטגוריה?');
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE ?? 'http://localhost:3001'}/api/expenses/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error(await res.text());

      setCategories(prev => prev.filter(cat => cat.value !== categoryId));
      setSelectedCategoryId('');
      alert('הקטגוריה נמחקה בהצלחה');
    } catch (err: any) {
      alert('שגיאה במחיקת הקטגוריה: ' + err.message);
    }
  };

  if (!open || loading) return null;

  return (
    <Modal open={open} onClose={onClose} title="יצירת הוצאה">
      <Form schema={expenseSchema} onSubmit={handleSubmit}>
        <div className="flex gap-2 items-end">
          <SelectField
            name="vendorId"
            label="בחר ספק"
            required
            options={vendors.map(v => ({ value: v.id, label: v.name }))}
          />
          <Button 
            type="button" 
            onClick={() => setDialogOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2 whitespace-nowrap"
          >
            <span>+</span>
            הוסף ספק
          </Button>
        </div>
<div className="flex gap-2 items-end">
  <div className="flex flex-col gap-2 w-full">
    <SelectField
      name="category"
      label="קטגוריה"
      required
      options={categories}
      defaultValue={isPettyCash ? pettyCashCategoryId : undefined}
    />
    {selectedCategoryId && (
      <button
        type="button"
        onClick={() => handleDeleteCategory(selectedCategoryId)}
        className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm mt-1"
      >
        <Trash2 size={14} />
        מחק קטגוריה
      </button>
    )}
  </div>
  <Button 
    type="button" 
    onClick={() => setCategoryDialogOpen(true)}
    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2 whitespace-nowrap"
  >
    <span>+</span>
    הוסף קטגוריה
  </Button>
</div>
        <InputField name="description" label="תיאור" required />
        <NumberInputField name="amount" label="סכום" required />
        <InputField name="date" label="תאריך" type="date" required />
        
        <SelectField
          name="is_income"
          label="סוג הפעולה"
          required
          options={[
            { value: 'false', label: 'הוצאה' },
            { value: 'true', label: 'הכנסה' }
          ]}
        />
        <SelectField
          name="source_type"
          label="מקור"
          required
          options={[
            { value: 'STORE', label: 'חנות' },
            { value: 'VENDOR', label: 'ספק' }
          ]}
        />
        <InputField name="purchaser_name" label="שם הקונה" required />
        
        <SelectField
          name="status"
          label="סטטוס"
          required
          options={Object.values(ExpenseStatus).map(val => ({ value: val, label: expenseStatusLabels[val] }))}
        />
        <InputField name="reference" label="אסמכתא" />
        <FileUploader onFilesUploaded={files => {
          const url = `https://drive.google.com/file/d/${files[0].id}`;
          const event = new CustomEvent('setFieldValue', { detail: { name: 'receiptUrl', value: url } });
          window.dispatchEvent(event);
        }} />
        <InputField name="receiptUrl" label="קישור לקבלה" />
        <InputField name="notes" label="הערות" />
        <Button type="submit">שמור הוצאה</Button>
      </Form>
      {/* דיאלוג פנימי להוספת ספק – עדיין לא ממודאל, נטפל בזה בהמשך */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded p-4 w-full max-w-md shadow">
            <h2 className="text-xl font-bold mb-4">הוספת ספק חדש</h2>
            <div className="grid gap-3">
              <input className="input" placeholder="שם" value={newVendor.name} onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })} />
              <input className="input" placeholder="איש קשר" value={newVendor.contact_name} onChange={(e) => setNewVendor({ ...newVendor, contact_name: e.target.value })} />
              <input className="input" placeholder="טלפון" value={newVendor.phone} onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })} />
              <input className="input" placeholder="אימייל" value={newVendor.email} onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })} />
              <input className="input" placeholder="כתובת" value={newVendor.address} onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })} />
              <input className="input" placeholder="אתר" value={newVendor.website} onChange={(e) => setNewVendor({ ...newVendor, website: e.target.value })} />
              <input className="input" placeholder="ח.פ / עוסק" value={newVendor.taxId} onChange={(e) => setNewVendor({ ...newVendor, taxId: e.target.value })} />
              <select className="input" value={newVendor.preferred_payment_method ?? ''} onChange={(e) => setNewVendor({ ...newVendor, preferred_payment_method: e.target.value as PaymentMethod })}>
                <option value="">בחר שיטת תשלום</option>
                {Object.values(PaymentMethod).map(val => (
                  <option key={val} value={val}>{paymentMethodLabels[val]}</option>
                ))}
              </select>
              <select className="input" value={newVendor.category} onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value as VendorCategory })}>
                {Object.values(VendorCategory).map(val => (
                  <option key={val} value={val}>{vendorCategoryLabels[val]}</option>
                ))}
              </select>
              <select className="input" value={newVendor.status} onChange={(e) => setNewVendor({ ...newVendor, status: e.target.value as VendorStatus })}>
                {Object.values(VendorStatus).map(val => (
                  <option key={val} value={val}>{vendorStatusLabels[val]}</option>
                ))}
              </select>
              <input className="input" placeholder="הערות" value={newVendor.notes} onChange={(e) => setNewVendor({ ...newVendor, notes: e.target.value })} />
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="secondary" onClick={() => setDialogOpen(false)}>ביטול</Button>
                <Button type="button" onClick={async () => {
                  try {
                    vendorSchema.parse(newVendor);
                    const vendorToSave = {
                      name: newVendor.name,
                      category: newVendor.category,
                      phone: newVendor.phone ?? '',
                      email: newVendor.email ?? '',
                      address: newVendor.address ?? '',
                    };
                    const response = await fetch(`${process.env.REACT_APP_API_BASE ?? 'http://localhost:3001'}/api/vendor/`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(vendorToSave),
                    });
                    if (!response.ok) throw new Error(await response.text());
                    const savedVendor = await response.json();
                    setVendors(prev => [...prev, savedVendor]);
                    setDialogOpen(false);
                    setNewVendor({
                      name: '',
                      contact_name: '',
                      phone: '',
                      email: '',
                      address: '',
                      website: '',
                      taxId: '',
                      preferred_payment_method: undefined,
                      category: VendorCategory.Other,
                      status: VendorStatus.Active,
                      notes: '',
                    });
                  } catch (error: any) {
                    alert('שגיאה בהוספת ספק: ' + error.message);
                  }
                }}>שמור ספק</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isCategoryDialogOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white rounded p-4 w-full max-w-sm shadow">
      <h2 className="text-xl font-bold mb-4">הוספת קטגוריה חדשה</h2>
      <input
        className="input w-full"
        placeholder="שם קטגוריה"
        value={newCategoryName}
        onChange={(e) => setNewCategoryName(e.target.value)}
      />
      {categoryError && <p className="text-red-600 text-sm mt-1">{categoryError}</p>}
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="secondary" onClick={() => setCategoryDialogOpen(false)}>ביטול</Button>
        <Button type="button" onClick={async () => {
          setCategoryError('');
          if (!newCategoryName.trim()) {
            setCategoryError('נא להזין שם קטגוריה');
            return;
          }
          try {
            console.log('שולח בקשה ליצירת קטגוריה:', newCategoryName);
            const res = await fetch(`${process.env.REACT_APP_API_BASE ?? 'http://localhost:3001'}/api/expenses/createCategories`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ name: newCategoryName }),
            });
            if (!res.ok) throw new Error(await res.text());
            const saved = await res.json();
            console.log('קטגוריה נשמרה:', saved);

            setCategories(prev => [...prev, { value: saved.id, label: saved.name }]);
            setCategoryDialogOpen(false);
            setNewCategoryName('');
          } catch (err: any) {
            setCategoryError('שגיאה בהוספת קטגוריה: ' + err.message);
            console.error('שגיאה מלאה:', err);
          }
        }}>
          שמור קטגוריה
        </Button>
      </div>
    </div>
  </div>
)}

    </Modal>
  );
};