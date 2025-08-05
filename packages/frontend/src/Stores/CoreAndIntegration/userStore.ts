import { create } from 'zustand';
import { User } from 'shared-types';
import { axiosInstance } from '../../Service/Axios';

interface UserState {
  users: User[];
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  getAllUsers: () => Promise<void>;
  getUserById: (id: string | undefined) => Promise<User | null>;
  createUser: (user: User) => Promise<User | null>;
  removeUser: (id: string) => Promise<User | null>;
  updateUser: (id: string, newUser: User) => Promise<User | null>;
  setCurrentUser: (user: User | null) => void;
  clearError: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  currentUser: null,
  loading: false,
  error: null,

  // פונקציה זו מחזירה את כל המשתמשים מהשרת
  getAllUsers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get<User[]>('/api/users/getAllUsers');
      set({ users: response.data, loading: false });
    } catch (error) {
      console.error('Error getting all users:', error);
      set({ 
        error: 'Error getting all users', 
        loading: false 
      });
      throw error;
    }
  },

  // פונקציה זו מחזירה את המשתמש לפי ה-ID שלו
  getUserById: async (id: string | undefined): Promise<User | null> => {
    if (!id) {
      set({ error: 'User ID is required' });
      return null;
    }
    
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get<User>(`/api/users/getUser/${id}`);
      set({ currentUser: response.data, loading: false });
      return response.data;
    } catch (error) {
      console.error('Error getting user by id:', error);
      set({ 
        error: 'Error getting user by id', 
        loading: false 
      });
      throw error;
    }
  },

  // פונקציה זו יוצרת משתמש חדש
  createUser: async (user: User): Promise<User | null> => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.post('/api/users/createUser', user);
      const newUser = response.data;
      
      // עדכון רשימת המשתמשים
      set(state => ({ 
        users: [...state.users, newUser],
        loading: false 
      }));
      
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      set({ 
        error: 'Error creating user', 
        loading: false 
      });
      throw error;
    }
  },

  // פונקציה זו מוחקת משתמש לפי ה-ID שלו
  removeUser: async (id: string): Promise<User | null> => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.delete(`/api/users/deleteUser/${id}`);
      const deletedUser = response.data;
      
      // הסרת המשתמש מהרשימה
      set(state => ({ 
        users: state.users.filter(user => user.id !== id),
        currentUser: state.currentUser?.id === id ? null : state.currentUser,
        loading: false 
      }));
      
      return deletedUser;
    } catch (error) {
      console.error('Error removing user:', error);
      set({ 
        error: 'Error removing user', 
        loading: false 
      });
      throw error;
    }
  },

  // פונקציה זו מעדכנת משתמש לפי ה-ID שלו
  updateUser: async (id: string, newUser: User): Promise<User | null> => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.put(`/api/users/updateUser/${id}`, newUser);
      const updatedUser = response.data;
      
      // עדכון המשתמש ברשימה
      set(state => ({ 
        users: state.users.map(user => 
          user.id === id ? updatedUser : user
        ),
        currentUser: state.currentUser?.id === id ? updatedUser : state.currentUser,
        loading: false 
      }));
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      set({ 
        error: 'Error updating user', 
        loading: false 
      });
      throw error;
    }
  },

  // פונקציה להגדרת המשתמש הנוכחי
  setCurrentUser: (user: User | null) => {
    set({ currentUser: user });
  },

  // פונקציה לניקוי שגיאות
  clearError: () => {
    set({ error: null });
  }
}));
