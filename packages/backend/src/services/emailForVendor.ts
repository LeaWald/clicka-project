import { sendEmail } from './gmail-service';
import { EmailTemplateService } from './emailTemplate.service';
import { Expense } from 'shared-types'; // או איפה שמוגדר Expense אצלך
import { VendorModel } from '../models/vendor.model'; // הנתיב למודל שלך
import { getVendorById } from './vendor.service'; // אתה צריך שתהיה לך פונקציה כזו

const emailService = new EmailTemplateService();

export const sendVendorExpensePaidEmail = async (
  expense: Expense,
  token: any,
): Promise<void> => {
  try {
    const vendor = await getVendorById(expense.vendor_id);
    if (!vendor?.email) {
      console.warn('Vendor email not found');
      return;
    }

    const template = await emailService.getTemplateByName("תשלום הוצאה לספק");
    if (!template) {
      console.warn("Email template 'תשלום הוצאה לספק' not found");
      return;
    }

    const renderedHtml = await emailService.renderTemplate(template.bodyHtml, {
      vendorName: vendor.name,
      expenseId: expense.id,
      amount: expense.amount.toFixed(2),
    //   paymentDate: expense.payment_date,
      notes: expense.notes ?? '',
    });

    const response = await sendEmail(
      "me",
      {
        to: [vendor.email],
        subject: encodeSubject(template.subject),
        body: renderedHtml,
        isHtml: true,
      },
      token,
    );

    console.log("Vendor expense paid email sent successfully:", response);
  } catch (err) {
    console.error("Error sending vendor paid email:", err);
  }
};

function encodeSubject(subject: string): string {
  return `=?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`;
}
