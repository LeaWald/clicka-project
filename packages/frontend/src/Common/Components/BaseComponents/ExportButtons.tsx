// ייבוא React ורפרנס לתפיסת אלמנט מה-DOMAdd commentMore actions
import React from 'react';
// ייבוא כפתור מעוצב מקומפוננטה פנימית
import { Button } from './Button';
// ייבוא ספרייה לצילום תוכן HTML לתמונה
import html2canvas from 'html2canvas'; // משמשת לצילום אזור DOM כ־canvas
// ייבוא ספרייה ליצירת קובצי PDF
import jsPDF from 'jspdf'; // מאפשרת יצירת PDF והוספת תוכן כ־Image
// ייבוא כלים לעבודה עם קבצי Excel (xlsx)
import { utils, writeFile } from 'xlsx'; // utils: המרת JSON ל־sheet, writeFile: שמירה לקובץ
/**
 * טיפוס עבור פרופסים של הקומפוננטה
 * - title: שם הדוח (משמש כשם לקובץ)
 * - exportData: מערך נתונים לייצוא לקובץ Excel
 * - refContent: רפרנס לאלמנט שנצלם לתוך PDF
 */
interface ExportButtonsProps {
  title?: string; // כותרת הדוח (לא חובה)
  exportData?: Record<string, any>[]; // מערך אובייקטים שמיועדים לייצוא כ־Excel
  refContent: React.RefObject<HTMLDivElement | null>; // רפרנס לתוכן שיומר לתמונה לצורך PDF
  showPDF?: boolean; // אם true, יוצג כפתור PDF
  showExcel?: boolean; // אם true, יוצג כפתור Excel
}
/**
 * קומפוננטת כפתורי ייצוא: מייצרת כפתורי ייצוא CSV + PDF
 */
export const ExportButtons = ({
  title,
  exportData,
  refContent,
  showPDF = true, // ברירת מחדל היא להציג PDF
  showExcel = true, // ברירת מחדל היא להציג Excel
}: ExportButtonsProps) => {
  // פונקציה לייצוא ל־Excel (CSV)
  const exportCSV = () => {
    if (!exportData) return; // אם אין נתונים – לא נבצע פעולה
    const worksheet = utils.json_to_sheet(exportData); // ממיר את הנתונים ל־sheet
    const workbook = utils.book_new(); // יוצר חוברת עבודה חדשה
    utils.book_append_sheet(workbook, worksheet, 'Report'); // מוסיף את הגיליון לחוברת
    writeFile(workbook, `${title}.xlsx`); // שומר את הקובץ בשם שמבוסס על כותרת הדוח
  };
  // פונקציה לייצוא PDF מתוך refContent
  const exportPDF = async () => {
    if (!refContent.current) return; // אם אין רפרנס תקף – יציאה
    const canvas = await html2canvas(refContent.current); // צילום האלמנט כתמונה
    const imgData = canvas.toDataURL('image/png'); // המרת התמונה לנתון base64 בפורמט PNG
    const pdf = new jsPDF({
      orientation: 'landscape', // מצב עמוד לרוחב
      unit: 'px', // יחידות מידה בפיקסלים
      format: [canvas.width, canvas.height], // גודל עמוד מותאם לגודל התמונה
    });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height); // הוספת התמונה כעמוד PDF
    pdf.save(`${title}.pdf`); // שמירת הקובץ בשם שמבוסס על כותרת הדוח
  };
  // JSX – החזרת רכיבי UI
  return (
    <div className="flex gap-2"> {/* עיטוף כפתורים עם מרווח בין כפתורים */}
      {showExcel && exportData && ( // הצגת כפתור CSV רק אם יש נתונים לייצוא
        <Button
          onClick={exportCSV} // הפעלת ייצוא ל־Excel בלחיצה
          className="bg-blue-500 text-white px-2 py-1 rounded" // עיצוב Tailwind
        >
          יצוא ל-CSV {/* טקסט הכפתור */}
        </Button>
      )}
    {showPDF && (
      <Button
        onClick={exportPDF} // הפעלת ייצוא ל־PDF בלחיצה
        className="bg-green-500 text-white px-2 py-1 rounded" // עיצוב Tailwind
      >
        PDF {/* טקסט הכפתור */}
      </Button>
    )}
    </div>
  );
};