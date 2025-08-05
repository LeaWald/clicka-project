// import type{ ID } from "shared-types";
// import { useExpenseStore } from "../../../../Stores/Billing/expenseStore";
import { PettyCashSummary } from "./PettyCashSummary";
import { PettyCashAnalytics } from "./PettyCashAnalytics";
import { CreateExpenseModal } from "./expenseForm";
import { Button } from "../../../../Common/Components/BaseComponents/Button";
import { useState } from "react";
// import { ExpenseList } from "./expenseList";
export const ExpenseManagement = () => {
    const [activeTab, setActiveTab] = useState<'summary' | 'analytics'>('summary');
    const [isModalOpen, setIsModalOpen] = useState(false);
    // const { fetchExpenses } = useExpenseStore();
    //in the store
    //functions
    // רענון רשימת הוצאות
    // const refreshExpenseList = (): Promise<void> => {
    //     return  fetchExpenses();
    // };
    // סינון הוצאות לפי קטגוריה/ספק/תאריכים
    // const filterExpenses = (filter: ExpenseFilter): Promise<Expense[]> => {
    //     return {} as Promise<Expense[]>;
    // };
    // מעבר לכרטיס הוצאה
    // const handleSelectExpense = (expenseId: ID): void => { };
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">ניהול הוצאות</h1>
            {/* טאבים */}
            <div className="mb-6">
                <div className="flex border-b">
                    <button
                        className={`px-4 py-2 font-medium ${activeTab === 'summary' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('summary')}
                    >
                        סיכום כללי
                    </button>
                    <button
                        className={`px-4 py-2 font-medium ${activeTab === 'analytics' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('analytics')}
                    >
                        ניתוח מתקדם
                    </button>
                </div>
            </div>
            {/* כפתור הוספת הוצאה */}
            <div className="mb-6">
                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsModalOpen(true)}
                >
                    הוסף הוצאה/הכנסה חדשה
                </Button>
            </div>
            {/* מודאל הוספת הוצאה */}
            <CreateExpenseModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                isPettyCash={true}
            />
            {/* תוכן לפי טאב */}
            <div className="mb-8">
                {activeTab === 'summary' && <PettyCashSummary />}
                {activeTab === 'analytics' && <PettyCashAnalytics />}
            </div>
          {/* <ExpenseList /> */}
        </div>
    )
}