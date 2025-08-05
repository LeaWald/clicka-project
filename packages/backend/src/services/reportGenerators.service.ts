
import { ReportParameters,CashFlowReportData , ReportData,Expense, ExpenseCategory,BookingStatus, BillingItemType, Payment, Invoice, BillingItem, InvoiceStatus } from 'shared-types';
import { ExpenseService } from './expense.services';
import { groupByPeriod } from '../utils/groupingUtils.service';
import { PaymentService } from '../services/payments.service';
import { serviceGetInvoiceById } from '../services/invoice.service';
import { BookingService } from '../services/booking.service';

function getPeriodLabel(dateStr: string, groupBy: 'month' | 'quarter' | 'year' = 'month'): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();

  if (groupBy === 'year') return `${year}`;
  if (groupBy === 'quarter') {
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `Q${quarter} ${year}`;
  }

  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

export async function generateExpenseData(parameters: ReportParameters): Promise<ReportData | null> {
  const expenseService = new ExpenseService();
  const expenseCategories = parameters.categories as string[] | undefined;

  const expenses = await expenseService.getExpenses({
    dateFrom: parameters.dateRange?.startDate,
    dateTo: parameters.dateRange?.endDate,
    category: expenseCategories,
    // vendorId: parameters.customerIds?.at(0),
  });

  if (!expenses || expenses.length === 0) return null;

  const groupedByPeriod = groupByPeriod(expenses, parameters.groupBy ?? 'month', 'date', 'amount');

  const monthlyTrend = groupedByPeriod.map((group) => {
    const periodLabel = group.label;
    const expensesInPeriod = expenses.filter((e) => getPeriodLabel(e.date, parameters.groupBy) === periodLabel);

    const sumsByCategory: Record<string, number> = {};
    for (const expense of expensesInPeriod) {
      const cat = expense.category || 'OTHER';
      sumsByCategory[cat] = (sumsByCategory[cat] || 0) + expense.amount;
    }

    const topCategories = Object.entries(sumsByCategory)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 3)
      .map(([category, amount]) => ({
        category: category as unknown as ExpenseCategory,
        amount: amount as number,
      }));

    return {
      month: periodLabel,
      totalExpenses: group.value,
      topCategories,
    };
  });

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryTotals: Record<string, number> = {};
  for (const expense of expenses) {
    const cat = expense.category || 'OTHER';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + expense.amount;
  }

  const expensesByCategory = Object.entries(categoryTotals).map(([category, amount]) => ({
    category: category as unknown as ExpenseCategory,
    amount: amount as number,
    percentage: Math.round(((amount as number) / total) * 1000) / 10,
  }));

  return {
    revenueData: {
      totalRevenue: 0,
      membershipRevenue: 0,
      meetingRoomRevenue: 0,
      loungeRevenue: 0,
      otherRevenue: 0,
      breakdown: [],
    },
    expenseData: {
      totalExpenses: total,
      expensesByCategory,
      monthlyTrend,
    },
    profitLossData: {
      totalRevenue: 0,
      totalExpenses: total,
      totalProfit: -total,
      breakdown: [],
    },
    occupancyRevenueData: {
    occupancyData: [],
    summary: {
      averageOccupancyRate: 0,
      maxOccupancyRate: 0,
      minOccupancyRate: 0,
      totalCustomerCount: 0,
    },
    },
  cashFlowData: {
    totalPayments: 0,   // סה"כ תשלומים שהתקבלו
    totalExpenses: 0,   // סה"כ הוצאות
    cashFlow: 0,        // תזרים מזומנים נטו (תשלומים - הוצאות)
    breakdown: [],      // מערך של פרטי התזרים לפי תקופות או תאריכים
    revenueByCategory: [], // סיכום הכנסות לפי קטגוריה
  },
  };
}
import { parseISO, format } from 'date-fns';

function getPeriodKey(dateStr: string, groupBy: 'month' | 'quarter' | 'year'): string {
  const date = parseISO(dateStr);
  switch (groupBy) {
    case 'month':
      return format(date, 'yyyy-MM');
    case 'quarter': {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `${date.getFullYear()}-Q${quarter}`;
    }
    case 'year':
      return `${date.getFullYear()}`;
  }
}
export async function generateRevenueDataFromPayments(parameters: ReportParameters): Promise<ReportData> {
  const paymentService = new PaymentService();

  const payments: Payment[] = await paymentService.getPaymentByDateAndCIds({
    dateFrom: parameters.dateRange.startDate,
    dateTo: parameters.dateRange.endDate,
    customerIds: parameters.customerIds,
  });

  let membershipRevenue = 0;
  let meetingRoomRevenue = 0;
  let loungeRevenue = 0;
  let otherRevenue = 0;

  const groupedRaw: { date: string; amount: number; type: BillingItemType }[] = [];

  for (const payment of payments) {
    let type: BillingItemType = BillingItemType.OTHER;
    let effectiveDate = payment.date;

    if (payment.invoice_id) {
      const invoice: Invoice | null = await serviceGetInvoiceById(payment.invoice_id);

      // אם יש תאריך חשבונית – השתמש בו במקום בתאריך התשלום
      if (invoice?.issue_date) {
        effectiveDate = invoice.issue_date;
      }

      // קביעת הסוג לפי פריטי החשבונית
      if (invoice?.items?.length) {
        const typeTotals: Record<BillingItemType, number> = {} as any;
        for (const item of invoice.items) {
          typeTotals[item.type] = (typeTotals[item.type] || 0) + item.total_price;
        }
        // הסוג עם הסכום הכי גבוה
        type = Object.entries(typeTotals).sort((a, b) => b[1] - a[1])[0][0] as BillingItemType;
      }
    }

    // סכימה כוללת
    switch (type) {
      case BillingItemType.WORKSPACE:
        membershipRevenue += payment.amount;
        break;
      case BillingItemType.MEETING_ROOM:
        meetingRoomRevenue += payment.amount;
        break;
      case BillingItemType.LOUNGE:
        loungeRevenue += payment.amount;
        break;
      default:
        otherRevenue += payment.amount;
        break;
    }

    groupedRaw.push({ date: effectiveDate, amount: payment.amount, type });
  }

  const grouped = groupByPeriod(groupedRaw, parameters.groupBy ?? 'month', 'date', 'amount');

  // מפת סוגים לכל תקופה
  const detailedMap: Record<string, Record<BillingItemType, number>> = {};

  function createEmptyTypeCounts(): Record<BillingItemType, number> {
    return {
      [BillingItemType.WORKSPACE]: 0,
      [BillingItemType.MEETING_ROOM]: 0,
      [BillingItemType.LOUNGE]: 0,
      [BillingItemType.SERVICE]: 0,
      [BillingItemType.DISCOUNT]: 0,
      [BillingItemType.OTHER]: 0,
    };
  }

  for (const item of groupedRaw) {
    const period = getPeriodKey(item.date, parameters.groupBy ?? 'month');

    if (!detailedMap[period]) {
      detailedMap[period] = createEmptyTypeCounts();
    }

    detailedMap[period][item.type] += item.amount;
  }

  const breakdown = grouped.map((g) => {
    const periodTypes = detailedMap[g.label] ?? createEmptyTypeCounts();

    return {
      date: g.label,
      totalRevenue: g.value,
      membershipRevenue: periodTypes[BillingItemType.WORKSPACE] ?? 0,
      meetingRoomRevenue: periodTypes[BillingItemType.MEETING_ROOM] ?? 0,
      loungeRevenue: periodTypes[BillingItemType.LOUNGE] ?? 0,
      otherRevenue: periodTypes[BillingItemType.OTHER] ?? 0,
    };
  });

  const totalRevenue = membershipRevenue + meetingRoomRevenue + loungeRevenue + otherRevenue;

  return {
    revenueData: {
      totalRevenue,
      membershipRevenue,
      meetingRoomRevenue,
      loungeRevenue,
      otherRevenue,
      breakdown,
    },
    expenseData: {
      totalExpenses: 0,
      expensesByCategory: [],
      monthlyTrend: [],
    },
    profitLossData: {
      totalRevenue,
      totalExpenses: 0,
      totalProfit: totalRevenue,
      breakdown: [],
    },
    occupancyRevenueData: {
      occupancyData: [],
      summary: {
        averageOccupancyRate: 0,
        maxOccupancyRate: 0,
        minOccupancyRate: 0,
        totalCustomerCount: 0,
      },
    },
    cashFlowData: {
      totalPayments: 0,
      totalExpenses: 0,
      cashFlow: 0,
      breakdown: [],
      revenueByCategory: [],
    },
  };
}
export async function generateProfitLossData1(parameters: ReportParameters): Promise<ReportData | null> {
  const groupBy = parameters.groupBy ?? 'month';

  const revenueReport = await generateRevenueDataFromPayments({ ...parameters, groupBy });
  const expenseReport = await generateExpenseData({ ...parameters, groupBy });

  if (!expenseReport) return null;

  const totalRevenue = revenueReport.revenueData.totalRevenue;
  const totalExpenses = expenseReport.expenseData.totalExpenses;
  const totalProfit = totalRevenue - totalExpenses;

  const revenueMap = new Map(revenueReport.revenueData.breakdown.map((r) => [r.date, r.totalRevenue]));
  const expenseMap = new Map(expenseReport.expenseData.monthlyTrend.map((e) => [e.month, e.totalExpenses]));

  const allPeriods = Array.from(new Set([...revenueMap.keys(), ...expenseMap.keys()])).sort();

  const breakdown = allPeriods.map((date) => {
    const revenue = revenueMap.get(date) || 0;
    const expenses = expenseMap.get(date) || 0;
    return {
      date,
      revenue,
      expenses,
      profit: revenue - expenses,
    };
  });

  return {
    revenueData: revenueReport.revenueData,
    expenseData: expenseReport.expenseData,
    profitLossData: {
      totalRevenue,
      totalExpenses,
      totalProfit,
      breakdown,
    },
    occupancyRevenueData: {
    occupancyData: [],
    summary: {
      averageOccupancyRate: 0,
      maxOccupancyRate: 0,
      minOccupancyRate: 0,
      totalCustomerCount: 0,
    },
  },
   cashFlowData: {
    totalPayments: 0,   // סה"כ תשלומים שהתקבלו
    totalExpenses: 0,   // סה"כ הוצאות
    cashFlow: 0,        // תזרים מזומנים נטו (תשלומים - הוצאות)
    breakdown: [],      // מערך של פרטי התזרים לפי תקופות או תאריכים
    revenueByCategory: [], // סיכום הכנסות לפי קטגוריה
  },
  };
}

import { WorkspaceService } from '../services/workspace.service'; // ייבוא שירות סביבת עבודה

import { WorkspaceType } from 'shared-types'; // תקן את הנתיב בהתאם
import { serviceGetAllInvoices } from "../services/invoice.service";

export async function generateOccupancyRevenueData(parameters: ReportParameters): Promise<ReportData | null> {
  const bookingService = new BookingService();
  const workspaceService = new WorkspaceService();
  // const invoiceService = new InvoiceService(); // וודא שזו הפונקציה המתאימה ב־Supabase

  const allBookings = await bookingService.getAllBooking();
  const allWorkspaces = await workspaceService.getAllWorkspace();

  console.log('generateOccupancyRevenueData - Start');
  console.log('Parameters:', parameters);
  console.log('All bookings count:', allBookings?.length);
  console.log('All workspaces count:', allWorkspaces?.length);

  if (!allBookings || !allWorkspaces) {
    console.warn('No bookings or workspaces data found');
    return null;
  }

  const from = new Date(parameters.dateRange.startDate);
  const to = new Date(parameters.dateRange.endDate);

  // סינון הזמנות לפי טווח תאריכים
  const filteredBookings = allBookings.filter((booking) => {
    const start = new Date(booking.startTime);
    return start >= from && start <= to;
  });
  console.log('Filtered bookings count by date:', filteredBookings.length);

  const relevantBookings = filteredBookings.filter(
    (b) => b.status === BookingStatus.APPROVED || b.status === BookingStatus.COMPLETED
  );
  console.log('Relevant bookings count by status (APPROVED or COMPLETED):', relevantBookings.length);

  const totalCustomerCount = new Set(relevantBookings.map((b) => b.customerId)).size;
  console.log('Total unique customers in relevant bookings:', totalCustomerCount);

  const totalSpaces = allWorkspaces.length;
  const occupiedSpaces = allWorkspaces.filter((ws) => ws.currentCustomerId).length;
  const openSpaceCount = totalSpaces - occupiedSpaces;
  const deskInRoomCount = allWorkspaces.filter((ws) => ws.type === WorkspaceType.DESK_IN_ROOM).length;
  const privateRoomCount = allWorkspaces.filter((ws) => ws.type === WorkspaceType.PRIVATE_ROOM1).length;
  
  const klikahCardCount = allWorkspaces.filter((ws) => ws.type === WorkspaceType.KLIKAH_CARD).length;

  console.log('Workspaces info:', {
    totalSpaces,
    occupiedSpaces,
    openSpaceCount,
    deskInRoomCount,
    privateRoomCount,
    klikahCardCount,
  });

  // שליפת כל החשבוניות בטווח תאריכים
  const allInvoices = await serviceGetAllInvoices();
  const filteredInvoices = allInvoices.filter((inv) => {
    const issueDate = new Date(inv.issue_date);
    return (
      issueDate >= from &&
      issueDate <= to &&
      [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID].includes(inv.status)
    );
  });

  // שליפת פריטי חשבוניות שרלוונטיים לתפוסה
  const occupancyItemTypes = [
    BillingItemType.WORKSPACE,
    BillingItemType.MEETING_ROOM,
    BillingItemType.LOUNGE,
  ];

  const relevantItems: BillingItem[] = filteredInvoices.flatMap((invoice) =>
    invoice.items.filter((item) => occupancyItemTypes.includes(item.type))
  );

  // קיבוץ פריטים לפי תקופה
  const revenueByPeriod = groupByPeriod(
    relevantItems,
    parameters.groupBy ?? 'month',
    'createdAt',
    'total_price'
  );

  // קיבוץ נתוני תפוסה לפי תקופה
  const occupancyByPeriod = groupByPeriod(
    relevantBookings,
    parameters.groupBy ?? 'month',
    'startTime',
    'totalHours'
  );
  console.log('Occupancy grouped by period:', occupancyByPeriod);

  // יצירת נתוני תפוסה עם הכנסות
  const occupancyData = occupancyByPeriod.map((group) => {
    const revenueGroup = revenueByPeriod.find((r) => r.label === group.label);
    const revenue = revenueGroup?.value || 0;

    return {
      date: group.label,
      totalSpaces,
      occupiedSpaces,
      openSpaceCount,
      deskInRoomCount,
      roomForThreeCount: 0, // הוספת שדה חדש במקרה הצורך
      privateRoomCount,
      klikahCardCount,
      occupancyRate: group.value,
      revenue, // הכנסות מהשכרה בפועל
    };
  });

  console.log('Occupancy data mapped:', occupancyData);

  const allOccupancyRates = occupancyData.map((d) => d.occupancyRate);
  const maxOccupancyRate = Math.max(...allOccupancyRates, 0);
  const minOccupancyRate = Math.min(...allOccupancyRates, 0);
  const avgOccupancyRate =
    allOccupancyRates.length > 0
      ? Math.round((allOccupancyRates.reduce((a, b) => a + b, 0) / allOccupancyRates.length) * 10) / 10
      : 0;

  console.log('Occupancy rates summary:', { maxOccupancyRate, minOccupancyRate, avgOccupancyRate });

  console.log('generateOccupancyRevenueData - End');

  return {
    revenueData: {
      totalRevenue: 0,
      membershipRevenue: 0,
      meetingRoomRevenue: 0,
      loungeRevenue: 0,
      otherRevenue: 0,
      breakdown: [],
    },
    expenseData: {
      totalExpenses: 0,
      expensesByCategory: [],
      monthlyTrend: [],
    },
    profitLossData: {
      totalRevenue: 0,
      totalExpenses: 0,
      totalProfit: 0,
      breakdown: [],
    },
    occupancyRevenueData: {
      occupancyData,
      summary: {
        averageOccupancyRate: avgOccupancyRate,
        maxOccupancyRate,
        minOccupancyRate,
        totalCustomerCount,
      },
    },
    cashFlowData: {
      totalPayments: 0,
      totalExpenses: 0,
      cashFlow: 0,
      breakdown: [],
      revenueByCategory: [],
    },
  };
};



// פונקציה לחישוב דוח רווח והפסד
export async function generateProfitLossData(parameters: ReportParameters): Promise<ReportData | null> {
  // הגדרת משתנים
  const groupBy = parameters.groupBy ?? 'month';

  // קבלת נתונים על הכנסות
  const revenueReport = await generateRevenueDataFromPayments({ ...parameters, groupBy });
  if (!revenueReport) return null;

  // קבלת נתונים על הוצאות
  const expenseReport = await generateExpenseData({ ...parameters, groupBy });
  if (!expenseReport) return null;

  const totalRevenue = revenueReport.revenueData.totalRevenue;
  const totalExpenses = expenseReport.expenseData.totalExpenses;
  const totalProfit = totalRevenue - totalExpenses;

  // יצירת מפה של ההכנסות לפי תקופה
  const revenueMap = new Map(revenueReport.revenueData.breakdown.map((r) => [r.date, r.totalRevenue]));
  
  // יצירת מפה של ההוצאות לפי תקופה
  const expenseMap = new Map(expenseReport.expenseData.monthlyTrend.map((e) => [e.month, e.totalExpenses]));

  // שילוב כל התקופות
  const allPeriods = Array.from(new Set([...revenueMap.keys(), ...expenseMap.keys()])).sort();

  // יצירת המידע המפורט לפי תקופה
  const breakdown = allPeriods.map((date) => {
    const revenue = revenueMap.get(date) || 0;
    const expenses = expenseMap.get(date) || 0;
    return {
      date,
      revenue,
      expenses,
      profit: revenue - expenses, // חישוב הרווח
    };
  });

  // החזרת נתונים
  return {
    revenueData: revenueReport.revenueData,
    expenseData: expenseReport.expenseData,
    profitLossData: {
      totalRevenue,
      totalExpenses,
      totalProfit,
      breakdown,
    },
    occupancyRevenueData: {
      occupancyData: [],
      summary: {
        averageOccupancyRate: 0,
        maxOccupancyRate: 0,
        minOccupancyRate: 0,
        totalCustomerCount: 0,
      },
    },
     cashFlowData: {
    totalPayments: 0,   // סה"כ תשלומים שהתקבלו
    totalExpenses: 0,   // סה"כ הוצאות
    cashFlow: 0,        // תזרים מזומנים נטו (תשלומים - הוצאות)
    breakdown: [],      // מערך של פרטי התזרים לפי תקופות או תאריכים
    revenueByCategory: [], // סיכום הכנסות לפי קטגוריה
  },
  };
}


export async function generateCashFlowData(parameters: ReportParameters): Promise<ReportData | null> {
  const paymentService = new PaymentService();
  const expenseService = new ExpenseService();

  const payments: Payment[] = await paymentService.getPaymentByDateAndCIds({
    dateFrom: parameters.dateRange?.startDate,
    dateTo: parameters.dateRange?.endDate,
    // customerIds: parameters.customerIds,
  });

  const expenses: Expense[] = (await expenseService.getExpenses({
    dateFrom: parameters.dateRange?.startDate,
    dateTo: parameters.dateRange?.endDate,
  })) || [];

  if (!payments.length && !expenses.length) return null;

  // חישובים סך הכול
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const cashFlow = totalPayments - totalExpenses;

  // קיבוץ לפי תקופות (למשל לפי חודש)
  const groupedPayments = groupByPeriod(payments, parameters.groupBy ?? 'month', 'date', 'amount');
  const groupedExpenses = groupByPeriod(expenses, parameters.groupBy ?? 'month', 'date', 'amount');

  const breakdown = groupedPayments.map((paymentGroup) => {
    const periodLabel = paymentGroup.label;
    const totalPaymentsInPeriod = paymentGroup.value;
    const totalExpensesInPeriod = groupedExpenses.find((e) => e.label === periodLabel)?.value || 0;

    return {
      date: periodLabel,
      totalPayments: totalPaymentsInPeriod,
      expenses: totalExpensesInPeriod,
      profit: totalPaymentsInPeriod - totalExpensesInPeriod,
    };
  });

  // הכנסות לפי קטגוריה מתוך התשלומים
  const revenueByCategoryRecord = await payments.reduce(async (accPromise, payment) => {
    const acc = await accPromise;
    const category = await getCategoryForPayment(payment);
    acc[category] = (acc[category] || 0) + payment.amount;
    return acc;
  }, Promise.resolve({} as Record<string, number>));

  const revenueByCategory = Object.entries(revenueByCategoryRecord).map(([category, amount]) => ({
    category,
    amount,
  }));

  return {
    revenueData: {
      totalRevenue: 0,
      membershipRevenue: 0,
      meetingRoomRevenue: 0,
      loungeRevenue: 0,
      otherRevenue: 0,
      breakdown: [],
    },
    expenseData: {
      totalExpenses: 0,
      expensesByCategory: [],
      monthlyTrend: [],
    },
    profitLossData: {
      totalRevenue: 0,
      totalExpenses,
      totalProfit: cashFlow,
      breakdown: [],
    },
    occupancyRevenueData: {
      occupancyData: [],
      summary: {
        averageOccupancyRate: 0,
        maxOccupancyRate: 0,
        minOccupancyRate: 0,
        totalCustomerCount: 0,
      },
    },
    cashFlowData: {
      totalPayments,
      totalExpenses,
      cashFlow,
      breakdown,
      revenueByCategory,
    },
  };
}
// פונקציה שמחזירה את הקטגוריה עבור תשלום לפי חשבונית (אם קיימת)
async function getCategoryForPayment(payment: Payment): Promise<string> {
  if (!payment.invoice_id) {
    return 'Other'; // אם אין חשבונית, נציג 'Other'
  }

  // אם יש invoice_id, נשלוף את החשבונית וניתן את הקטגוריה
  const invoice = await serviceGetInvoiceById(payment.invoice_id); // פונקציה אסינכרונית
  return invoice?.items?.[0]?.type || 'Other'; // אם אין קטגוריה, נחזיר 'Other'
}
