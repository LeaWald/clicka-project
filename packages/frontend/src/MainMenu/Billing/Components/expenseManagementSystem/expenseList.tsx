import { Button } from "../../../../Common/Components/BaseComponents/Button";
import {
    Table,
    TableColumn,
} from "../../../../Common/Components/BaseComponents/Table";
import { Expense } from "shared-types";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExpenseDetails } from "./expenseDetails";
import axiosInstance from "../../../../Service/Axios"; // עדכן לפי נתיב הפרויקט

interface ValuesToTable {
    id: string;
    vendor_name: string;
    category: string;
    amount: number;
    status: string;
    date: string;
}

export const ExpenseList = () => {
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const loaderRef = useRef<HTMLDivElement | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const fetchExpenses = async () => {
        try {
            const response = await axiosInstance.get("/expenses/by-page", {
                params: { page, limit: 50 },
            });

            const data: Expense[] = response.data;

            if (data.length < 50) setHasMore(false);

            setExpenses((prev) => {
                const ids = new Set(prev.map((e) => e.id));
                const uniqueNew = data.filter((expense) => !ids.has(expense.id));
                return [...prev, ...uniqueNew];
            });

            setAllExpenses((prev) => {
                const ids = new Set(prev.map((e) => e.id));
                const uniqueNew = data.filter((expense) => !ids.has(expense.id));
                return [...prev, ...uniqueNew];
            });
        } catch (error) {
            console.error("Error fetching expenses:", error);
        }
    };

    useEffect(() => {
        if (!isSearching) {
            fetchExpenses();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, isSearching]);

    useEffect(() => {
        if (!loaderRef.current || !hasMore || isSearching) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setPage((prev) => prev + 1);
            }
        });
        observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [hasMore, isSearching]);

    const handleSearch = async (term: string) => {
        setSearchTerm(term);

        if (!term.trim()) {
            setIsSearching(false);
            setExpenses(allExpenses);
            setPage(1);
            setHasMore(true);
            return;
        }

        setIsSearching(true);

        const filtered = allExpenses.filter(
            (expense) =>
                expense.vendor_name?.toLowerCase().includes(term.toLowerCase()) ||
                expense.description?.toLowerCase().includes(term.toLowerCase()) ||
                String(expense.category)?.toLowerCase().includes(term.toLowerCase())
        );

        if (filtered.length > 0) {
            setExpenses(filtered);
        } else {
            try {
                const response = await axiosInstance.get("/expenses/filter", {
                    params: { q: term, page: 1, limit: 50, excludePettyCash: true },
                });
                setExpenses(response.data);
            } catch (error) {
                console.error("Error searching from server:", error);
            }
        }
    };

    const deleteCurrentExpense = async (id: string) => {
        try {
            await axiosInstance.delete(`/expenses/${id}`);
            setExpenses([]);
            setAllExpenses([]);
            setPage(1);
            setHasMore(true);
            fetchExpenses();
            alert("הוצאה נמחקה בהצלחה");
        } catch (error) {
            console.error("שגיאה במחיקת הוצאה:", error);
            alert("מחיקה נכשלה");
        }
    };

    const valuesToTable: ValuesToTable[] = expenses.map((expense) => ({
        id: expense.id!,
        vendor_name: expense.vendor_name,
        category: expense.category ? String(expense.category) : "",
        amount: expense.amount,
        status: expense.status,
        date: new Date(expense.date).toLocaleDateString("he-IL"),
    }));

    const Columns: TableColumn<ValuesToTable>[] = [
        { header: "ספק", accessor: "vendor_name" },
        { header: "קטגוריה", accessor: "category" },
        { header: "סכום", accessor: "amount" },
        { header: "סטטוס", accessor: "status" },
        { header: "תאריך", accessor: "date" },
        {
            header: "פרטים",
            accessor: "id",
            render: (value, row) => (
                <Button variant="primary" size="sm" onClick={() => setSelectedId(row.id)}>
                    פרטים
                </Button>
            ),
        },
    ];

    return (
        <div style={{ direction: "rtl", padding: "20px" }}>
            <h2 className="text-3xl font-bold text-center text-blue-600 my-4">הוצאות</h2>
            <Button variant="primary" size="sm" onClick={() => navigate("expense-form")}>
                הוספת הוצאה חדשה
            </Button>
            <br />
            <br />
            <input
                type="text"
                placeholder="חפש לפי ספק, תיאור או קטגוריה"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ padding: "8px", width: "250px", marginBottom: "16px" }}
            />
            <Table<ValuesToTable>
                data={valuesToTable}
                columns={Columns}
                onDelete={(val) => deleteCurrentExpense(val.id)}
                onUpdate={(val) => {
                    navigate(`/expenses/expense-form/${val.id}`);
                }}
                renderActions={() => null}
            />
            {selectedId && (
                <ExpenseDetails id={selectedId} onClose={() => setSelectedId(null)} />
            )}
            <div ref={loaderRef} style={{ height: "1px" }} />
        </div>
    );
};