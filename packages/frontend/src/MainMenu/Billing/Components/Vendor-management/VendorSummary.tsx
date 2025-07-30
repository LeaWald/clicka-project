import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { Table } from "../../../../Common/Components/BaseComponents/Table";
import { useVendorsStore } from "../../../../Stores/Billing/vendorsStore";
import { Vendor, DocumentType } from "shared-types";
import FileUploader, { FileItem } from '../../../../Common/Components/BaseComponents/FileUploader/FileUploader';
import { SelectField } from "../../../../Common/Components/BaseComponents/Select";
import axiosInstance from "../../../../Service/Axios";

type VendorSummaryProps = {
  vendor: Vendor & { folderId?: string };
};

export interface FileUploaderProps {
  onFilesUploaded?: (files: FileItem[]) => void;
  onPathReady: (path: string) => void;
  vendorName: string;
  documentCategory: string;
}

export const FolderPathGenerator: React.FC<FileUploaderProps> = ({ vendorName, documentCategory, onPathReady }) => {
  useEffect(() => {
    if (vendorName && documentCategory) {
      const path = `ספקים/${vendorName}/${documentCategory}`;
      onPathReady(path);
    }
  }, [vendorName, documentCategory, onPathReady]);

  return null;
};

export default function VendorSummary({ vendor }: VendorSummaryProps) {
  const navigate = useNavigate();
  const { fetchExpensesByVendorId, expenses, deleteVendor } = useVendorsStore();

  const [fileCategory, setFileCategory] = useState("חשבוניות ספקים");
  const [folderPath, setFolderPath] = useState("");

  const methods = useForm({
    defaultValues: {
      documentType: DocumentType.INVOICE,
    }
  });

  useEffect(() => {
    fetchExpensesByVendorId(vendor.id);
  }, [vendor.id, fetchExpensesByVendorId]);

  const vendorExpenses = expenses.filter((e) => e.vendor_id === vendor.id);
  const expenseCount = vendorExpenses.length;
  const totalExpenses = vendorExpenses.reduce((sum, e) => sum + e.amount, 0);
  const averageExpense = expenseCount > 0 ? parseFloat((totalExpenses / expenseCount).toFixed(2)) : 0;
  const lastExpenseDate = expenseCount > 0 ? vendorExpenses[expenseCount - 1].date : "-";

  const handleDeleteVendor = async () => {
    if (window.confirm("האם למחוק את הספק?")) {
      await deleteVendor(vendor.id);
      navigate("/vendor");
    }
  };

  useEffect(() => {
    const subscription = methods.watch((value) => {
      if (value.documentType) {
        setFileCategory(value.documentType);
      }
    });
    return () => subscription.unsubscribe();
  }, [methods]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((data) => {
        console.log("Form submitted with data:", data);
      })}>
        <div className="p-4 border-t mt-4 text-sm">

          {/* פרטי ספק */}
          <div className="grid grid-cols-2 gap-4">
            <div><strong>שם:</strong> {vendor.name}</div>
            <div><strong>קטגוריה:</strong> {vendor.category}</div>
            <div><strong>טלפון:</strong> {vendor.phone}</div>
            <div><strong>אימייל:</strong> {vendor.email}</div>
            <div><strong>כתובת:</strong> {vendor.address}</div>
          </div>

          {/* בחירת סוג מסמך */}
          <div className="mt-6">
            <SelectField
              name="documentType"
              label="סוג מסמך"
              options={[
                { value: DocumentType.INVOICE, label: 'חשבונית' },
                { value: DocumentType.RECEIPT, label: 'קבלה' },
                { value: DocumentType.CREDIT_NOTE, label: 'זיכוי' },
                { value: DocumentType.STATEMENT, label: 'דוח' },
                { value: DocumentType.TAX_INVOICE, label: 'חשבונית מס' },
              ]}
            />
          </div>

          {/* יצירת נתיב */}
          <FolderPathGenerator
            vendorName={vendor.name || ""}
            documentCategory={fileCategory}
            onPathReady={(path) => {
              setFolderPath(path);
            }}
          />

          {/* העלאת קבצים */}
          {vendor && folderPath && (
            <div className="mt-6">
              <FileUploader
                folderPath={folderPath}
                onFilesUploaded={async (files) => {
                  if (!files || files.length === 0) return;
                  const uploaded = files[0];

                  const document = {
                    name: uploaded.file.name,
                    path: folderPath,
                    mimeType: uploaded.file.type,
                    size: uploaded.file.size,
                    url: uploaded.fileUrl || "",
                    googleDriveId: uploaded.id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  };

                  try {
                    const res = await axiosInstance.post(`/vendor/${vendor.id}/documents`, {
                      file: document,
                    });

                    if (res.status === 200 || res.status === 201) {
                      console.log("📁 המסמך נשמר בהצלחה במסד הנתונים");
                    } else {
                      console.error("❌ שגיאה בשמירת המסמך:", res.statusText);
                    }
                  } catch (error) {
                    console.error("❗ שגיאה בבקשת שמירת המסמך:", error);
                  }
                }}
              />
            </div>
          )}

          {/* סיכום הוצאות */}
          <div className="mt-4 space-y-2">
            <div><strong>סך הוצאות:</strong> {totalExpenses} ₪</div>
            <div><strong>מספר הוצאות:</strong> {expenseCount}</div>
            <div><strong>ממוצע הוצאה:</strong> {averageExpense} ₪</div>
            <div><strong>תאריך הוצאה אחרונה:</strong> {lastExpenseDate}</div>
          </div>

          {/* טבלת הוצאות */}
          {vendorExpenses.length > 0 && (
            <div className="mt-4">
              <Table
                columns={[
                  { header: "סכום", accessor: "amount" },
                  { header: "קטגוריה", accessor: "category" },
                  { header: "תיאור", accessor: "description" },
                  { header: "תאריך", accessor: "date" },
                  { header: "סטטוס", accessor: "status" },
                ]}
                data={vendorExpenses}
                dir="rtl"
              />
            </div>
          )}

          {/* כפתורים */}
          <div className="mt-6">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              שמור
            </button>
            <button
              type="button"
              onClick={handleDeleteVendor}
              className="ml-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              מחק ספק
            </button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}