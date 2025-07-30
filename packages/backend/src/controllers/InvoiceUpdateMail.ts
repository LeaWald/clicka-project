import { Request, Response } from 'express';
import { UserTokenService } from '../services/userTokenService';
import { sendInvoiceUpdateEmail } from '../services/InvoiceUpdateEmail';

export const sendInvoiceUpdateMail = async (req: Request, res: Response) => {
  try {
    const { customerName, invoiceNumber, status, amount, invoiceUrl } = req.body;

    if (!customerName || !invoiceNumber || !status || !amount || !invoiceUrl) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const userTokenService = new UserTokenService();
    const token = await userTokenService.getSystemAccessToken();
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: missing access token" });
    }

    await sendInvoiceUpdateEmail(customerName, invoiceNumber, status, amount, invoiceUrl, token);

    res.status(200).json({ message: "Invoice update email sent successfully" });
  } catch (error) {
    console.error("Error in sendInvoiceUpdateMail:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};