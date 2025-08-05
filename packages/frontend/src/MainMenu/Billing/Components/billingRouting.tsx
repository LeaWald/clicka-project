import { Route, Routes } from "react-router-dom";
import { ExpenseList } from "./expenseManagementSystem/expenseList";
import { FinancialReportsDashboard } from "./FinancialReports/FinancialReportsDashboard";
import { EditPayment } from "./editPayment";
import { ExpenseManagement } from "./expenseManagementSystem/expenseManagement";
// תוסיפי כאן קומפוננטות נוספות אם יש (כמו יצירת הוצאה חדשה וכו')
import DocumentTemplate from "../../DocumentManagement/Components/DocumentTemplate";
import AddDocumentTemplate from "../../DocumentManagement/Components/AddDocumentTemplate";
// תוסיפי כאן קומפוננטות נוספות אם יש (כמו יצירת הוצאה חדשה וכו')
export const BillingRouting = () => {
    return (
        <Routes>
            <Route path="/" element={<ExpenseList />} />
            <Route path="/financeReports" element={<FinancialReportsDashboard />} />
            <Route path="/document-templates" element={<DocumentTemplate />} />
        <Route path="/document-templates/edit/:id" element={<DocumentTemplate />} />
        <Route path="/document-templates/view/:id" element={<DocumentTemplate />} />
        <Route path="/document-templates/preview/:id" element={<DocumentTemplate />} />
        <Route path="/document-templates/add" element={<AddDocumentTemplate />} />
            <Route path="/expenses" element={<ExpenseManagement />} />
            <Route path="/payment/edit/:id" element={<EditPayment />} />
        </Routes>
    );
};