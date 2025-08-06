import { create } from "zustand";
import type { Booking } from "./../../../../shared-types";

interface BookingCalendarState {
    bookings: Booking[];
    loading: boolean;
    error: string | null;
    fetchBookings: (params?: { roomId?: string }) => Promise<void>;
    createBooking: (booking: Partial<Booking>) => Promise<void>;
    updateBooking: (id: string, booking: Partial<Booking>) => Promise<void>;
    deleteBooking: (id: string) => Promise<void>;
    fetchBookingsByRoomId: (roomId: string) => Promise<void>;
}

const mockBookings: Booking[] = [
    {
        id: "1",
        roomId: "101",
        customerName: "דני",
        startTime: "2025-07-20T10:00:00",
        endTime: "2025-07-20T11:00:00",
        status: "APPROVED"
    } as Booking
];

export const useBookingCalendarStore = create<BookingCalendarState>((set) => ({
    bookings: [],
    loading: false,
    error: null,

    /**
     * טוען את כל ההזמנות מהחנות (או מסנן לפי roomId אם נשלח).
     * כרגע עובד על נתוני דמה בלבד.
     * @param params אובייקט אופציונלי עם roomId לסינון
     */
fetchBookings: async (params) => {
  const calendarId = process.env.REACT_APP_CALENDARID;
  console.log("REACT_APP_CALENDARID:", calendarId);
  set({ loading: true, error: null });
  await new Promise((resolve) => setTimeout(resolve, 300)); // סימולציית טעינה
  try{
  console.log("Before fetch");
const response = await fetch(`/api/googleCalendarBookingIntegration/all/${calendarId}`, {
    method: 'GET',
    credentials: 'include'
});
console.log("After fetch");
    console.log("IM HERE!!!!! YOU CONY!")
    const data = await response.json();
    console.log("this is us data!!!!!!!!!" , data)
    set((state) => ({
      bookings: params?.roomId
        ? data.filter((b: Booking) => b.roomId === params.roomId)
        : data,
      loading: false
    }));
    console.log("this is us data!!!!!!!!!" ,data)
    return data; // החזר את הנתונים
  } catch (error) {
    set({ error: 'Failed to fetch bookings', loading: false });
  }
},

    /**
     * מוסיף הזמנה חדשה לחנות.
     * כרגע מוסיף לנתוני הדמה בלבד.
     * @param booking אובייקט הזמנה חדשה (חלקי)
     */
    createBooking: async (booking) => {
        set({ loading: true, error: null });
        await new Promise((resolve) => setTimeout(resolve, 200));
        set((state) => ({
            bookings: [
                ...state.bookings,
                {
                    ...booking,
                    id: Date.now().toString(),
                    roomId: booking.roomId || "101",
                    customerName: booking.customerName || "לקוח חדש",
                    startTime: booking.startTime || new Date().toISOString(),
                    endTime: booking.endTime || new Date().toISOString(),
                    status: booking.status || "APPROVED"
                } as Booking
            ],
            loading: false
        }));
    },

    /**
     * מעדכן הזמנה קיימת לפי מזהה.
     * כרגע מעדכן בנתוני הדמה בלבד.
     * @param id מזהה ההזמנה לעדכון
     * @param booking אובייקט עם שדות לעדכון
     */
    updateBooking: async (id, booking) => {
        set({ loading: true, error: null });
        await new Promise((resolve) => setTimeout(resolve, 200));
        set((state) => ({
            bookings: state.bookings.map(b =>
                b.id === id ? { ...b, ...booking } as Booking : b
            ),
            loading: false
        }));
    },

    /**
     * מוחק הזמנה לפי מזהה.
     * כרגע מוחק מנתוני הדמה בלבד.
     * @param id מזהה ההזמנה למחיקה
     */
    deleteBooking: async (id) => {
        set({ loading: true, error: null });
        await new Promise((resolve) => setTimeout(resolve, 200));
        set((state) => ({
            bookings: state.bookings.filter(b => b.id !== id),
            loading: false
        }));
    },

    /**
     * טוען את כל ההזמנות של חדר מסוים לפי roomId.
     * כרגע מחזיר נתוני דמה בלבד.
     * @param roomId מזהה החדר
     */
    fetchBookingsByRoomId: async (roomId: string) => {
        set({ loading: true, error: null });
        await new Promise((resolve) => setTimeout(resolve, 300));
        set(() => ({
            bookings: mockBookings.filter(b => b.roomId === roomId),
            loading: false
        }));
    }
}));
