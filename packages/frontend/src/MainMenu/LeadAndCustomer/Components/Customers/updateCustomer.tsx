import React, { } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { Customer} from "shared-types";
import { showAlert } from "../../../../Common/Components/BaseComponents/ShowAlert";
import { useCustomerStore } from "../../../../Stores/LeadAndCustomer/customerStore";
import { CustomerRegistrationForm } from "./customerForm";


export const UpdateCustomer: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { updateCustomer, loading } = useCustomerStore();

    // קבלת ערכי הלקוח מהעמוד הקודם
    const customer: Customer = location.state?.data;

    const firstPayment = customer.paymentMethods![0] || {};

    const defaultValues = {
        ...customer,        
        creditCardNumber: firstPayment.creditCardNumber || "",
        creditCardExpiry: firstPayment.creditCardExpiry || "",
        creditCardHolderIdNumber: firstPayment.creditCardHolderIdNumber || customer.idNumber || "",
        creditCardHolderPhone: firstPayment.creditCardHolderPhone || customer.phone || "",
    };
    // פונקציית שליחה
    const onSubmit = async (data: any) => {

        const newCustomer: Partial<Customer> = { ...data };
        console.log("עדכון לקוח עם הנתונים in updatecustomer:", newCustomer);
        
        await updateCustomer(customer.id!, newCustomer);
        const latestError = useCustomerStore.getState().error;
        if (latestError) {
            showAlert("שגיאה בעדכון לקוח", latestError || "שגיאה בלתי צפויה", "error");
        } else {
            showAlert("עדכון", "לקוח עודכן בהצלחה", "success");
            navigate(-1);
        }
    };

     return (
        <div className="relative">
            <CustomerRegistrationForm
                defaultValues={defaultValues}
                onSubmit={onSubmit}
                title="עדכון פרטי לקוח"
                subtitle="ערוך את הפרטים הרצויים"
                isEditMode={true}
            />
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                </div>
            )}
        </div>
    );
};


