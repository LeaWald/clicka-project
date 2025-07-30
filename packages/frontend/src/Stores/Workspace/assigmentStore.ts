import { create } from 'zustand';
import axios, { AxiosError } from 'axios';
import { Space } from 'shared-types/workspace'; // ייבוא הטייפ הנכון
import { SpaceAssign } from 'shared-types/spaceAssignment';
// הגדרת בסיס URL לAPI
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';


interface Customer {
  id: string | number;
  name: string;
  email?: string;
  phone?: string;
}

interface Assignment {
  id: string | number;
  workspaceId: string | number;
  customerId: string | number;
  assignedDate: string;
  unassignedDate?: string;
  notes?: string;
  assignedBy: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'ENDED';
}
 
interface ConflictCheck {
  hasConflicts: boolean;
  conflicts: Assignment[];
  message: string;
}


interface AssignmentStoreState {
  // State
  assignments: SpaceAssign[];
  spaces: Space[];
  customers: Customer[];
  loading: boolean;
  error: string | null;
  selectedAssignment: Assignment | null;
  conflictCheck: ConflictCheck | null;


  // Actions
  getAssignments: () => Promise<SpaceAssign[]>;
  createAssignment: (assignmentData: Omit<SpaceAssign, 'id'>) => Promise<SpaceAssign>;
  updateAssignment: (id: string | number, assignmentData: Partial<SpaceAssign>) => Promise<SpaceAssign>;
  deleteAssignment: (id: string | number) => Promise<void>;
  setSelectedAssignment: (assignment: Assignment | null) => void;
 checkConflicts: (workspaceId: string | number, assignedDate: string, unassignedDate?: string, excludeId?: string | number, daysOfWeek?: number[]) => Promise<ConflictCheck>;
  clearError: () => void;
  resetStore: () => void;
}
const BASE_API_URL = `${process.env.REACT_APP_API_URL}/space`;

// יצירת instance של axios עם הגדרות בסיסיות
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const useAssignmentStore = create<AssignmentStoreState>((set, get) => ({
  // State - מצב התחלתי של הסטור
  assignments: [],
  spaces: [],
  customers: [],
  loading: false,
  error: null,
  selectedAssignment: null,
  conflictCheck: null,


  /**
   * יוצר הקצאה חדשה - משתמש ב-createSpace (שבעצם יוצר הקצאה)
   */
  createAssignment: async (assignmentData: Omit<SpaceAssign, 'id'>) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post<SpaceAssign>(`${BASE_API_URL}/createSpace`, assignmentData);
      const newAssignment = response.data;
      set((state) => ({
        assignments: [...state.assignments, newAssignment],
        loading: false
      }));
      return newAssignment;
    } catch (error) {
      const errorMessage = error instanceof AxiosError 
        ? error.message 
        : 'An unknown error occurred';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  /**
   * מביא את כל ההקצאות - משתמש ב-getAllSpaces (שבעצם מביא הקצאות)
   */
  getAssignments: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<SpaceAssign[]>(`${BASE_API_URL}/getAllSpaces`);
      // set({ assignments: response.data, loading: false });
      set({ assignments: Array.isArray(response.data) ? response.data : [], loading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof AxiosError 
        ? error.message 
        : 'An unknown error occurred';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
 
  /**
   * מעדכן הקצאה קיימת - משתמש ב-updateSpace
   */
  updateAssignment: async (id: string | number, assignmentData: Partial<SpaceAssign>) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put<SpaceAssign>(`${BASE_API_URL}/updateSpace/${id}`, assignmentData);
      const updatedAssignment = response.data;
      set((state) => ({
        assignments: state.assignments.map((assignment) => 
          assignment.id === id ? updatedAssignment : assignment
        ),
        loading: false
      }));
      return updatedAssignment;
    } catch (error) {
      const errorMessage = error instanceof AxiosError 
        ? error.message 
        : 'An unknown error occurred';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  /**
   * מוחק הקצאה - משתמש ב-deleteSpace
   */
  deleteAssignment: async (id: string | number) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`${BASE_API_URL}/deleteSpace/${id}`);
      set((state) => ({
        assignments: state.assignments.filter((assignment) => assignment.id !== id),
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof AxiosError 
        ? error.message 
        : 'An unknown error occurred';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
  /**
   * בדיקת קונפליקטים לפני יצירת/עדכון הקצאה
   */
  checkConflicts: async (workspaceId: string | number, assignedDate: string, unassignedDate?: string, excludeId?: string | number) => {
    try {
      const response = await api.post<ConflictCheck>(`${BASE_API_URL}/checkConflicts`, {
        workspaceId,
        assignedDate,
        unassignedDate,
        excludeId
      });
      
      set({ conflictCheck: response.data });
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof AxiosError 
        ? error.message 
        : 'An unknown error occurred';
      set({ error: errorMessage });
      throw error;
    }
  },

  /**
   * מגדיר הקצאה נבחרת ב-state
   */
  setSelectedAssignment: (assignment: Assignment | null) => {
    set({ selectedAssignment: assignment });
  },

  /**
   * מנקה שגיאות מה-state
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * מאפס את כל ה-state לערכי ברירת המחדל
   */
  resetStore: () => {
    set({
      assignments: [],
      spaces: [],
      customers: [],
      loading: false,
      error: null,
      selectedAssignment: null,
    });
  },
}));