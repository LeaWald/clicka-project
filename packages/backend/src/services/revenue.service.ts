import { ReportParameters, Payment, ID, DateISO } from 'shared-types';
import { PaymentService } from './payments.service';

/**
 * מחזיר רשימת הכנסות (Payments) לפי פרמטרים של דוח
 * @param parameters פרמטרים לסינון הדוח
 * @returns מערך תשלומים
 */
export async function getRevenues(parameters: ReportParameters): Promise<Payment[]> {
  const paymentService = new PaymentService();
  const payments: Payment[] = [];

  

  // סינון לפי טווח תאריכים
  const from = new Date(parameters.dateRange.startDate as DateISO);
  const to = new Date(parameters.dateRange.endDate as DateISO);

  const filtered = payments.filter((payment) => {
    const paymentDate = new Date(payment.date);
    return paymentDate >= from && paymentDate <= to;
  });
// עבור כל לקוח ברשימת ה-customerIds (אם קיימת)
  if (parameters.customerIds && parameters.customerIds.length > 0) {
    for (const customerId of parameters.customerIds) {
      const customerPayments = await paymentService.getPaymentByDateAndCIds({dateFrom: parameters.dateRange.startDate, dateTo: parameters.dateRange.endDate, customerIds: [customerId]});
      payments.push(...customerPayments);
    }
  } else {
    console.warn('getRevenues: No customerIds provided. Returning empty result.');
    return [];
  }
  return filtered;
}