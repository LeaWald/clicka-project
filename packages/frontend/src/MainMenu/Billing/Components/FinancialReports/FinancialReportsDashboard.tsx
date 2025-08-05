// קובץ React: FinancialReportsDashboard.tsx
// כולל הסרה של האפשרות לבחור בדוח "הכנסות תפוסה" ללא שינוי ב־ReportType

import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import axios from 'axios';
// import { useTheme } from '../../../../Common/Components/themeConfig';
import { Form } from '../../../../Common/Components/BaseComponents/Form';
import { InputField } from '../../../../Common/Components/BaseComponents/Input';
import { Button } from '../../../../Common/Components/BaseComponents/Button';
import { ChartDisplay } from '../../../../Common/Components/BaseComponents/Graph';
import { ExportButtons } from '../../../../Common/Components/BaseComponents/ExportButtons';
import { SelectField } from '../../../../Common/Components/BaseComponents/Select';
import { useFinancialReportsStore } from '../../../../Stores/Billing/financialReports1';
import { ReportType, ReportParameters } from 'shared-types';

// Define ExpenseCategory as a runtime enum for zod validation
export enum ExpenseCategory {
  RENT = 'RENT',
  UTILITIES = 'UTILITIES',
  CLEANING = 'CLEANING',
  MAINTENANCE = 'MAINTENANCE',
  OFFICE_SUPPLIES = 'OFFICE_SUPPLIES',
  REFRESHMENTS = 'REFRESHMENTS',
  MARKETING = 'MARKETING',
  SALARIES = 'SALARIES',
  INSURANCE = 'INSURANCE',
  SOFTWARE = 'SOFTWARE',
  PROFESSIONAL_SERVICES = 'PROFESSIONAL_SERVICES',
  TAXES = 'TAXES',
  EVENTS = 'EVENTS',
  FURNITURE = 'FURNITURE',
  EQUIPMENT = 'EQUIPMENT',
  PETTY_CASH = 'PETTY_CASH',
  OTHER = 'OTHER',
}

// טיפוס כולל vendorId רק בצד הקליינט
type ExtendedReportParameters = ReportParameters & {
  vendorId?: string;
};

const ReportFormSchema = z.object({
  dateRange: z.object({
    startDate: z.string().min(1, 'יש להזין תאריך התחלה'),
    endDate: z.string().min(1, 'יש להזין תאריך סיום'),
  }),
  groupBy: z.enum(['month', 'quarter', 'year']).optional(),
  categories: z.array(z.nativeEnum(ExpenseCategory)).optional(),
  customerIds: z.array(z.string()).optional(),
  includeProjections: z.boolean().optional(),
});

const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  RENT: 'שכירות',
  UTILITIES: 'חשבונות',
  CLEANING: 'ניקיון',
  MAINTENANCE: 'תחזוקה',
  OFFICE_SUPPLIES: 'ציוד משרדי',
  REFRESHMENTS: 'כיבוד',
  MARKETING: 'שיווק',
  SALARIES: 'משכורות',
  INSURANCE: 'ביטוחים',
  SOFTWARE: 'תוכנה',
  PROFESSIONAL_SERVICES: 'שירותים מקצועיים',
  TAXES: 'מיסים',
  EVENTS: 'אירועים',
  FURNITURE: 'ריהוט',
  EQUIPMENT: 'ציוד',
  PETTY_CASH: 'קופה קטנה',
  OTHER: 'אחר',
};

const reportTypeLabels: Record<ReportType, string> = {
  REVENUE: 'הכנסות',
  EXPENSES: 'הוצאות',
  PROFIT_LOSS: 'רווח והפסד',
  CASH_FLOW: 'תזרים מזומנים',
  CUSTOMER_AGING: '',
  OCCUPANCY_REVENUE: 'הכנסות תפוסה',
};

export const FinancialReportsDashboard: React.FC = () => {
  const methods = useForm<ExtendedReportParameters>({
    // resolver: zodResolver(ReportFormSchema),
    defaultValues: {
      dateRange: { startDate: '', endDate: '' },
      categories: [],
      customerIds: [],
    },
  });
  // const { theme } = useTheme();  // גישה לנושא הצבעים

  const fetchReport = useFinancialReportsStore((s) => s.fetchReport);
  const reportData = useFinancialReportsStore((s) => s.reportData);
  const loading = useFinancialReportsStore((s) => s.loading);
  const error = useFinancialReportsStore((s) => s.error);
  const [loadingReport, setLoadingReport] = useState(false);
  const [selectedType, setSelectedType] = useState<ReportType>(ReportType.REVENUE);
  const [selectedChartType, setSelectedChartType] = useState<'bar' | 'pie' | 'line'>('bar');
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const exportContentRef = useRef<HTMLDivElement>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // תרגום שמות עמודות בטבלה בלבד — לא משפיע על הגרף
  const columnTranslations: Record<string, string> = {
    // RevenueReportData.breakdown
    date: 'תאריך',
    totalRevenue: 'סה״כ הכנסות',
    membershipRevenue: 'הכנסות ממנויים',
    meetingRoomRevenue: 'הכנסות מחדרי ישיבות',
    loungeRevenue: 'הכנסות מטרקלין',
    otherRevenue: 'הכנסות נוספות',

    // ExpenseReportData.monthlyTrend
    month: 'חודש',
    totalExpenses: 'סה״כ הוצאות',
    'קטגוריה 1': 'קטגוריה 1',
    'סכום 1': 'סכום 1',
    'קטגוריה 2': 'קטגוריה 2',
    'סכום 2': 'סכום 2',
    'קטגוריה 3': 'קטגוריה 3',
    'סכום 3': 'סכום 3',

    // ProfitLossReportData.breakdown
    revenue: 'הכנסות',
    expenses: 'הוצאות',
    profit: 'רווח',

    // CashFlowReportData.breakdown
    totalPayments: 'סה״כ תשלומים',

    // OccupancyRevenueReportData.occupancyData
    // totalSpaces: 'סה״כ מקומות',
    // occupiedSpaces: 'מקומות תפוסים',
    // openSpaceCount: 'עמדות Open Space',
    // deskInRoomCount: 'שולחנות בחדרים',
    // privateRoomCount: 'חדרים פרטיים',
    // roomForThreeCount: 'חדר לשלושה',
    // klikahCardCount: 'חברות קליקה',
    // occupancyRate: 'אחוז תפוסה',
    // revenue: 'הכנסה מתפוסה',

    // מידע כללי
    name: 'שם',
    percentOfTotal: 'אחוז מהסך הכולל',
  };
  const [color, setColor] = useState("#3498db"); // צבע התחלתי

  useEffect(() => {
    const interval = setInterval(() => {
      setColor(prevColor => prevColor === "#3498db" ? "#e7ae3cff" : "#3498db");
    }, 1000);


    async function fetchEntities() {
      try {
        const [customerRes, vendorRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/customers/page?page=1&limit=10000`, { withCredentials: true }),
          axios.get(`${process.env.REACT_APP_API_URL}/vendor`, { withCredentials: true }),
        ]);
        setCustomers(customerRes.data || []);
        setVendors(vendorRes.data || []);
      } catch { }
    }
    fetchEntities();
    return () => clearInterval(interval);  // חשוב לנקות את ה-interval אחרי השימוש

  }, []);

  const onSubmit = async (data: ExtendedReportParameters) => {
    const { startDate, endDate } = data.dateRange || {};
    const { groupBy } = data;

    if (!startDate || !endDate || !groupBy) {
      setFormError('יש למלא טווח תאריכים וקיבוץ לפי לפני יצירת הדוח');
      return;
    }
    setFormError(null); // איפוס הודעת שגיאה אם הכל תקין
    setLoadingReport(true);
    const transformed = {
      ...data,
      vendorId: selectedType === ReportType.EXPENSES ? data.customerIds?.[0] : undefined,
    };
    await fetchReport(selectedType, transformed);
    setLoadingReport(false);
  };

  const getChartData = () => {
    switch (selectedType) {
      case ReportType.REVENUE:
        return reportData?.revenueData?.breakdown?.map((i) => ({ label: i.date, value: i.totalRevenue })) || [];
      case ReportType.EXPENSES:
        return reportData?.expenseData?.monthlyTrend?.map((i) => ({ label: i.month, value: i.totalExpenses })) || [];
      case ReportType.PROFIT_LOSS:
        return reportData?.profitLossData?.breakdown?.map((i) => ({ label: i.date, value: i.profit })) || [];
      case ReportType.CASH_FLOW:
        return reportData?.cashFlowData?.breakdown?.map((i) => ({ label: i.date, value: i.totalPayments })) || [];
      default:
        return [];
    }
  };

  const getReportTitle = (): string => {
    const values = methods.getValues();
    const typeLabel = reportTypeLabels[selectedType];
    const from = values.dateRange?.startDate;
    const to = values.dateRange?.endDate;

    const parts: string[] = [];
    if (from && to) parts.push(`בתקופה ${from} עד ${to}`);

    const customerIds = values.customerIds ?? [];
    if (selectedType === ReportType.REVENUE && customerIds.length) {
      const selectedNames = customers.filter((c) => customerIds.includes(c.id)).map((c) => c.name);
      parts.push(`ללקוחות: ${selectedNames.join(', ')}`);
    }

    if (selectedType === ReportType.EXPENSES) {
      const vendorIds = values.customerIds ?? [];
      if (vendorIds.length) {
        const vendorNames = vendors.filter((v) => vendorIds.includes(v.id)).map((v) => v.name);
        parts.push(`עבור ספקים: ${vendorNames.join(', ')}`);
      }
      if (values.categories?.length) {
        const categoryNames = values.categories.map((cat) => expenseCategoryLabels[cat as ExpenseCategory]);
        parts.push(`סוגי הוצאה: ${categoryNames.join(', ')}`);
      }
    }

    return `דוח ${typeLabel} ${parts.length ? '— ' + parts.join(' | ') : ''}`;
  };

  const formatNumber = (value: number): string => (value < 0 ? `${Math.abs(value)}-` : value.toString());

  const { data: fullTableData, columns: fullTableColumns } = (() => {
    let data: any[] = [];
    let columns: { header: string; accessor: string }[] = [];

    if (!reportData) return { data, columns };

    if (selectedType === ReportType.REVENUE && reportData.revenueData?.breakdown?.length) {
      data = reportData.revenueData.breakdown;
      columns = Object.keys(data[0]).map((key) => ({
        header: columnTranslations[key] || key,
        accessor: key,
      }));

    } else if (selectedType === ReportType.EXPENSES && reportData.expenseData?.monthlyTrend?.length) {
      data = reportData.expenseData.monthlyTrend.map((item) => {
        const top = item.topCategories || [];
        return {
          month: item.month,
          totalExpenses: item.totalExpenses,
          'קטגוריה 1': top[0]?.category || '',
          'סכום 1': top[0]?.amount || '',
          'קטגוריה 2': top[1]?.category || '',
          'סכום 2': top[1]?.amount || '',
          'קטגוריה 3': top[2]?.category || '',
          'סכום 3': top[2]?.amount || '',
        };
      });
      columns = Object.keys(data[0]).map((key) => ({
        header: columnTranslations[key] || key,
        accessor: key,
      }));

    } else if (selectedType === ReportType.PROFIT_LOSS && reportData.profitLossData?.breakdown?.length) {
      data = reportData.profitLossData.breakdown;
      columns = Object.keys(data[0]).map((key) => ({
        header: columnTranslations[key] || key,
        accessor: key,
      }));
    } else if (selectedType === ReportType.CASH_FLOW && reportData.cashFlowData?.breakdown?.length) {
      data = reportData.cashFlowData.breakdown;
      columns = Object.keys(data[0]).map((key) => ({
        header: columnTranslations[key] || key,
        accessor: key,
      }));
    }

    return { data, columns };
  })();

  return (<>
    <Form label="טופס דוחות פיננסיים" schema={ReportFormSchema} onSubmit={onSubmit} methods={methods}>

      <div className="flex flex-col gap-4">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as ReportType)}
          className="w-full px-2 py-1 border rounded"
        >
          {Object.values(ReportType)
            .filter((type) => type !== ReportType.OCCUPANCY_REVENUE)
            .map((type) =>
              reportTypeLabels[type] ? (
                <option key={type} value={type}>
                  {reportTypeLabels[type]}
                </option>
              ) : null
            )}
        </select>

        <InputField type="date" name="dateRange.startDate" label="מתאריך" required />
        <InputField type="date" name="dateRange.endDate" label="עד תאריך" required />

        <SelectField
          name="groupBy"
          label="בחר קיבוץ לפי"
          options={[
            { label: 'חודשי', value: 'month' },
            { label: 'רבעוני', value: 'quarter' },
            { label: 'שנתי', value: 'year' },
          ]}
        />

        {selectedType === ReportType.REVENUE && (
          <div>
            <label className="font-medium mb-1 block">בחר לקוחות:</label>
            <details className="w-full border rounded p-2">
              <summary className="cursor-pointer select-none">בחר מרשימת הלקוחות</summary>
              <div className="mt-2 flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                {customers.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={methods.getValues('customerIds')?.includes(c.id)}
                      value={c.id}
                      {...methods.register('customerIds')}
                      onChange={(e) => {
                        const current = methods.getValues("customerIds") ?? [];
                        methods.setValue("customerIds", [...current, c.id.toString()]);
                      }}

                      className="accent-blue-600"
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </details>
          </div>
        )}


 {selectedType === ReportType.EXPENSES && (
  <div className="flex flex-col gap-4">
    {/* בחר ספק */}
    <div>
      <label className="font-medium mb-1 block">בחר ספק:</label>
      <details className="w-full border rounded p-2">
        <summary className="cursor-pointer select-none">בחר מרשימת הספקים</summary>
        <div className="mt-2 flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
          {vendors.map((v) => (
            <label key={v.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={methods.getValues('customerIds')?.includes(v.id)}
                value={v.id}
                {...methods.register('customerIds')}
                onChange={(e) => {
                  const current = methods.getValues('customerIds') ?? [];
                  const newValue = e.target.checked
                    ? [...current, v.id.toString()]
                    : current.filter((id: string) => id !== v.id.toString());
                  methods.setValue('customerIds', newValue);
                }}
                className="accent-blue-600"
              />
              {v.name}
            </label>
          ))}
        </div>
      </details>
    </div>

    {/* בחר סוג הוצאה */}
    <div>
      <label className="font-medium mb-1 block">בחר סוג הוצאה:</label>
      <details className="w-full border rounded p-2">
        <summary className="cursor-pointer select-none">בחר מתוך הקטגוריות</summary>
        <div className="mt-2 flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
          {Object.values(ExpenseCategory).map((cat) => (
            <label key={cat} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={methods.getValues('categories')?.includes(cat)}
                value={cat}
                {...methods.register('categories')}
                onChange={(e) => {
                  const current = methods.getValues('categories') ?? [];
                  const newValue = e.target.checked
                    ? [...current, cat]
                    : current.filter((c: string) => c !== cat);
                  methods.setValue('categories', newValue);
                }}
                className="accent-blue-600"
              />
              {expenseCategoryLabels[cat]}
            </label>
          ))}
        </div>
      </details>
    </div>
  </div>
)}

<div style={{textAlign: 'center'}}>
        <Button type="submit"  disabled={loading} className="w-full">
          {loading ? 'טוען...' : 'צור דוח'}
        </Button>
        </div>
        {formError && <p className="text-red-600 mt-2">{formError}</p>}
        <div>
          {/* הצגת הודעת טעינה רק כשיש טעינה */}
          {loadingReport && (
            <div
              style={{
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.3)', // רקע כהה
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999,
              }}
            >
              <div
                style={{
                  backgroundColor: '#fff',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                {/* אנימציה של סיבוב */}
                <div
                  style={{
                    border: '8px solid #f3f3f3',
                    borderTop: `8px solid ${color}`, // השפעת הצבע על הסיבוב
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    animation: 'spin 2s linear infinite',
                    marginBottom: '10px',
                  }}
                ></div>

                {/* טקסט עם שינוי צבעים */}
                <p
                  style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: color,  // הצגת הצבע המשתנה
                    animation: 'colorChange 2s infinite alternate',  // אנימציה לשינוי צבע
                  }}
                >
                  יצירת הדוח... אנא המתן
                </p>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-red-600">{error.message}</p>}

        <label>בחר סוג גרף:</label>
        <select
          value={selectedChartType}
          onChange={(e) => setSelectedChartType(e.target.value as 'bar' | 'pie' | 'line')}
          className="w-full px-2 py-1 border rounded"
        >
          <option value="bar">גרף עמודות</option>
          {selectedType !== ReportType.PROFIT_LOSS && (
            <option value="pie">גרף עוגה</option>
          )}
          <option value="line">גרף קו</option>
        </select>

        {reportData && (
          <div ref={exportContentRef} className="mt-8 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">{getReportTitle()}</h2>
            <ChartDisplay type={selectedChartType} data={getChartData()} />
            <ExportButtons refContent={exportContentRef} exportData={fullTableData} title={`דוח_${selectedType}`} />

            <div className="mt-4">
              <table className="table-auto border border-gray-300 text-sm w-full">
                <thead className="bg-gray-100">
                  <tr>
                    {fullTableColumns.map((col, idx) => (
                      <th key={idx} className="border px-4 py-2 font-semibold text-right">
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fullTableData.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-gray-50">
                      {fullTableColumns.map((col, colIdx) => (
                        <td key={colIdx} className="border px-4 py-2 text-right">
                          {typeof row[col.accessor] === 'number'
                            ? formatNumber(row[col.accessor])
                            : String(row[col.accessor] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Form>
    </>
  );
};