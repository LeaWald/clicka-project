import { useNavigate } from "react-router-dom";
import React, { useRef, useState, useEffect } from "react";
import { Button } from "../../../../Common/Components/BaseComponents/Button";
import { ExportToExcel } from "../exportToExcel";
import { Stack, TextField } from "@mui/material";
import debounce from "lodash/debounce";
import { showAlert } from "../../../../Common/Components/BaseComponents/ShowAlert";
import { ShowAlertWarn } from "../../../../Common/Components/BaseComponents/showAlertWarn";
import { useCustomerStore } from "../../../../Stores/LeadAndCustomer/customerStore";
import { ExpandableCustomerCard } from "../../../../Common/Components/BaseComponents/ExpandableCard";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { CustomerStatus, PaymentMethodType, WorkspaceType } from "shared-types";

interface ValuesToTable {
  id: string;
}

export interface CustomerCardProps {
  id: string;
  name: string;
  phone: string;
  email: string;
  businessName: string;
  businessType: string;
  status: CustomerStatus;
  image?: string;
  idNumber?: string;
  currentWorkspaceType?: WorkspaceType;
  workspaceCount?: number;
  contractSignDate?: string;
  contractStartDate?: string;
  billingStartDate?: string;
  notes?: string;
  invoiceName?: string;
  paymentMethodType?: PaymentMethodType;
  createdAt?: string;
  updatedAt?: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const CustomersList = () => {
  const navigate = useNavigate();
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const {
    customers,
    deleteCustomer,
    loading,
    currentPage,
    limit,
    searchCustomersByText,
    fetchCustomersByPage,
    searchCustomersInPage,
    fetchNextPage,
    fetchPrevPage,
  } = useCustomerStore();

  useEffect(() => {
    fetchCustomersByPage();
  }, [fetchCustomersByPage]);

  const deleteCurrentCustomer = async (val: ValuesToTable) => {
    const confirmed = await ShowAlertWarn(
      "האם אתה בטוח שברצונך למחוק את הלקוח לצמיתות?",
      "לא ניתן לשחזר את המידע לאחר מחיקה.",
      "warning"
    );
    if (confirmed) {
      await deleteCustomer(val.id);
      showAlert("מחיקה", "לקוח נמחק בהצלחה", "success");
      const latestError = useCustomerStore.getState().error;
      if (latestError) {
        const errorMessage = latestError || "שגיאה בלתי צפויה";
        console.error("Error:", errorMessage);
        showAlert("שגיאה במחיקת לקוח", errorMessage, "error");
      }
    }
  };

  const editCustomer = (val: ValuesToTable) => {
    const selected = customers.find((c) => c.id === val.id);
    console.log("selected customer", selected);
    navigate("update", { state: { data: selected } });
  };

  // הפונקציה שמטפלת בשינוי החיפוש
  const handleSearch = (term: string) => {
    searchCustomersInPage(term).then(() => {});
  };

  const debouncedSearch = useRef(
    debounce((value: string) => handleSearch(value), 400)
  ).current;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    setSearchTerm(value);
    debouncedSearch(value);
  };

  const searchInApi = async (e: { key: string }) => {
    //איך ידעו שבלחיצה על אנטר זה מחפש בשרת?...
    if (
      (e.key === "Enter" && searchTerm.trim()) ||
      customers.length === 0 // אין תוצאות בדף הנוכחי
    ) {
      console.log("🔍 חיפוש בשרת עם המחרוזת:", searchTerm);

      await searchCustomersByText(searchTerm);
      // .then(() => {
      //   console.log("✅ תוצאות שהגיעו מהשרת:", customers.length);
      // }).catch((error) => {
      //   console.error("שגיאה בחיפוש מהשרת:", error);
      // });
    }
  };

  const getCardData = () => {    
    return customers.map((c) => ({
      id: c.id!,
      name: c.name,
      phone: c.phone,
      email: c.email ?? "",
      businessName: c.businessName,
      businessType: c.businessType,
      status: c.status,
      idNumber: c.idNumber,
      currentWorkspaceType: c.currentWorkspaceType,
      workspaceCount: c.workspaceCount,
      contractSignDate: c.contractSignDate,
      contractStartDate: c.contractStartDate,
      billingStartDate: c.billingStartDate,
      notes: c.notes,
      invoiceName: c.invoiceName,
      paymentMethodType: c.paymentMethodType,
      ip: c.ip,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-center text-blue-600 my-4">
        לקוחות
      </h2>

      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate("new")}
          className="flex gap-1 items-center"
        >
          ➕ הוספת לקוח חדש
        </Button>
        <div className="flex items-center gap-4 mb-4">
          <Button
            onClick={() =>
              navigate("/leadAndCustomer/Customers/UploadCustomersFile")
            }
            variant="primary"
            size="sm"
          >
            יבוא לקוחות מקובץ אקסל
          </Button>
        </div>
        <ExportToExcel data={customers} fileName="לקוחות" />
      </div>

      <br />
      <Stack spacing={2} direction="row">
        <TextField
          label="חיפוש"
          fullWidth
          value={searchTerm}
          onChange={handleChange}
          onKeyDown={searchInApi}
          placeholder="חפש לקוחות לפי שם, טלפון, אימייל, שם עסק או סוג עסק"
        />
      </Stack>

      <div className="relative mt-6">
        <div className="grid gap-4">
          {getCardData().map((customer) => (
            <ExpandableCustomerCard
              key={customer.id}
              {...customer}
              onEdit={() => editCustomer({ id: customer.id })}
              onDelete={() => deleteCurrentCustomer({ id: customer.id })}
            />
          ))}
        </div>
        {loading && (
          <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
        )}
      </div>

      <div className="flex justify-center space-x-4 my-4">
        <Button
          variant={currentPage > 1 ? "secondary" : "accent"}
          disabled={currentPage <= 1}
          onClick={async () => {
            if (currentPage > 1) {
              await fetchPrevPage();
            }
          }}
          className="flex items-center"
        >
          <ArrowForwardIcon className="ml-1" />
          הקודם
        </Button>
        <Button
          variant={customers.length === limit ? "secondary" : "accent"}
          disabled={customers.length < limit}
          onClick={async () => {
            if (customers.length === limit) {
              await fetchNextPage();
            }
          }}
          className="flex items-center"
        >
          הבא
          <ArrowBackIcon className="mr-1" />
        </Button>
      </div>

      <div ref={loaderRef} className="h-4"></div>
    </div>
  );
};

