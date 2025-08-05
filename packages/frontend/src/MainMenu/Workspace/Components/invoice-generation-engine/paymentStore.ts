import type { Payment } from "shared-types";
import { create } from "zustand";
import axios from "axios"; // או supabase אם צריך

interface PaymentState {
    payments: Payment[];
    getAllPayments: () => Promise<void>;
    updatePayment: (payment: Payment) => Promise<void>;
    addPayment: (payment: Payment) => Promise<void>;
    deletePayment: (payment: Payment) => Promise<void>;
}

export const usePaymentStore = create<PaymentState>((set) => ({
    payments: [],
    
    getAllPayments: async () => {
        try {
            const response = await axios.get("http://localhost:3001/payments");
            set(() => ({ payments: response.data }));
        } catch (error) {
            console.error("שגיאה בשליפת תשלומים:", error);
        }
    },

    addPayment: async (payment: Payment) => {
        // כאן את יכולה גם לשלוח לשרת אם צריך
        set(state => ({
            payments: [...state.payments, payment]
        }));
    },

    updatePayment: async (payment: Payment) => {
        set(state => ({
            payments: state.payments.map(p => p.id === payment.id ? payment : p)
        }));
    },

    deletePayment: async (payment: Payment) => {
        set(state => ({
            payments: state.payments.filter(p => p.id !== payment.id)
        }));
    }
}));
