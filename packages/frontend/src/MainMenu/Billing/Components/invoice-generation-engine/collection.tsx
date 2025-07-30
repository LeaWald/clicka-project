import React, { useEffect, useState, useRef } from "react";
import { useInvoiceStore } from "../../../../Stores/Billing/invoiceStore";
import TableNoActions, { TableColumn } from "../../../../Common/Components/BaseComponents/TableNoActions";
import { ExportButtons } from "../../../../Common/Components/BaseComponents/ExportButtons";
interface CollectionItem {
    name: string;
    email: string;
    business_name: string;
    customer_payment_method: {
        credit_card_holder_id_number: string;
        credit_card_expiry: string;
        credit_card_holder_phone: string;
        credit_card_number: string;
    }[];
    invoice: {
        subtotal: number;
        issue_date: string;
    }[];
}
export const Collection = () => {
    const { collection, getCustomersCollection, loading, error } = useInvoiceStore();
    const [monthInput, setMonthInput] = useState<string>("");
    const [yearInput, setYearInput] = useState<string>("");
    const [phoneInput, setPhoneInput] = useState<string>("");
    const reportRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        getCustomersCollection();
    }, [getCustomersCollection]);
    // סינון לפי חודש, שנה ומספר טלפון (אם הוזן ערך)
    const filteredCollection = collection.filter((item) => {
        const issueDate = item.invoice?.[0]?.issue_date;
        if (!issueDate) return true;
        const date = new Date(issueDate);
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear().toString();
        const monthMatch = monthInput ? month === monthInput.padStart(2, "0") : true;
        const yearMatch = yearInput ? year === yearInput : true;
        const phoneMatch = phoneInput ? item.customer_payment_method?.[0]?.credit_card_holder_phone.includes(phoneInput) : true;
        return monthMatch && yearMatch && phoneMatch;
    });
    // נתונים לייצוא (רק מה שמוצג בטבלה)
    const dataToExport = filteredCollection.map(item => ({
        "שם": item.name,
        "אימייל": item.email,
        "שם עסק": item.business_name,
        "ת.ז. בעל כרטיס": item.customer_payment_method?.[0]?.credit_card_holder_id_number || "",
        "טלפון בעל כרטיס": item.customer_payment_method?.[0]?.credit_card_holder_phone || "",
        "תוקף כרטיס": item.customer_payment_method?.[0]?.credit_card_expiry || "",
        "מספר כרטיס": item.customer_payment_method?.[0]?.credit_card_number || "",
        "סכום חיוב": item.invoice?.[0]?.subtotal ?? "",
        "תאריך הנפקה": item.invoice?.[0]?.issue_date || ""
    }));
    const columns: TableColumn<CollectionItem>[] = [
        { header: "שם", accessor: "name" },
        { header: "אימייל", accessor: "email" },
        { header: "שם עסק", accessor: "business_name" },
        {
            header: "ת.ז. בעל כרטיס",
            accessor: "customer_payment_method",
            render: (value) => value?.[0]?.credit_card_holder_id_number || "-"
        },
        {
            header: "טלפון בעל כרטיס",
            accessor: "customer_payment_method",
            render: (value) => value?.[0]?.credit_card_holder_phone || "-"
        },
        {
            header: "תוקף כרטיס",
            accessor: "customer_payment_method",
            render: (value) => value?.[0]?.credit_card_expiry || "-"
        },
        {
            header: "מספר כרטיס",
            accessor: "customer_payment_method",
            render: (value) => value?.[0]?.credit_card_number?.replace(/\d(?=\d{4})/g, "*") || "-"
        },
        {
            header: "סכום חיוב",
            accessor: "invoice",
            render: (value) => `₪${value?.[0]?.subtotal?.toFixed(2) || "0.00"}`
        },
        {
            header: "תאריך הנפקה",
            accessor: "invoice",
            render: (value) => value?.[0]?.issue_date || "-"
        }
    ];
    if (loading) return <div>טוען נתונים...</div>;
    if (error) return <div>שגיאה: {error}</div>;
    return (
        <div className="p-4" ref={reportRef}>
            <h2 className="text-xl font-bold mb-4">נתוני גבייה</h2>
            <div className="flex gap-4 mb-4">
                {/* שנה */}
                <input
                    type="month"
                    value={yearInput ? `${yearInput}-${monthInput.padStart(2, "0")}` : ""}
                    onChange={e => {
                        const [year, month] = e.target.value.split("-");
                        setYearInput(year);
                        setMonthInput(month);
                    }}
                    style={{ width: 180 }}
                />
                {/* טלפון */}
                <input
                    type="text"
                    placeholder="טלפון (למשל 054)"
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value)}
                    style={{ width: 120 }}
                />
                {/* כפתור ייצוא */}
                <ExportButtons
                    title="collection"
                    exportData={dataToExport}
                    refContent={reportRef}
                    showPDF={false}
                />
            </div>
            <TableNoActions columns={columns} data={filteredCollection} />
        </div>
    );
};
export default Collection;