import { Request, Response } from 'express';
import { calculateBillingForCustomer } from '../services/billingCalcullation.services';
import { VAT_RATE } from '../constants';

export const calculateBilling = async (req: Request, res: Response) => {
  try {
    // קבלת נתונים מה-client
    const { customerId, startDate, endDate } = req.body;

    if (!customerId || !startDate || !endDate) {
      return res.status(400).json({ error: 'חובה לציין מזהה לקוח ותאריכים' });
    }

    // חישוב dueDate (10 ימים אחרי endDate)
    const d = new Date(endDate);
    d.setDate(d.getDate() + 10);
    const dueDate = d.toISOString().slice(0, 10);

    // קריאה לפונקציה עם כל הפרמטרים
    const result = await calculateBillingForCustomer(
      customerId,
      { startDate, endDate },
      dueDate,
      VAT_RATE // אפשר לשלוח גם מה-client אם צריך
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};