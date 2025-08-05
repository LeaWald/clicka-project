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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* כותרת ראשית */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">סיכום ספק</h1>
                <p className="mt-2 text-gray-600">פרטים מלאים על הספק והוצאותיו</p>
              </div>
              <div className="flex space-x-3 space-x-reverse">
                <button
                  onClick={() => navigate('/vendor')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  חזרה לרשימה
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* עמודה ראשית */}
            <div className="lg:col-span-2 space-y-8">
              {/* כרטיס פרטי ספק */}
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    פרטי הספק
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full ml-3"></div>
                        <div>
                          <p className="text-sm text-gray-500">שם הספק</p>
                          <p className="font-semibold text-gray-900">{vendor.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full ml-3"></div>
                        <div>
                          <p className="text-sm text-gray-500">קטגוריה</p>
                          <p className="font-semibold text-gray-900">{vendor.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-purple-500 rounded-full ml-3"></div>
                        <div>
                          <p className="text-sm text-gray-500">טלפון</p>
                          <p className="font-semibold text-gray-900">{vendor.phone}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-orange-500 rounded-full ml-3"></div>
                        <div>
                          <p className="text-sm text-gray-500">אימייל</p>
                          <p className="font-semibold text-gray-900">{vendor.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full ml-3"></div>
                        <div>
                          <p className="text-sm text-gray-500">כתובת</p>
                          <p className="font-semibold text-gray-900">{vendor.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* כרטיס העלאת מסמכים */}
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    העלאת מסמכים
                  </h2>
                </div>
                <form onSubmit={methods.handleSubmit((data) => {
                  console.log("Form submitted with data:", data);
                })}>
                  <div className="p-6 space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
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

                    <FolderPathGenerator
                      vendorName={vendor.name || ""}
                      documentCategory={fileCategory}
                      onPathReady={(path) => {
                        setFolderPath(path);
                      }}
                    />

                    {vendor && folderPath && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
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

                    <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t">
                      <button
                        type="submit"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                      >
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        שמור מסמך
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* טבלת הוצאות */}
              {vendorExpenses.length > 0 && (
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700">
                    <h2 className="text-xl font-semibold text-white flex items-center">
                      <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      היסטוריית הוצאות
                    </h2>
                  </div>
                  <div className="p-6">
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
                </div>
              )}
            </div>

            {/* עמודה צדדית */}
            <div className="space-y-8">
              {/* כרטיס סיכום הוצאות */}
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    סיכום כספי
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 font-medium">סך הוצאות</p>
                        <p className="text-2xl font-bold text-blue-900">{totalExpenses.toLocaleString()} ₪</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">מספר הוצאות</p>
                        <p className="text-2xl font-bold text-green-900">{expenseCount}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600 font-medium">ממוצע הוצאה</p>
                        <p className="text-2xl font-bold text-purple-900">{averageExpense.toLocaleString()} ₪</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-orange-600 font-medium">הוצאה אחרונה</p>
                        <p className="text-lg font-bold text-orange-900">{lastExpenseDate}</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 9a2 2 0 002 2h8a2 2 0 002-2l-2-9m-6 0V7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* כרטיס פעולות */}
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    פעולות
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <button
                    onClick={() => navigate(`/vendor/edit/${vendor.id}`)}
                    className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    ערוך ספק
                  </button>
                  
                  <button
                    onClick={handleDeleteVendor}
                    className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    מחק ספק
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}