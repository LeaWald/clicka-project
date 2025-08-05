import React, { useEffect, useState } from "react";
import axios from "axios";
import type { Expense } from "shared-types";
interface ExpenseDetailsProps {
  id: string;
  onClose: () => void;
}
function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
 return new Date(dateStr).toLocaleDateString("he-IL");
}
export const ExpenseDetails: React.FC<ExpenseDetailsProps> = ({ id, onClose }) => {
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
 useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/expenses/getExpenseById/${id}`)
      .then((res) => setExpense(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8">טוען...</div>;
  if (!expense) return <div className="p-8">לא נמצאה הוצאה</div>;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 min-w-[350px] relative max-w-lg">
        <button
          onClick={onClose}
          className="absolute left-4 top-4 text-lg font-bold text-gray-500 hover:text-red-500"
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold mb-4 text-blue-700">פרטי הוצאה</h2>
        <div className="space-y-2 text-right">
          <div><b>מזהה הוצאה:</b> {expense.id}</div>
          <div><b>מזהה ספק:</b> {expense.vendor_id}</div>
          <div><b>שם ספק:</b> {expense.vendor_name}</div>
          <div><b>קטגוריה:</b> {expense.category?.name ?? expense.category_id ?? "-"}</div>
          <div><b>תיאור:</b> {expense.description}</div>
          <div><b>סכום:</b> {expense.amount} ₪</div>
          <div><b>מע״מ:</b> {expense.tax ?? "-"}</div>
          <div><b>תאריך הוצאה:</b> {formatDate(expense.date)}</div>
          <div><b>תאריך יעד לתשלום:</b> {formatDate(expense.due_date)}</div>
          <div><b>תאריך תשלום בפועל:</b> {formatDate(expense.paid_date)}</div>
          <div><b>סטטוס:</b> {expense.status}</div>
          <div><b>אמצעי תשלום:</b> {expense.payment_method ?? "-"}</div>
          <div><b>אסמכתא:</b> {expense.reference ?? "-"}</div>
          <div><b>מספר חשבונית:</b> {expense.invoice_number ?? "-"}</div>
          <div>
            <b>קובץ חשבונית:</b>{" "}
            {expense.invoice_file ? (
              <a
                href={expense.invoice_file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                לצפייה
              </a>
            ) : (
              "-"
            )}
          </div>
          <div>
            <b>קובץ קבלה:</b>{" "}
            {expense.receipt_file ? (
              <a
                href={expense.receipt_file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                לצפייה
              </a>
            ) : (
              "-"
            )}
          </div>
            <div><b>הערות:</b> {expense.notes ?? "-"}</div>
          <div><b>נוצר בתאריך:</b> {formatDate(expense.createdAt)}</div>
          <div><b>עודכן בתאריך:</b> {formatDate(expense.updatedAt)}</div>
        </div>
      </div>
    </div>
  );
};
