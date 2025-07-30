import { Contract} from "shared-types";
import { create } from "zustand";

interface ContractStore {
    contracts: Contract[];
    contractsByCustomer: Contract[];
    selectedContract: Contract | null;
    loading: boolean;
    error?: string;
    showGraphForId: string | null;

    fetchContracts: () => Promise<void>;
    fetchContractDetails: (contractId: string) => Promise<Contract | null>;
    fetchContractsByCustomerId: (customerId: string) => Promise<void>;
    fetchContractsEndingSoon: (days: number) => Promise<void>;

    handleCreateContract: (contract: Partial<Contract>) => Promise<void>;
    handleUpdateContract: (contractId: string, contract: Partial<Contract>) => Promise<void>;
    handleDeleteContract: (contractId: string) => Promise<void>;
    handleUploadDocuments: (formData: FormData) => Promise<void>;

    handleSelectContract: (contractId: string | null) => void;
    resetSelectedContract: () => void;
    setShowGraphForId: (id: string | null) => void;
    // uploadFileAndReturnReference: (file: Express.Multer.File, folderPath: string) => Promise<FileReference>;
    // postContractDocument: (documentToAdd: FileReference, contractId: ID) => Promise<void>;
    // handleUploadFileToContract: (file: File, contractId: string, folderPath: string) => Promise<void>;
}

const BASE_API_URL = `${process.env.REACT_APP_API_URL}/contract`;

export const useContractStore = create<ContractStore>((set, get) => ({
    contracts: [],
    contractsByCustomer: [],
    selectedContract: null,
    loading: false,
    error: undefined,
    showGraphForId: null,

    fetchContracts: async () => {
        set({ loading: true, error: undefined });
        try {
            const response = await fetch(`${BASE_API_URL}`);
            if (!response.ok) throw new Error("Failed to fetch contracts");
            const data: Contract[] = await response.json();
            set({ contracts: data });
        } catch (error: any) {
            set({ error: error.message || "שגיאה בטעינת החוזים" });
        } finally {
            set({ loading: false });
        }
    },

    fetchContractDetails: async (contractId: string) => {
        set({ loading: true, error: undefined });
        try {
            const response = await fetch(`${BASE_API_URL}/${contractId}`);
            if (!response.ok) throw new Error("Failed to fetch contract");
            const data: Contract = await response.json();
            set({ selectedContract: data });
            return data;
        } catch (error: any) {
            set({ error: error.message || "שגיאה בטעינת חוזה" });
            return null;
        } finally {
            set({ loading: false });
        }
    },

    fetchContractsByCustomerId: async (customerId: string) => {
        set({ loading: true, error: undefined });
        try {
            const response = await fetch(`${BASE_API_URL}/customer/${customerId}`);
            if (!response.ok) throw new Error("Failed to fetch contracts by customer");
            const data: Contract[] = await response.json();
            set({ contractsByCustomer: data });
        } catch (error: any) {
            set({ error: error.message || "שגיאה בטעינת חוזים לפי לקוח" });
        } finally {
            set({ loading: false });
        }
    },

    fetchContractsEndingSoon: async (days: number) => {
        set({ loading: true, error: undefined });
        try {
            const response = await fetch(`${BASE_API_URL}/ending-soon?days=${days}`);
            if (!response.ok) throw new Error("Failed to fetch ending soon contracts");
            const data: Contract[] = await response.json();
            set({ contracts: data });
        } catch (error: any) {
            set({ error: error.message || "שגיאה בטעינת חוזים שעומדים להסתיים" });
        } finally {
            set({ loading: false });
        }
    },

    handleCreateContract: async (contract: Partial<Contract>) => {
        set({ loading: true, error: undefined });
        try {
            const response = await fetch(`${BASE_API_URL}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(contract),
            });
            if (!response.ok) throw new Error("Failed to create contract");
            await get().fetchContracts();
        } catch (error: any) {
            set({ error: error.message || "שגיאה ביצירת חוזה" });
        } finally {
            set({ loading: false });
        }
    },

    handleUpdateContract: async (contractId: string, contract: Partial<Contract>) => {
        set({ loading: true, error: undefined });
        try {
            const response = await fetch(`${BASE_API_URL}/${contractId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(contract),
            });
            if (!response.ok) throw new Error("Failed to update contract");
            await get().fetchContracts();
        } catch (error: any) {
            set({ error: error.message || "שגיאה בעדכון חוזה" });
        } finally {
            set({ loading: false });
        }
    },

    handleDeleteContract: async (contractId: string) => {
        set({ loading: true, error: undefined });
        try {
            const response = await fetch(`${BASE_API_URL}/${contractId}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to delete contract");
            await get().fetchContracts();
        } catch (error: any) {
            set({ error: error.message || "שגיאה במחיקת חוזה" });
        } finally {
            set({ loading: false });
        }
    },

    handleUploadDocuments: async (formData: FormData) => {
        set({ loading: true, error: undefined });
        try {
            const response = await fetch(`${BASE_API_URL}/documents`, {
                method: "POST",
                body: formData,
            });
            if (!response.ok) throw new Error("Failed to upload documents");
        } catch (error: any) {
            set({ error: error.message || "שגיאה בהעלאת מסמכים לחוזה" });
        } finally {
            set({ loading: false });
        }
    },

    handleSelectContract: (contractId: string | null) => {
        if (contractId === null) {
            set({ selectedContract: null });
            return;
        }
        const contract = get().contracts.find(c => c.id === contractId) || null;
        set({ selectedContract: contract });
    },

    resetSelectedContract: () => {
        set({ selectedContract: null });
    },

    setShowGraphForId: (id: string | null) => {
        set({ showGraphForId: id });
    },

//   פונקציות שקשורות לשמירת קבצים במסד
//     uploadFileAndReturnReference: async (file, folderPath) => {
//       const formData = new FormData();
//       formData.append("file", file);
//       formData.append("folderPath", folderPath);
    
//       const res = await fetch("/api/upload", {
//         method: "POST",
//         body: formData,
//       });
  
//       const data = await res.json();
//       return data.fileReference;
//     },
    
//     postContractDocument: async (fileReference, contractId) => {
//       await fetch(`/api/contracts/${contractId}/documents`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ fileReference }),
//       });
//     },
    
    
//         handleUploadFileToContract: async (
//       file: File,
//       contractId: string,
//       folderPath: string
//     ) => {
//       set({ loading: true, error: undefined });
//       try {
//         // הכנת קובץ בסגנון Express.Multer.File
//         const expressStyleFile = {
//           fieldname: "file",
//           originalname: file.name,
//           encoding: "7bit", // או מה שרלוונטי
//           mimetype: file.type,
//           size: file.size,
//           buffer: await file.arrayBuffer().then(b => Buffer.from(b)),
//       destination: "",
//       filename: file.name,
//       path: "",
//       stream: undefined as any,
//     };

//     // שלב 1: העלאה וקבלת רפרנס
//     const fileRef = await get().uploadFileAndReturnReference(
//       expressStyleFile as unknown as Express.multer.File,
//       folderPath
//     );

//     // שלב 2: שיוך הרפרנס לחוזה
//     await get().postContractDocument(fileRef, contractId);
    
//         // ריענון חוזה אם צריך
//     // await get().fetchContractDetails(contractId);
//   } catch (error: any) {
//     console.error("שגיאה בהעלאת קובץ לחוזה:", error);
//     set({ error: error.message || "שגיאה בהעלאת קובץ לחוזה" });
//   } finally {
//     set({ loading: false });
//   }
// },
}));
