import express, { Request, Response } from 'express';
import { calculateBillingForCustomer, calculateBillingForAllCustomers } from '../services/billingCalcullation.services';

const billingRouter = express.Router();

// פונקציה עזר לחישוב dueDate (10 ימים לאחר endDate)
function getDueDate(endDate: string): string {
  const d = new Date(endDate);
  d.setDate(d.getDate() + 10); // הוספת 10 ימים לתאריך הסיום
  return d.toISOString().slice(0, 10);
}


// מחשב חיוב ללקוח בודד לפי מזהה וטווח תאריכים
billingRouter.post('/calculate/:customerId', async (req: Request, res: Response) => {
  try {
    const customerId = req.params.customerId;
    console.log('Received customerId:', customerId);
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'חובה לציין תאריכים' });
    }

    const dueDate = getDueDate(endDate);

    const result = await calculateBillingForCustomer(
      customerId,
      { startDate, endDate },
      dueDate
    );
    
    console.log('Received body:', req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'שגיאה בחישוב החיוב', details: err?.message });
  }
});

// מחשב חיוב לכל הלקוחות בטווח תאריכים
billingRouter.post('/calculate-all', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'חובה לציין תאריכים' });
    }

    const dueDate = getDueDate(endDate);

    const result = await calculateBillingForAllCustomers(
      { startDate, endDate },
      dueDate
    );

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'שגיאה בחישוב החיוב לכל הלקוחות', details: err?.message });
  }
});

export default billingRouter;
