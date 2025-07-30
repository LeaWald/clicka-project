import { CreateLeadRequest, Lead, LeadInteraction } from "shared-types";
import { UUIDTypes } from "uuid";
import { create } from "zustand";
interface LeadsState {
    leads: Lead[];
    isEditModalOpen: boolean,
    editingInteraction: LeadInteraction | null,
    selectedLead: Lead | null;
    loading: boolean;
    error?: string;
    showGraphForId: string | null;
    fetchLeads: () => Promise<void>;
    handleSelectLead: (leadId: string | null) => void;
    handleDeleteLead: (leadId: string) => Promise<void>;
    handleCreateLead: (lead: CreateLeadRequest) => Promise<Lead | undefined>;
    handleCreateInteraction: (lead: Lead) => Promise<Response>;
    handleUpdateLead: (leadId: string, lead: Partial<Lead>) => Promise<Lead>;
    resetSelectedLead: () => void;
    fetchLeadDetails: (leadId: string) => Promise<Lead>;
    setShowGraphForId: (id: string | null) => void;
    setIsEditModalOpen: (flag: boolean) => void;
    setEditingInteraction: (interaction: LeadInteraction | null) => void;
    handleDeleteInteraction: (interactionId: string) => Promise<void>;
    // --- תוספות להעלאת קובץ אקסל ---
    uploadFile: File | null;
    uploadStatus: "idle" | "uploading" | "success" | "error";
    uploadMessage: string;
    setUploadFile: (file: File | null) => void;
    uploadExcelFile: () => Promise<void>;
}
const BASE_API_URL = `${process.env.REACT_APP_API_URL}/leads`;
export const useLeadsStore = create<LeadsState>((set, get) => ({
    leads: [],
    selectedLead: null,
    loading: false,
    error: undefined,
    showGraphForId: null,
    isEditModalOpen: false,
    editingInteraction: null,
    // --- סטייטים לתוספות העלאת קובץ אקסל ---
    uploadFile: null,
    uploadStatus: "idle",
    uploadMessage: "",
    fetchLeads: async () => {
        set({ loading: true, error: undefined });
        try {
            const response = await fetch(BASE_API_URL);
            if (!response.ok) {
                throw new Error("Failed to fetch leads");
            }
            const data: Lead[] = await response.json();
            set({ leads: data, loading: false });
        } catch (error: any) {
            set({ error: error.message || "שגיאה בטעינת הלידים", loading: false });
        }
    },
    handleSelectLead: (leadId: UUIDTypes | null) => {
        if (leadId === null) {
            set({ selectedLead: null, isEditModalOpen: false, editingInteraction: null });
            return;
        }
        set((state) => ({
            selectedLead: state.leads.find(lead => lead.id === leadId),
            isEditModalOpen: false,
            editingInteraction: null
        }));
    },
    handleDeleteLead: async (leadId: UUIDTypes) => {
        set({ loading: true, error: undefined });
        try {
            const response = await fetch(`${BASE_API_URL}/${leadId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error("Failed to delete lead");
            }
            await useLeadsStore.getState().fetchLeads(); 
        } catch (error: any) {
            set({ error: error.message || "שגיאה במחיקת מתעניין", loading: false });
        } finally {
            set({ loading: false });
        }
    },
    handleCreateLead: async (lead: CreateLeadRequest) => {
        set({ loading: true, error: undefined });
        try {
            const response = await fetch(BASE_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(lead),
            });
            if (!response.ok) {
                let errorMsg = "Failed to create lead";
                try {
                    const errorBody = await response.json();
                    errorMsg = errorBody?.error?.details || errorBody?.error?.message || errorBody?.message || errorMsg;
                } catch (e) { }
                console.log(errorMsg);
                throw new Error(errorMsg);
            }
            const newLead: Lead = await response.json();
            await useLeadsStore.getState().fetchLeads();
            return newLead;
        } catch (error: any) {
            set({ error: error.message || "שגיאה ביצירת מתעניין", loading: false });
            console.log(error)
            return undefined;
        } finally {
            set({ loading: false });
        }
    },
    handleUpdateLead: async (leadId: UUIDTypes, lead: Partial<Lead>): Promise<Lead> => {
        set({ loading: true, error: undefined });
        try {
            const response = await fetch(`${BASE_API_URL}/${leadId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(lead),
            });
            if (!response.ok) {
                let errorMsg = "Failed to update customer";
                try {
                    const errorBody = await response.json();
                    errorMsg = errorBody?.error?.details || errorBody?.error?.message || errorBody?.message || errorMsg;
                } catch (e) { }
                throw new Error(errorMsg);
            }
            const updatedLead: Lead = await response.json();
            await useLeadsStore.getState().fetchLeads();
            return updatedLead;
        } catch (error: any) {
            set({ error: error.message || "שגיאה בעדכון מתעניין", loading: false });
            throw error; // חשוב לזרוק את השגיאה כדי שההבטחה תיכשל ולא תחזור undefined
        } finally {
            set({ loading: false });
        }
    },
    resetSelectedLead: () => {
        set({ selectedLead: null, isEditModalOpen: false, editingInteraction: null });
    },
    fetchLeadDetails: async (leadId: string) => {
        set({ loading: true, error: undefined });
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/leads/${leadId}`);
            if (!response.ok) {
                throw new Error("Failed to fetch lead details");
            }
            const data: Lead = await response.json();
            set({ selectedLead: data, loading: false });
            return data;
        } catch (error: any) {
            set({ error: error.message || "שגיאה בטעינת פרטי הליד", loading: false });
            return {} as Lead;
        }
    },
    setShowGraphForId: (id: string | null) => {
        set({ showGraphForId: id });
    },
    // handleDeleteInteraction: async (interactionId: string) => {
    //     const selectedLead = get().selectedLead;
    //     if (!selectedLead) {
    //         console.error("No selected lead to delete interaction from");
    //         return;
    //     }
    //     try {
    //         const response = await fetch(`${process.env.REACT_APP_API_URL}/leads/${selectedLead.id}/interactions/${interactionId}`, {
    //             method: "DELETE",
    //         });
    //         if (!response.ok) {
    //             throw new Error("Failed to delete interaction");
    //         }
    //         // אין עדכון סטייט ידני! רק קריאה לשרת
    //         console.log("Interaction deleted successfully");
    //     } catch (error: any) {
    //         console.error("Error deleting interaction:", error);
    //     }
    // }
    setIsEditModalOpen(flag: boolean) {
        set({ isEditModalOpen: flag })
    },
    setEditingInteraction: async (interaction: LeadInteraction | null) => {
        set({ editingInteraction: interaction })
    },
    handleCreateInteraction: async (lead: Lead) => {
        try {
            console.log(lead);
            const response = await fetch(`${process.env.REACT_APP_API_URL}/leads/${lead.id}/addInteraction`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(lead.interactions[lead.interactions.length - 1]),
            });
            if (!response.ok) {
                console.log('***********************************');
            }
            console.log('-----------------------------');
            return await response;
        } catch (error) {
            console.error("Error adding interaction:", error);
            console.log('111111111111111111111111111');
            throw error;
        }
    },
    handleDeleteInteraction: async (interactionId: string) => {
        const { selectedLead } = get();
        if (!selectedLead) {
            console.error("No selected lead to delete interaction from");
            return;
        }
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/leads/${selectedLead.id}/interactions/${interactionId}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                throw new Error("Failed to delete interaction");
            }
            // מעדכן את selectedLead בסטייט כך שיכיל את רשימת האינטראקציות לאחר מחיקה
            const updatedInteractions = selectedLead.interactions.filter(
                (interaction) => interaction.id !== interactionId
            );
            set({
                selectedLead: {
                    ...selectedLead,
                    interactions: updatedInteractions
                }
            });
            console.log("Interaction deleted successfully");
        } catch (error: any) {
            console.error("Error deleting interaction:", error);
        }
    }
    ,
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
            const res = await fetch(`${process.env.REACT_APP_API_URL}/leads/upload/excel`, {
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
            await get().fetchLeads();
        } catch (error: any) {
            set({
                uploadStatus: "error",
                uploadMessage: error.message || "שגיאה לא צפויה בהעלאת הקובץ",
            });
        }
    },
}
));