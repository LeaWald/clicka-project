import { ReportData, ReportParameters, ReportType } from 'shared-types';
/**
 * פונקציה כללית לשליחת בקשה לשרת לקבלת דוח
 * @param type - סוג הדוח (REVENUE / EXPENSES)
 * @param parameters - הפרמטרים שנבחרו ע"י המשתמש (תאריכים, פילטרים וכו')
 * @returns תוצאת הדוח בפורמט ReportData או מוק דאטה אם יש שגיאה
 */
export async function fetchReportData(
  type: ReportType,
  parameters: ReportParameters
): Promise<ReportData> {
  const API_BASE = process.env.REACT_APP_API_URL;

  if (!API_BASE) {
    throw new Error('Missing REACT_APP_API_URL environment variable');
  }

  try {
    const response = await fetch(`${API_BASE}/reports/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parameters),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch report: ${response.status} ${response.statusText}`);
    }

const data: ReportData = await response.json();
console.log("✅ Raw response from server:", data); // ← זו השורה שמוסיפה בדיקה
return data;

  } catch (error: unknown) {
    console.error('Error fetching report:', error);
    throw new Error("Failed to fetch report");
  }
}
