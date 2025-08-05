import cron from 'node-cron';
import { calculateBillingForCustomer } from '../services/billingCalcullation.services';
import { serviceCreateInvoice } from '../services/invoice.service'; // ייבוא השירות
import { customerService } from '../services/customer.service';
import { VAT_RATE } from '../constants'; // אחוז המע"מ
import { CustomerModel } from '../models/customer.model'; // מבנה לקוח
const serviceCustomer = new customerService();
console.log('billing-cron.ts loaded!');
// פונקציות עזר לחישוב תאריכים
function getBillingPeriodStart(date = new Date()): string {
  // 24 לחודש הנוכחי
  const year = date.getFullYear();
  const month = date.getMonth();
  return new Date(year, month, 24).toISOString().slice(0, 10);
}
function getBillingPeriodEnd(date = new Date()): string {
  // 23 לחודש הבא
  const year = date.getMonth() === 11 ? date.getFullYear() + 1 : date.getFullYear();
  const month = (date.getMonth() + 1) % 12;
  return new Date(year, month, 23).toISOString().slice(0, 10);
}
function getDueDate(endDate: string): string {
  const d = new Date(endDate);
  d.setDate(d.getDate() + 10); // הוספת 10 ימים לתאריך הסיום
  return d.toISOString().slice(0, 10);
}

// תריץ אוטומטית אחת לחודש בשעה 1 בלילה
cron.schedule('0 1 23 * *', async () => {
  // cron.schedule('* * * * *', async () => { 
  console.log('Cron job started: Fetching all customers...');
  try {
    const allCustomers: CustomerModel[] = await serviceCustomer.getAll();
    console.log(`Found ${allCustomers.length} customers.`);

    const startDate = getBillingPeriodStart();
    const endDate = getBillingPeriodEnd();
    const dueDate = getDueDate(endDate);
    console.log(`Billing period: ${startDate} to ${endDate}, Due date: ${dueDate}`);

    for (const customer of allCustomers) {
      if (!customer.id) {
        console.warn(`Customer without id found: ${JSON.stringify(customer)}`);
        continue;
      }

      console.log(`Calculating billing for customer ID: ${customer.id}`);
      try {
        const billingResult = await calculateBillingForCustomer(
          customer.id,
          { startDate, endDate },
          dueDate,
          VAT_RATE
        );

        console.log(`Billing result for customer ID ${customer.id}:`, billingResult);

        const invoiceData = {
          invoice_number: billingResult.invoice.invoice_number,
          customer_id: billingResult.invoice.customer_id,
          customer_name: billingResult.invoice.customer_name,
          status: billingResult.invoice.status,
          issue_date: billingResult.invoice.issue_date,
          due_date: billingResult.invoice.due_date,
          items: billingResult.invoice.items,
          subtotal: billingResult.invoice.subtotal,
          tax_total: billingResult.invoice.tax_total,
          payment_due_reminder: billingResult.invoice.payment_due_reminder,
          payment_dueReminder_sentAt: billingResult.invoice.payment_dueReminder_sentAt,
        };

        console.log(`Creating invoice for customer ID: ${customer.id}`);
        console.log(`inoviceData:`, invoiceData);
        await serviceCreateInvoice(invoiceData); // שמירת החשבונית במסד הנתונים
        console.log(`Invoice created for customer ID: ${customer.id}`);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === 'No workspaces found for the customer'
        ) {
          console.warn(`No workspaces for customer ${customer.id}, skipping...`);
          continue; // עובר ללקוח הבא
        }
        if (error instanceof Error) {
          console.error(`Error creating invoice for customer ${customer.id}: ${error.message}`);
        } else {
          console.error(`Unexpected error creating invoice for customer ${customer.id}:`, error);
        }
      }
    }

    console.log('Cron job completed successfully.');
  } catch (error) {
    console.error('Error in cron job:', error);
  }
});