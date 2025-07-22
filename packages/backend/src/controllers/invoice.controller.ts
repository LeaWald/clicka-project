import { Request, Response } from 'express';
import {
  serviceCreateInvoice,
  serviceGetAllInvoices,
  serviceGetAllInvoiceItems,
  serviceGetInvoiceById,
  serviceUpdateInvoice,
  serviceDeleteInvoice,
  serviceCreateInvoiceItem
} from "../services/invoice.service";
import { BillingItem, ID } from "shared-types";
import { InvoiceModel, InvoiceItemModel } from '../models/invoice.model';

import { UUID } from 'crypto';

/**
 * בקר ליצירת חשבונית ידנית
 */
// יצירת חשבונית חדשה
export async function createInvoice(req: Request, res: Response): Promise<void> {
  try {
    const invoiceData: Partial<InvoiceModel> = req.body;
    const newInvoice = await serviceCreateInvoice(invoiceData);
    res.status(201).json({
      success: true,
      message: 'חשבונית נוצרה בהצלחה',
      data: newInvoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'שגיאה ביצירת החשבונית',
      error: error instanceof Error ? error.message : 'שגיאה לא ידועה'
    });
  }
}
/**
 * בקר ליצירת פריט חשבונית
 */
export const createInvoiceItem = async (req: Request, res: Response): Promise<void> => {
  console.log('🔍 מתחילים ליצור פריט חשבונית עם הנתונים:', req.body);

  try {
    const invoiceItemData: Partial<InvoiceItemModel> = req.body;
    
    console.log('📦 נתוני פריט החשבונית המתקבלים:', invoiceItemData);

    const newInvoiceItem = await serviceCreateInvoiceItem(invoiceItemData);

    console.log('✅ פריט החשבונית נוצר בהצלחה:', newInvoiceItem);

    res.status(201).json({
      success: true,
      message: 'פריט חשבונית נוצר בהצלחה',
      data: newInvoiceItem
    });
  } catch (error) {
    console.error('❌ שגיאה ביצירת פריט החשבונית:', error);
    
    res.status(500).json({
      success: false,
      message: 'שגיאה ביצירת פריט החשבונית',
      error: error instanceof Error ? error.message : 'שגיאה לא ידועה'
    });
  }
};




// /**
//  * בקר לקבלת כל החשבוניות
//  */
export const getAllInvoices = async (_req: Request, res: Response) => {
  try {
    const invoices = await serviceGetAllInvoices();
    res.status(200).json({
      message: `נמצאו ${invoices.length} חשבוניות`,
      invoices
    });
  } catch (error) {
    console.error(' CONTROLLER: שגיאה:', error);
    res.status(500).json({ message: (error as Error).message });
  }
};
//  * בקר לקבלת כל פרטי החשבוניות
//  */
export const getAllInvoiceItems = async (req: Request, res: Response) => {
  console.log('=== getAllInvoiceItems CALLED ===*****');
  console.log('Full URL:', req.url);
  try {
    const invoiceId = req.params.invoice_id as UUID;
    const invoiceItems = await serviceGetAllInvoiceItems(invoiceId);
    //const invoiceItems = await serviceGetAllInvoiceItems(invoiceId);
    res.status(200).json({
      message: `נמצאו ${invoiceItems.length} חשבוניות`,
      invoiceItems
    });
  } catch (error) {
    console.error(' CONTROLLER: שגיאה:', error);
    res.status(500).json({ message: (error as Error).message });
  }
};

/**
 * בקר לקבלת חשבונית לפי מזהה
 */
export const getInvoiceById = async (req: Request, res: Response): Promise<void> => {
  console.log('=== getInvoiceById CALLED ===');
  console.log('Full URL:', req.url);
  console.log('Params:', req.params);
  try {
    const id = req.params.id as ID;
    const invoice = await serviceGetInvoiceById(id);

    if (!invoice) {
      res.status(404).json({ message: "חשבונית לא נמצאה" });
      return;
    }

    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

/**
 * בקר לעדכון חשבונית
 */
export const updateInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as ID;
    const updateData = req.body;
    const updatedInvoice = await serviceUpdateInvoice(id, updateData);
    if (!updatedInvoice) {
      res.status(404).json({ message: "חשבונית לא נמצאה" });
      return;
    }
    res.status(200).json({
      message: "חשבונית עודכנה בהצלחה",
      invoice: updatedInvoice
    });
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
      details: error instanceof Error ? error.stack : 'Unknown error'
    });
  }
};

// export const updateInvoice = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const id = req.params.id as ID;
//     const updateData = req.body;

//     const updatedInvoice = await serviceUpdateInvoice(id, updateData);

//     if (!updatedInvoice) {
//       res.status(404).json({ message: "חשבונית לא נמצאה" });
//       return; 
//     }

//     res.status(200).json({
//       message: "חשבונית עודכנה בהצלחה",
//       invoice: updatedInvoice
//     });
//   } catch (error) {
//     res.status(400).json({ message: (error as Error).message });
//   }
// };


/**
 * בקר למחיקת חשבונית
 */
export const deleteInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const number = req.params.invoice_number as string;
    const isDeleted = await serviceDeleteInvoice(number);

    if (!isDeleted) {
      res.status(404).json({ message: "חשבונית לא נמצאה" });
      return;
    }
    res.status(200).json({ message: "חשבונית נמחקה בהצלחה" });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
















