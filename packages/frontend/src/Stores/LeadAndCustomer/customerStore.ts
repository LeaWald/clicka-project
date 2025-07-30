import { CreateCustomerRequest, Customer, CustomerPaymentMethod, CustomerStatus, RecordExitNoticeRequest, StatusChangeRequest } from 'shared-types'; // עדכן את הנתיב אם צריך
import { create } from 'zustand';
interface CustomerStore {
    customersPage: Customer[]; //כל פעם גם משתנה זה מתעדכן עם הלקוחות של העמוד הזה כדי שבחיפוש יחפשו מתוך הרשימה הזו
    customers: Customer[]; // הנתונים בהם אני משתמשת -  מכיל את הלקוחות של העמוד הזה ואם יש חיפוש את המסונן
    selectedCustomer: Customer | null;
    loading: boolean;
    error?: string;
    currentPage: number;
    limit: number;
    searchCache: Record<string, Customer[]>;
    fetchNextPage: () => Promise<void>;
    fetchPrevPage: () => Promise<void>;
    fetchCustomers: () => Promise<void>;
    fetchCustomersByPage: () => Promise<void>;
    searchCustomersByText: (searchTerm: string) => Promise<void>;
    searchCustomersInPage: (searchTerm: string) => Promise<void>;
    fetchCustomerById: (id: string) => Promise<Customer | null>;
    createCustomer: (customer: CreateCustomerRequest) => Promise<Customer | undefined>;
    updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
    deleteCustomer: (id: string) => Promise<void>;
    resetSelectedCustomer: () => void;
    recordExitNotice: (id: string, data: RecordExitNoticeRequest) => Promise<void>;
    getCustomerPaymentMethods: (id: string) => Promise<CustomerPaymentMethod[]>;
    changeCustomerStatus: (id: string, statusChangeData: StatusChangeRequest) => Promise<void>;
    clearSearchCache: () => void;
    // --- תוספות להעלאת קובץ אקסל ---
    uploadFile: File | null;
    uploadStatus: "idle" | "uploading" | "success" | "error";
    uploadMessage: string;
    setUploadFile: (file: File | null) => void;
    uploadExcelFile: () => Promise<void>;
}
const BASE_API_URL = `${process.env.REACT_APP_API_URL}/customers`;
export const useCustomerStore = create<CustomerStore>((set, get) => ({
    customersPage: [],
    customers: [],
    selectedCustomer: null,
    currentPage: 1,
    limit: 20, // מספר הלקוחות לעמוד
    loading: false,
    error: undefined,
    searchCache: {},
    // --- סטייטים לתוספות העלאת קובץ אקסל ---
    uploadFile: null,
    uploadStatus: "idle",
    uploadMessage: "",
    clearSearchCache: () => {
        set({ searchCache: {} });
    },
    fetchCustomers: async () => {
        set({ loading: true, error: undefined });
        try {
            const response = await fetch(BASE_API_URL);
            if (!response.ok) {
                throw new Error("Failed to fetch customers");
            }
            const data: Customer[] = await response.json();
            set({ customers: data, loading: false });
        } catch (error: any) {
            set({ error: error.message || "שגיאה בטעינת הלקוחות", loading: false });
        }
    },
    fetchCustomersByPage: async () => {
        set({ loading: true, error: undefined });
        try {
            const response = await fetch(`${BASE_API_URL}/page?page=${useCustomerStore.getState().currentPage}&limit=${useCustomerStore.getState().limit}`);
            if (!response.ok) {
                throw new Error("Failed to fetch customers by page");
            }
            const data: Customer[] = await response.json();
            set({ customers: data, customersPage: data, loading: false });
        } catch (error: any) {
            set({ error: error.message || "שגיאה בטעינת הלקוחות בעמוד", loading: false });
        }
    },
    fetchNextPage: async () => {
        set({ currentPage: useCustomerStore.getState().currentPage + 1 });
        try {
            await useCustomerStore.getState().fetchCustomersByPage();
        } catch (error: any) {
            set({ error: error.message || "שגיאה בטעינת העמוד הבא", loading: false });
        }
    },
    fetchPrevPage: async () => {
        set({ currentPage: useCustomerStore.getState().currentPage - 1 });
        try {
            await useCustomerStore.getState().fetchCustomersByPage();
        } catch (error: any) {
            set({ error: error.message || "שגיאה בטעינת העמוד הקודם", loading: false });
        }
    },
    searchCustomersByText: async (searchTerm: string) => {
        set({ loading: true, error: undefined });
        const normalizedTerm = searchTerm.trim().toLowerCase();
        const cache = get().searchCache;
        if (cache[normalizedTerm]) {
            set({ customers: cache[normalizedTerm], loading: false });
            console.log(":large_yellow_circle: חיפוש מהמטמון:", normalizedTerm);
            return;
        }
        try {
            const response = await fetch(`${BASE_API_URL}/search?text=${normalizedTerm}`);
            if (!response.ok) throw new Error("Failed to search customers");
            const data: Customer[] = await response.json();
            set((state) => ({
                customers: data,
                searchCache: { ...state.searchCache, [normalizedTerm]: data },
                loading: false,
            }))
            console.log(":large_blue_circle: חיפוש מהשרת:", normalizedTerm);
        } catch (error: any) {
            set({ error: error.message || "שגיאה בחיפוש לקוחות", loading: false });
        }
    },
    searchCustomersInPage: async (searchTerm: string) => {
        set({ loading: true, error: undefined });
        try {
            if (!searchTerm.trim()) {
                // אם ריק, מחזירים לתצוגה רגילה
                await useCustomerStore.getState().fetchCustomersByPage();
                return;
            }
            const lower = searchTerm.toLowerCase();
            const filtered = useCustomerStore.getState().customersPage.filter(
                (c) =>
                    c.name.toLowerCase().includes(lower) ||
                    c.phone.toLowerCase().includes(lower) ||
                    c.email?.toLowerCase().includes(lower) ||
                    c.businessName?.toLowerCase().includes(lower) ||
                    c.businessType?.toLowerCase().includes(lower) ||
                    statusLabels[c.status].toLowerCase().includes(lower)
            );
            set({ customers: filtered, loading: false });
        }
        catch (error: any) {
            set({ error: error.message || "שגיאה בחיפוש לקוחות", loading: false });
        }
    },

    fetchCustomerById: async (id: string) => {
        set({ loading: true, error: undefined });
        try {
            const response = await fetch(`${BASE_API_URL}/${id}`);
            if (!response.ok) {
                throw new Error("Failed to fetch customer by ID");
            }
            const data: Customer = await response.json();
            set({ selectedCustomer: data, loading: false });
            return data;
        } catch (error: any) {
            set({ error: error.message || "שגיאה בטעינת לקוח לפי מזהה", loading: false });
            return null;
        }
    },
    createCustomer: async (customer: CreateCustomerRequest) => {
        set({ loading: true, error: undefined });
        try {
            const response = await fetch(`${BASE_API_URL}/post-customer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(customer),
            });
            if (!response.ok) {
                let errorMsg = "Failed to create customer";
                try {
                    const errorBody = await response.json();
                    errorMsg = errorBody?.error?.details || errorBody?.error?.message || errorBody?.message || errorMsg;
                } catch (e) { }
                console.log(errorMsg);
                throw new Error(errorMsg);
            }
            const newCustomer: Customer = await response.json();
            try {
                await useCustomerStore.getState().fetchCustomersByPage();
            }
            catch (error: any) {
                console.error("Error fetching customers after creation:", error);
                set({ error: "שגיאה בעדכון הלקוחות לאחר יצירת לקוח", loading: false });
            }
            return newCustomer;
        } catch (error: any) {
            set({ error: error.message || "שגיאה ביצירת לקוח", loading: false });
            console.log(error)
            return undefined;
        } finally {
            set({ loading: false });
        }
    },
    updateCustomer: async (id: string, customer: Partial<Customer>) => {
        console.log("עדכון לקוח עם מזהה:", id, "פרטי הלקוח:", customer);
        set({ loading: true, error: undefined });
        try {
            const response = await fetch(`${BASE_API_URL}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(customer),
            });
            if (!response.ok) {
                // ננסה לקרוא את גוף התשובה (אם יש)
                let errorMsg = "Failed to update customer";
                try {
                    const errorBody = await response.json();
                    // נניח שהשרת מחזיר error.details או error.message
                    errorMsg = errorBody?.error?.details || errorBody?.error?.message || errorBody?.message || errorMsg;
                } catch (e) {
                    // אם לא הצלחנו לקרוא json, נשאיר את הודעת ברירת המחדל
                }
                throw new Error(errorMsg);
            }
            await useCustomerStore.getState().fetchCustomersByPage(); // עדכן את הלקוחות
            get().clearSearchCache();
        } catch (error: any) {
            set({ error: error.message || "שגיאה בעדכון לקוח", loading: false });
        } finally {
            set({ loading: false });
        }
    },
    deleteCustomer: async (id: string) => {
        set({ loading: true, error: undefined });
        try {
            const response = await fetch(`${BASE_API_URL}/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error("Failed to delete customer");
            }
            // await useCustomerStore.getState().fetchCustomers(); // עדכן את הלקוחות
            await useCustomerStore.getState().fetchCustomersByPage(); // עדכן את הלקוחות
            get().clearSearchCache();
        } catch (error: any) {
            set({ error: error.message || "שגיאה במחיקת לקוח", loading: false });
        } finally {
            set({ loading: false });
        }
    },

    recordExitNotice: async (id: string, data: RecordExitNoticeRequest): Promise<void> => {
        set({ loading: true, error: undefined });
        try {
            const response = await fetch(`${BASE_API_URL}/${id}/exit-notice`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                let errorMsg = "Failed to record exit notice";
                try {
                    const errorBody = await response.json();
                    errorMsg = errorBody?.error?.details || errorBody?.error?.message || errorBody?.message || errorMsg;
                } catch (e) { }
                throw new Error(errorMsg);
            }
            // עדכן את הלקוחות אחרי שינוי
            await useCustomerStore.getState().fetchCustomersByPage();
            get().clearSearchCache();
        } catch (error: any) {
            set({ error: error.message || "שגיאה ברישום הודעת עזיבה", loading: false });
            throw error;
        } finally {
            set({ loading: false });
        }
    },
    resetSelectedCustomer: () => {
        set({ selectedCustomer: null });
    },
    getCustomerPaymentMethods: async (id: string) => {
        set({ loading: true, error: undefined });
        try {
            const response = await fetch(`${BASE_API_URL}/${id}/payment-methods`);
            if (!response.ok) {
                throw new Error("Failed to fetch customer payment methods");
            }
            const data = await response.json();
            console.log("שיטות תשלום שהתקבלו :", data);
            return data;
        } catch (error: any) {
            set({ error: error.message || "שגיאה בקבלת אמצעי תשלום ללקוח", loading: false });
            return [];
        } finally {
            set({ loading: false });
        }
    },
    changeCustomerStatus: async (id: string, statusChangeData: StatusChangeRequest) => {
        set({ loading: true, error: undefined });
        try {
            const response = await fetch(`${BASE_API_URL}/${id}/status-change`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(statusChangeData),
            });
            console.log("Changing customer status in store:", id, statusChangeData);
            if (!response.ok) {
                let errorMsg = "Failed to change customer status";
                try {
                    const errorBody = await response.json();
                    errorMsg = errorBody?.error?.details || errorBody?.error?.message || errorBody?.message || errorMsg;
                } catch (e) { }
                throw new Error(errorMsg);
            }
            // עדכן את הלקוחות אחרי שינוי
            await useCustomerStore.getState().fetchCustomersByPage();
        } catch (error: any) {
            set({ error: error.message || "שגיאה בשינוי סטטוס לקוח", loading: false });
            console.log("Error changing customer status in store:", error);
            throw error;
        } finally {
            set({ loading: false });
        }
    },
    //--- תוספות להעלאת קובץ אקסל ---
    setUploadFile: (file: File | null) => {
        set({
            uploadFile: file,
            uploadStatus: "idle",
            uploadMessage: "",
        });
    },
    uploadExcelFile: async () => {
        const file = get().uploadFile;
        if (!file) {
            set({ uploadStatus: "error", uploadMessage: "אין קובץ להעלאה" });
            return;
        }
        set({ uploadStatus: "uploading", uploadMessage: "מעלה את הקובץ..." });
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch(`${BASE_API_URL}/upload/excel`, {
                method: "POST",
                body: formData,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                set({
                    uploadStatus: "error",
                    uploadMessage: err.message || "שגיאה בהעלאת הקובץ",
                });
                return;
            }
            const data = await res.json();
            set({
                uploadStatus: "success",
                uploadMessage: data.message || "הקובץ הועלה בהצלחה",
            });
            // ריענון רשימת הלידים לאחר ההעלאה
            await get().fetchCustomers();
        } catch (error: any) {
            set({
                uploadStatus: "error",
                uploadMessage: error.message || "שגיאה לא צפויה בהעלאת הקובץ",
            });
        }
    },
}));
const statusLabels: Record<CustomerStatus, string> = {
    ACTIVE: "פעיל",
    NOTICE_GIVEN: "הודעת עזיבה",
    EXITED: "עזב",
    PENDING: "בהמתנה",
    CREATED: "נוצר"
};