import { Request, Response } from 'express';
import {
  serviceCreateInvoice,
  serviceGetAllInvoices,
  serviceGetAllInvoiceItems,
  serviceGetInvoiceById,
  serviceUpdateInvoice,
  serviceDeleteInvoice,
  serviceGetCustomersCollection,
  sendStatusChangeEmails
  
} from "../services/invoice.service";
import { BillingItem, ID } from "shared-types";
import { InvoiceModel } from '../models/invoice.model';
import { UUID } from 'crypto';
import { UserTokenService } from '../services/userTokenService';

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

  try {
    const invoiceId = req.params.invoice_id as UUID;
    const invoiceItems = await serviceGetAllInvoiceItems(invoiceId);
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

/**
 * בקר למחיקת חשבונית
 */
export const deleteInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id; // זהו ה-ID שמתקבל מה-URL
    if (!id) {
      throw new Error("ID לא נמצא ב-params");
    }
    const isDeleted = await serviceDeleteInvoice(id);
    if (!isDeleted) {
      res.status(404).json({ message: "חשבונית לא נמצאה" });
      return;
    }

    res.status(200).json({ message: "חשבונית נמחקה בהצלחה" });
  } catch (error) {
    console.error("שגיאה במהלך מחיקת החשבונית:", error);
    res.status(500).json({ message: (error as Error).message });
  }
};




//בקר לקבלת פרטי הגבייה 

export const getCustomersCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const collectionDetails = await serviceGetCustomersCollection();
    res.status(200).json({
      message: "הפרטים של הגבייה נמצאו בהצלחה",
      collectionDetails
    });
  } catch (error) {
    res.status(500).json({
      message: "אירעה שגיאה בעת שליפת פרטי הגבייה",
      error: (error as Error).message
    });
  }
}; 



export const sendEmail = async (req: Request, res: Response) => {
  try {
    console.log("sendEmail called with params:", req.params);
    const userTokenService = new UserTokenService();
    const customerName = req.body.customerName;
    const amount = req.body.amount;
    const invoiceNumber = req.body.invoiceNumber;
    const token = await userTokenService.getSystemAccessToken();
    console.log("sendEmail called with token:", token);
    if (!token) {
      return res
        .status(401)
        .json({ error: "Unauthorized: missing access token" });
    }
    if (!customerName || !amount || !invoiceNumber) {
      return res.status(400).json({ error: "Missing required parameters" });
    }
    await sendStatusChangeEmails(customerName, amount, invoiceNumber, token);
    res
      .status(200)
      .json({ message: "Status change processed and emails sent." });
  } catch (error) {
    console.error("Error in sendEmail:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};