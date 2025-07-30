import { InvoiceModel } from '../models/invoice.model';

// פונקציה לבדוק תקינות של חשבונית לפני שמירתה במסד נתונים
// במידה ויש בעיות — תיזרק שגיאה עם פירוט
export function validateInvoice(invoice: InvoiceModel) {
  // יוצר מערך לאגירת הודעות שגיאה שנמצא
  const errors: string[] = [];

  // בודק אם תאריך הפקת החשבונית חסר או לא תקין
  if (!invoice.issue_date || isNaN(Date.parse(invoice.issue_date))) {
    errors.push('issue_date is missing or invalid');
  }

  // בודק אם תאריך יעד לתשלום חסר או לא תקין
  if (!invoice.due_date || isNaN(Date.parse(invoice.due_date))) {
    errors.push('due_date is missing or invalid');
  }

  // בודק שתאריך היעד לתשלום לא קודם לתאריך ההפקה
  if (invoice.due_date && invoice.issue_date && new Date(invoice.due_date) < new Date(invoice.issue_date)) {
    errors.push('due_date cannot be earlier than issue_date');
  }

  // בודק שקיים מערך פריטים בחשבונית ושהוא לא ריק
  if (!invoice.items || !Array.isArray(invoice.items) || invoice.items.length === 0) {
    errors.push('Invoice must contain at least one item');
  }

  // בודק שסכום הביניים (Subtotal) אינו שלילי
  if (invoice.subtotal < 0) {
    errors.push('Subtotal cannot be negative');
  }

  // בודק שסכום המע"מ (Tax Total) אינו שלילי
  if (invoice.tax_total < 0) {
    errors.push('Tax total cannot be negative');
  }

  // מחשב את הסכום הכולל המצופה (Subtotal + Tax) ומוודא שאינו שלילי
  const expectedTotal = Math.round((invoice.subtotal + invoice.tax_total) * 100) / 100;
  if (expectedTotal < 0) {
    errors.push('Total amount cannot be negative');
  }

  // אם נמצאו שגיאות — זורק שגיאה עם פירוט כל השגיאות שנמצאו
  if (errors.length > 0) {
    throw { status: 400, message: `Invoice validation failed: ${errors.join('; ')}` };
  }
}