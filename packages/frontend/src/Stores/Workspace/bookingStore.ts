import { create } from 'zustand';
import { Booking } from 'shared-types/booking';
import axiosInstance from '../../Service/Axios';

interface BookingState {
  bookings: Booking[];
  currentBooking: Booking | null;
  loading: boolean;
  error: string | null;

  // CRUD actions
  getAllBookings: () => Promise<void>;
  getBookingById: (id: string) => Promise<Booking | null>;
  createBooking: (booking: Booking) => Promise<void>;
  createBookingInCalendar: (booking: Booking, calendarId: string) => Promise<Booking | null>;
  //|boolean
  updateBooking: (id: string, updated: Booking) => Promise<Booking | null>;
  deleteBooking: (id: string) => Promise<boolean>;
  setCurrentBooking: (booking: Booking | null) => void;
  clearError: () => void;
  getCustomerByPhoneOrEmail: (value: string) => Promise<any>;
   bookingApproval: (id: string) =>  Promise<Booking | null>;
}
const BASE_API_URL = `${process.env.REACT_APP_API_URL}/book`;
export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  currentBooking: null,
  loading: false,
  error: null,

  getAllBookings: async () => {
    set({ loading: true, error: null });
    try {
      console.log('📡 Base URL:', process.env.REACT_APP_API_URL);
      const response = await axiosInstance.get<Booking[]>(`${BASE_API_URL}/getAllBooking`);
      set({ bookings: response.data, loading: false });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      set({ error: 'שגיאה בשליפת כל ההזמנות', loading: false });
    }
  },

  getBookingById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get<Booking>(`${BASE_API_URL}/getBookingById/${id}`);
      set({ currentBooking: response.data, loading: false });
      return response.data;
    } catch (error) {
      console.error('Error fetching booking:', error);
      set({ error: 'שגיאה בשליפת ההזמנה לפי מזהה', loading: false });
      return null;
    }
  },

  createBooking: async (booking: Booking) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.post(BASE_API_URL, booking);
      const created = response.data;
      set(state => ({
        bookings: [...state.bookings, created],
        loading: false,
      }));
    } catch (error) {
      console.error('Error creating booking:', error);
      set({ error: 'שגיאה ביצירת הזמנה', loading: false });
    }
  },
 createBookingInCalendar: async (booking: Booking, calendarId: string) => {
  console.log(booking,"booking in createBookingInCalendar??????????????????????????\n");
  
    const googleAccessToken = localStorage.getItem('google_token'); 
    console.log("Google Access Token:", googleAccessToken);
    
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.post(`/calendar-sync/add/${calendarId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${googleAccessToken}`,
        },
        body: {
         booking:booking
        }
      });
      const created = response.data;
console.log(created,"created in createBookingInCalendar??????????????????????????\n");

      set(state => ({
        bookings: [...state.bookings, created],
        loading: false,
      }));
      return created;
    } catch (error) {
      console.error('Error creating booking:', error);
      set({ error: 'בcalenar שגיאה ביצירת הזמנה', loading: false });
      return null;
    }
  }
,

  updateBooking: async (id: string, updated: Booking) => {
    // set({ loading: true, error: null });
    console.log("startt" + updated);
    
    try {
      const response = await axiosInstance.patch(`${BASE_API_URL}/updateBooking/${id}`, updated);
      const updatedBooking = response.data;

      set(state => ({
        bookings: state.bookings.map(b => (b.id === id ? updatedBooking : b)),
        currentBooking: state.currentBooking?.id === id ? updatedBooking : state.currentBooking,
        loading: false,
      }));

      return updatedBooking;
    } catch (error) {
      console.error('Error updating booking:', error);
      set({ error: 'שגיאה בעדכון ההזמנה', loading: false });
      return null;
    }
  },

  deleteBooking: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await axiosInstance.delete(`${BASE_API_URL}/deleteBooking/${id}`);
      set(state => ({
        bookings: state.bookings.filter(b => b.id !== id),
        currentBooking: state.currentBooking?.id === id ? null : state.currentBooking,
        loading: false,
      }));
      return true;
    } catch (error) {
      console.error('Error deleting booking:', error);
      set({ error: 'שגיאה במחיקת ההזמנה', loading: false });
      return false;
    }
  },

  setCurrentBooking: (booking: Booking | null) => {
    set({ currentBooking: booking });
  },

  clearError: () => {
    set({ error: null });
  },
  getCustomerByPhoneOrEmail: async (value: string) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get(`/customers/getByPhoneOrEmail`, {
        params: { value },
      });
      return response.data; 
    } catch (error) {
      console.error('שגיאה בשליפת לקוח לפי טלפון או מייל:', error);
      set({ error: 'שגיאה בשליפת לקוח לפי טלפון או מייל', loading: false });
      return null;
    }
  },
 bookingApproval: async (id: string) => {  
         set({ loading: true, error: null });
        try {
          const response = await axiosInstance.put<Booking>(`${BASE_API_URL}/bookingApproval/${id}`);
          const current = response.data;
          set(state => ({
            bookings: state.bookings.map(b => b.id === id ? current : b),
            currentBooking: state.currentBooking?.id === id ? current : state.currentBooking,
            loading: false,
          }));
          return current;
        } catch (error) {
          console.error('Error approving booking:', error);
          set({ error: 'שגיאה באישור ההזמנה', loading: false });
          return null;
        }
      }

}));