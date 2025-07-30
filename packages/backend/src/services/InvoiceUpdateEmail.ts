import { sendEmail } from './gmail-service';
import { EmailTemplateService } from './emailTemplate.service';

const emailService = new EmailTemplateService();

export const sendInvoiceUpdateEmail = async (
  customerName: string,
  invoiceNumber: string,
  status: string,
  amount: number,
  invoiceUrl: string,
  token: any,
): Promise<void> => {
  try {
    const template = await emailService.getTemplateByName("עדכון חשבונית");
    if (!template) {
      console.warn("Email template 'חשבונית עודכנה' not found");
      return;
    }

    const renderedHtml = await emailService.renderTemplate(template.bodyHtml, {
      customerName,
      invoiceNumber,
      status,
      amount: amount.toString(),
      invoiceUrl,
    });

    const response = await sendEmail(
      "me",
      {
        to: ["ettylax@gmail.com"], // תחליפי לאימייל של הלקוח
        subject: encodeSubject(template.subject),
        body: renderedHtml,
        isHtml: true,
      },
      token,
    );

    console.log("Invoice update email sent successfully:", response);
  } catch (err) {
    console.error("Error sending invoice update email:", err);
  }
};

function encodeSubject(subject: string): string {
  return `=?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`;
}