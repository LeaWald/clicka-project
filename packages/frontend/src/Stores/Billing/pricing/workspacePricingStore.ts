// Stores/Billing/pricing/workspacePricingStore.ts

import { create } from 'zustand'; 
// Zustand - ספרייה לניהול state גלובלי בריאקט (כמו Redux אבל פשוט יותר)

// ייבוא של פונקציות שירות מהשכבת service
import { 
  getCurrentPricingTier,                  // שליפת התמחור הנוכחי לפי סוג סביבת עבודה
  // createOrUpdatePricingTier,              // לא בשימוש בקובץ הזה (אפשר למחוק אם לא צריך)
  createPricingTierWithHistory,           // יצירת תמחור חדש עם היסטוריה
  updatePricingTierPricing,               // עדכון תמחור קיים
  deletePricingTier                       // מחיקת רשומת תמחור workspace
} from '../../../Service/pricing.service';

import {
  PricingTier,                            // טיפוס לייצוג שכבת תמחור
  // PricingTierCreateRequest,               // טיפוס לבקשת יצירה
  UpdatePricingTierRequest                // טיפוס לבקשת עדכון
} from 'shared-types';

// ממשק ל־state הכולל את כל הפונקציות והמשתנים הדרושים
interface WorkspacePricingState {
  current: PricingTier | null;            // התמחור הנוכחי של סביבת העבודה
  loading: boolean;                       // האם יש פעולה ברקע
  error: string | null;                   // הודעת שגיאה כללית

  fetch: (workspaceType: string) => Promise<void>;  // שליפת התמחור לפי סוג סביבת עבודה
  fetchHistory: () => Promise<void>;               // שליפת היסטוריית תמחור (כרגע ריקה)
  save: (data: UpdatePricingTierRequest, id?: string) => Promise<void>; // שמירה (עדכון/יצירה)
  delete: (id: string) => Promise<void>;           // מחיקה לפי מזהה
}

// יצירת ה-store של Zustand
export const useWorkspacePricingStore = create<WorkspacePricingState>((set, get) => ({

  current: null,               // ערך התחלתי של התמחור הנוכחי
  history: [],                 // מערך היסטוריה (כרגע לא בשימוש אמיתי)
  loading: false,             // סטטוס טעינה התחלתית
  error: null,                // ללא שגיאות בהתחלה

  // פונקציה: שליפת שכבת התמחור לפי סוג סביבת עבודה (PRIVATE_ROOM וכו')
  fetch: async (workspaceType) => {
    set({ loading: true, error: null });
    try {
      const pricing = await getCurrentPricingTier(workspaceType);  // API
      set({ current: pricing, loading: false });                   // שמירת התוצאה ל־state
    } catch (e: any) {
      set({ error: e?.message || 'שגיאה בטעינת מחירי לאונג', loading: false });
    }
  },

  // פונקציה (עתידית) לשליפת היסטוריית תמחור – כרגע אין בה מימוש
  fetchHistory: async () => {
    set({ loading: true, error: null });
    try {
      // TODO: להוסיף פונקציית שירות מתאימה כמו getAllLoungePricingHistory()
      // const historyData = await getAllLoungePricingHistory();
      // set({ history: historyData, loading: false });
      set({ loading: false }); // בינתיים, פשוט מסיים טעינה
    } catch (e: any) {
      set({ error: e?.message || 'שגיאה בטעינת היסטוריית מחירי לאונג', loading: false });
    }
  },

  // פונקציית שמירה: אם קיים מזהה → עדכון, אחרת יצירה חדשה עם היסטוריה
  save: async (data, id) => {
    set({ loading: true, error: null });
    try {
      if (id) {
        await updatePricingTierPricing(id, data);         // עדכון לפי ID
      } else {
        await createPricingTierWithHistory(data);         // יצירת חדש עם היסטוריה
      }
      set({ loading: false });
      // await get().fetch(); // אופציונלי: רענון הנתונים הנוכחיים
      await get().fetchHistory(); // תמיד נרענן את ההיסטוריה
    } catch (e: any) {
      const message = e?.response?.data?.error || e?.message || 'שגיאה בשמירת הנתונים';
      set({ error: message, loading: false });
      throw new Error(message); // החוצה לקומפוננטה
    }
  },

  // פונקציית מחיקה: מוחקת לפי ID ומרעננת את ההיסטוריה
  delete: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await deletePricingTier(id);            // מחיקה
      set({ loading: false });
      alert('המחיר נמחק בהצלחה!');
      // await get().fetch(); // רענון נתונים (אם נדרש)
      await get().fetchHistory();             // רענון ההיסטוריה
    } catch (e: any) {
      const message = e?.response?.data?.error || e?.message || 'שגיאה במחיקת הנתונים';
      set({ error: message, loading: false });
      alert(`שגיאה במחיקה: ${message}`);
      throw new Error(message);
    }
  }
}));
