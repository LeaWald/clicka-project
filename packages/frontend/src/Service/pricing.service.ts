// ייבוא axios והטיפוס AxiosError
import axios from 'axios';

// ייבוא של כל הטיפוסים הדרושים לצורך ניהול תמחורים

import {
  UpdateLoungePricingRequest,
  LoungePricing,
  PricingTier,
  PricingTierCreateRequest,
  MeetingRoomPricing,
  UpdateMeetingRoomPricingRequest,
  UpdatePricingTierRequest,
} from 'shared-types';

// כתובת בסיסית לכל קריאות ה-API שקשורות לתמחור
const API_BASE_URL = '/api/pricing';

// פונקציית עזר לשליפת הודעת שגיאה מתוך אובייקט שגיאה של axios או אחר
function extractErrorMessage(error: any): string {
  if (axios.isAxiosError(error) && error.response) {
    const responseData = error.response.data;
    console.log('Axios Error Response Data:', responseData); // דיבאג

    if (typeof responseData === 'string') {
      return responseData;
    }
    if (responseData && typeof responseData === 'object') {
      if (responseData.message) return responseData.message;
      if (responseData.error) return responseData.error;
      if (responseData.description) return responseData.description;

      if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
        return responseData.errors.map((e: any) => e.message || e.msg || e).join(', ');
      }
    }

    return `שגיאה מהשרת (קוד: ${error.response.status || 'לא ידוע'})`;
  }

  console.log('General Error Object:', error); // דיבאג
  return error.message || 'שגיאה בלתי צפויה.';
}

// ==========================
// =        Lounge         =
// ==========================

// שליפת תמחור נוכחי ללאונג'
export async function getCurrentLoungePricing(): Promise<LoungePricing | null> {
  try {
    const response = await axios.get<LoungePricing>(`${API_BASE_URL}/lounge/current`);
    return response.data ?? null;
  } catch (error: any) {
    throw new Error(extractErrorMessage(error));
  }
}

// יצירת תמחור חדש ללאונג' עם שמירת היסטוריה
export async function createLoungePricingWithHistory(
  data: UpdateLoungePricingRequest
): Promise<LoungePricing> {
  try {
    const response = await axios.post<LoungePricing>(`${API_BASE_URL}/lounge`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(extractErrorMessage(error));
  }
}

// עדכון תמחור ללאונג' לפי מזהה
export async function updateLoungePricing(id: string, data: UpdateLoungePricingRequest): Promise<LoungePricing> {
  try {
    const response = await axios.put<LoungePricing>(`${API_BASE_URL}/lounge/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(extractErrorMessage(error));
  }
}

// מחיקת תמחור ללאונג' לפי מזהה
export async function deleteLoungePricing(id: string): Promise<void> {
  try {
    await axios.delete(`${API_BASE_URL}/lounge/${id}`);
  } catch (error: any) {
    throw new Error(extractErrorMessage(error));
  }
}

// שליפת כל היסטוריית התמחור של הלאונג'
export async function getAllLoungePricingHistory(): Promise<LoungePricing[]> {
  try {
    const response = await axios.get<LoungePricing[]>(`${API_BASE_URL}/lounge/history`);
    return response.data;
  } catch (error: any) {
    throw new Error(extractErrorMessage(error));
  }
}

// ==============================
// =     Workspace Pricing      =
// ==============================

// שליפת שכבת תמחור נוכחית לפי סוג סביבת עבודה (כמו PRIVATE_ROOM)
export async function getCurrentPricingTier(workspaceType: string): Promise<PricingTier | null> {
  try {
    const response = await axios.get<PricingTier>(`${API_BASE_URL}/tier/current`, { params: { workspaceType } });
    return response.data ?? null;
  } catch (error: any) {
    throw new Error(extractErrorMessage(error));
  }
}

// יצירת שכבת תמחור עם שמירת היסטוריה
export async function createPricingTierWithHistory(data: UpdatePricingTierRequest): Promise<PricingTier> {
  try {
    const response = await axios.post<PricingTier>(`${API_BASE_URL}/tier`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(extractErrorMessage(error));
  }
}

// יצירת שכבת תמחור או עדכון אם קיימת
export async function createOrUpdatePricingTier(data: PricingTierCreateRequest): Promise<PricingTier> {
  try {
    const response = await axios.post<PricingTier>(`${API_BASE_URL}/tier`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(extractErrorMessage(error));
  }
}

// עדכון תמחור של שכבת תמחור לפי מזהה
export async function updatePricingTierPricing(id: string, data: UpdatePricingTierRequest): Promise<PricingTier> {
  try {
    const response = await axios.put<PricingTier>(`${API_BASE_URL}/tier/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(extractErrorMessage(error));
  }
}

// מחיקת תמחור workspace לפי מזהה
export async function deletePricingTier(id: string): Promise<void> {
  try {
    await axios.delete(`${API_BASE_URL}/tier/${id}`);
  } catch (error: any) {
    throw new Error(extractErrorMessage(error));
  }
}

// ==============================
// =    Meeting Room Pricing    =
// ==============================

// שליפת תמחור נוכחי לחדרי ישיבות
export async function getCurrentMeetingRoomPricing(): Promise<MeetingRoomPricing | null> {
  try {
    const response = await axios.get<MeetingRoomPricing>(`${API_BASE_URL}/meeting-room/current`);
    return response.data ?? null;
  } catch (error: any) {
    throw new Error(extractErrorMessage(error));
  }
}

// יצירת תמחור חדש לחדרי ישיבות עם שמירת היסטוריה
export async function createMeetingRoomPricingWithHistory(data: UpdateMeetingRoomPricingRequest): Promise<MeetingRoomPricing> {
  try {
    const response = await axios.post<MeetingRoomPricing>(`${API_BASE_URL}/meeting-room`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(extractErrorMessage(error));
  }
}

// עדכון תמחור לחדרי ישיבות לפי מזהה
export async function updateMeetingRoomPricing(id: string, data: UpdateMeetingRoomPricingRequest): Promise<MeetingRoomPricing> {
  try {
    const response = await axios.put<MeetingRoomPricing>(`${API_BASE_URL}/meeting-room/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(extractErrorMessage(error));
  }
}

// מחיקת תמחור לחדרי ישיבות לפי מזהה
export async function deleteMeetingRoomPricing(id: string): Promise<void> {
  try {
    await axios.delete(`${API_BASE_URL}/meeting-room/${id}`);
  } catch (error: any) {
    throw new Error(extractErrorMessage(error));
  }
}

// שליפת כל היסטוריית התמחור לחדרי ישיבות
export async function getAllMeetingRoomPricingHistory(): Promise<MeetingRoomPricing[]> {
  try {
    const response = await axios.get<MeetingRoomPricing[]>(`${API_BASE_URL}/meeting-room/history`);
    return response.data;
  } catch (error: any) {
    throw new Error(extractErrorMessage(error));
  }
}
