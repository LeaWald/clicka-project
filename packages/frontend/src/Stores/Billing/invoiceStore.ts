import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  CreateInvoiceRequest,
  Invoice,
  //   InvoiceItem,
} from 'shared-types';
import { InvoiceStatus } from 'shared-types';
import { UUID } from 'crypto';
import axiosInstance from '../../Service/Axios';
type CustomerCollection = {
  name: string;
  email: string;
  business_name: string;
  customer_payment_method: {
    credit_card_holder_id_number: string;
    credit_card_expiry: string;
    credit_card_holder_phone: string;
    credit_card_number: string;
  }[];
  invoice: {
    subtotal: number;
    issue_date: string;
  }[];
};
interface InvoiceState {
  //  STATE
  invoices: Invoice[];
  collection: CustomerCollection[];
  loading: boolean;
  error: string | null;
  //  פעולות בסיסיות
  fetchInvoices: () => Promise<void>;
  getAllInvoices: () => Promise<void>;
  getAllInvoiceItems: (invoiceId: UUID) => Promise<void>;
  getCustomersCollection: () => Promise<void>;
  createInvoice: (invoice: CreateInvoiceRequest) => Promise<Invoice>;
  updateInvoice: (invoiceNumber: string, updates: Partial<Invoice>) => Promise<Invoice>; // שינוי מ-id ל-invoiceNumber
  deleteInvoice: (invoiceNumber: string) => Promise<void>; // שינוי מ-id ל-invoiceNumber
  // פעולות מתקדמות
  generateMonthlyInvoices: () => Promise<Invoice[]>;
  updateInvoiceStatus: (invoiceNumber: string, status: InvoiceStatus) => Promise<Invoice>; // שינוי מ-id ל-invoiceNumber
  sendInvoiceByEmail: (invoiceNumber: string, email: string) => Promise<void>; // שינוי מ-invoiceId ל-invoiceNumber
  //  חישובים ושאילתות
  getOverdueInvoices: () => Invoice[];
  getInvoicesByStatus: (status: InvoiceStatus) => Invoice[];
  calculateOpenInvoicesTotal: () => number;
  //  עזר
  clearError: () => void;
}
export const useInvoiceStore = create<InvoiceState>()(
  devtools(
    persist(
      (set, get) => ({
        //מצב התחלתי
        invoices: [],
        loading: false,
        error: null,
        // שליפת כל החשבוניות מהשרת
        fetchInvoices: async () => {
          set({ loading: true, error: null });
          set({
            invoices: [
              {
                id: '1',
                invoice_number: '1001',
                customer_id: 'c1',
                customer_name: 'לקוח א',
                status: InvoiceStatus.ISSUED,
                issue_date: '2024-06-01',
                due_date: '2024-06-30',
                items: [],
                subtotal: 100,
                tax_total: 17,
                created_at: '2024-06-01',
                updated_at: '2024-06-01'
              }
            ],
            loading: false
          });
        },
        getAllInvoices: async () => {
          set({ loading: true, error: null });
          try {
            const response = await axiosInstance.get('/invoices');
            const invoicesData = Array.isArray(response.data.invoices) ? response.data.invoices : [];
            const processedInvoices = invoicesData.map((invoice: any) => {
              return {
                ...invoice,
                items: invoice.items || invoice.invoice_item || []
              };
            });
            set({ invoices: processedInvoices, loading: false });
          } catch (error) {
            console.error(' שגיאה בשליפת חשבוניות:', error);
            set({
              error: 'Error fetching invoices',
              loading: false,
              invoices: []
            });
            throw error;
          }
        },
        getAllInvoiceItems: async (invoiceId) => {
          try {
            const response = await axiosInstance.get(`/invoices/${invoiceId}/items`);
            return response.data;
          } catch (error) {
            console.error('Error fetching invoice items:', error);
            throw error;
          }
        },
        collection: [],
        getCustomersCollection: async () => {
          set({ loading: true, error: null });
          try {
            const response = await axiosInstance.get('/invoices/getCustomersCollection');
            const collectionData = Array.isArray(response.data.collectionDetails) ? response.data.collectionDetails : [];
            set({ collection: collectionData, loading: false });
            const processedCollection = collectionData.map((item: any) => {
              return {
                ...item,
                items: item.items || item.invoice_item || []
              };
            });
            set({ collection: processedCollection, loading: false });
          } catch (error) {
            set({
              error: 'Error fetching collection details',
              loading: false,
              collection: []
            });
            throw error;
          }
        },
        // יצירת חשבונית חדשה
        createInvoice: async (newInvoice) => {
          set({ loading: true, error: null });
          try {
            const response = await axiosInstance.post('/invoices', newInvoice);
            set((state) => ({
              invoices: Array.isArray(state.invoices) ? [...state.invoices, response.data] : [response.data],
              loading: false
            }));
            return response.data;
          } catch (error) {
            set({ error: 'Error creating invoice', loading: false });
            console.error('Error creating invoice:', error);
            throw error;
          }
        },
        // עדכון חשבונית קיימת
        updateInvoice: async (invoiceId, updates) => {
          try {
            const response = await axiosInstance.put(`/invoices/${invoiceId}`, updates);
            set((state) => ({
              invoices: state.invoices.map(invoice =>
                invoice.id === invoiceId ? { ...invoice, ...response.data.invoice } : invoice
              )
            }));
            return response.data.invoice;
          } catch (error: any) {
            console.error('Store - Error updating invoice:', error);
            console.error('Store - Error response:', error.response?.data);
            set({ error: 'Error updating invoice' });
            throw error;
          }
        },
        // מחיקת חשבונית
        deleteInvoice: async (id) => {
          try {
            await axiosInstance.delete(`/invoices/${id}`);
            set((state) => {
              const filteredInvoices = state.invoices.filter(invoice => {
                return invoice.id !== id;
              });
              return {
                invoices: filteredInvoices
              };
            });
          } catch (error: any) {
            throw error;
          }
        },
        // יצירת חשבוניות חודשיות אוטומטית לכל הלקוחות
        generateMonthlyInvoices: async () => {
          set({ loading: true, error: null });
          try {
            const response = await axiosInstance.post('/invoices/generateMonthly');
            set({ invoices: response.data, loading: false });
            return response.data;
          } catch (error) {
            set({ error: 'Error generating monthly invoices', loading: false });
            console.error('Error generating monthly invoices:', error);
            throw error;
          }
        },
        // שינוי סטטוס חשבונית (שולח, שולם, בוטל וכו')
        updateInvoiceStatus: async (id, status) => {
          return get().updateInvoice(id, {});
        },
        // שליחת חשבונית למייל הלקוח
        sendInvoiceByEmail: async (invoiceId, email) => {
          try {
            await axiosInstance.post(`/invoices/${invoiceId}/send`, { email });
            await get().updateInvoiceStatus(invoiceId, InvoiceStatus.DRAFT);
          } catch (error) {
            set({ error: 'Error sending invoice by email' });
            console.error('Error sending invoice by email:', error);
            throw error;
          }
        },
        // קבלת חשבוניות באיחור (עברו את תאריך התשלום)
        getOverdueInvoices: () => {
          const { invoices } = get();
          const today = new Date().toISOString().split('T')[0];
          return invoices.filter(invoice =>
            invoice.status !== InvoiceStatus.PAID &&
            invoice.status !== InvoiceStatus.DRAFT &&
            invoice.due_date < today
          );
        },
        // קבלת חשבוניות לפי סטטוס (טיוטה, נשלח, שולם וכו')
        getInvoicesByStatus: (status) => {
          const { invoices } = get();
          return invoices.filter(invoice => invoice.status === status);
        },
        // חישוב סה"כ חשבוניות פתוחות (שטרם שולמו)
        calculateOpenInvoicesTotal: () => {
          const { invoices } = get();
          return invoices
            .filter(invoice =>
              invoice.status !== InvoiceStatus.PAID &&
              invoice.status !== InvoiceStatus.DRAFT
            )
            .reduce((total, invoice) => total + invoice.subtotal, 0);
        },
        // ניקוי הודעת שגיאה
        clearError: () => {
          set({ error: null });
        }
      }),
      {
        name: 'invoice-store', // שם לשמירה ב-localStorage
        partialize: (state) => ({ invoices: state.invoices }) // שומר רק את החשבוניות
      }
    ),
    { name: 'invoice-store' } // שם ב-DevTools
  )
);