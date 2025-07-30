import { Route, Routes } from "react-router-dom";
import { ExpenseList } from "./expenseManagementSystem/expenseList";
import { FinancialReportsDashboard } from "./FinancialReports/FinancialReportsDashboard";
import { EditPayment } from "./editPayment";
// תוסיפי כאן קומפוננטות נוספות אם יש (כמו יצירת הוצאה חדשה וכו')
export const BillingRouting = () => {
    return (
        <Routes>
            <Route path="/" element={<ExpenseList />} />
            <Route path="/financeReports" element={<FinancialReportsDashboard />} />
            <Route path="/payment/edit/:id" element={<EditPayment />} />
        </Routes>
    );
};