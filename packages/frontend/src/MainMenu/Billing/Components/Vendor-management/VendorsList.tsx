import { useNavigate } from "react-router-dom";
import { Vendor } from "shared-types";
import { Button } from "../../../../Common/Components/BaseComponents/Button";
import React, { useState, useEffect } from "react";
import { TextField, Stack } from "@mui/material";
import { showAlert } from "../../../../Common/Components/BaseComponents/ShowAlert";
import axiosInstance from "../../../../Service/Axios";
import { useVendorsStore } from "../../../../Stores/Billing/vendorsStore";
import VendorSummary from "./VendorSummary";
import { ShowAlertWarn } from "../../../../Common/Components/BaseComponents/showAlertWarn";

interface VendorCardProps {
  vendor: Vendor;
  onEdit: () => void;
  onDelete: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const VendorCard: React.FC<VendorCardProps> = ({ vendor, onEdit, onDelete, isExpanded, onToggleExpand }) => {
  return (
    <div className="bg-white border rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800">{vendor.name}</h3>
          <p className="text-sm text-gray-600">{vendor.category}</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm"><span className="font-medium">טלפון:</span> {vendor.phone}</p>
            <p className="text-sm"><span className="font-medium">אימייל:</span> {vendor.email}</p>
            <p className="text-sm"><span className="font-medium">כתובת:</span> {vendor.address}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggleExpand}
            className="text-blue-500 hover:text-blue-700 p-2"
            title="צפייה"
          >
            👁️
          </button>
          <button
            onClick={onEdit}
            className="text-yellow-500 hover:text-yellow-700 p-2"
            title="עריכה"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 p-2"
            title="מחיקה"
          >
            🗑️
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="mt-4 pt-4 border-t">
          <VendorSummary vendor={vendor} />
        </div>
      )}
    </div>
  );
};

type VendorsListProps = {
  vendors: Vendor[];
  setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
};

// פונקציה לשליפת רשימת ספקים מהשרת
async function fetchVendors(): Promise<Vendor[]> {
  const response = await axiosInstance.get("/vendor/");
  return response.data;
}

export default function VendorsList({ vendors, setVendors }: VendorsListProps) {
  const navigate = useNavigate();
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { deleteVendor } = useVendorsStore();

  useEffect(() => {
    fetchVendors()
      .then(setVendors)
      .catch((error) => {
        console.error("שגיאה בשליפת ספקים:", error);
        setVendors([]);
      });
  }, [setVendors]);

  const handleDelete = async (vendorId: string) => {
    const confirmed = await ShowAlertWarn('האם אתה בטוח שברצונך למחוק את הספק לצמיתות?', 'לא ניתן לשחזר את המידע לאחר מחיקה.');
    if (confirmed) {
      try {
        await deleteVendor(vendorId);
        setVendors(vendors.filter((v) => v.id !== vendorId));
        showAlert("מחיקה", "ספק נמחק בהצלחה", "success");
      } catch (error) {
        showAlert("שגיאה", "שגיאה במחיקת ספק", "error");
        console.error("Error:", error);
      }
    }
  };

  const filteredVendors = vendors.filter((vendor) =>
    [vendor.name, vendor.phone, vendor.email, vendor.address, vendor.category]
      .some((field) => field?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-center text-blue-600 my-4">
        ספקים
      </h2>

      <div className="flex items-center gap-4 mb-4">
        <Button 
          variant="primary" 
          size="sm" 
          onClick={() => navigate("/vendors/new")} 
          className="flex gap-1 items-center"
        >
          ➕ הוספת ספק חדש
        </Button>
      </div>

      <br />
      <Stack spacing={2} direction="row">
        <TextField
          label="חיפוש"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="חפש לפי שם, טלפון, מייל, כתובת או קטגוריה"
        />
      </Stack>

      <div className="relative mt-6">
        <div className="grid gap-4">
          {filteredVendors.length > 0 ? (
            filteredVendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                onEdit={() => navigate(`/vendor/${vendor.id}/edit`)}
                onDelete={() => handleDelete(vendor.id)}
                isExpanded={selectedVendorId === vendor.id}
                onToggleExpand={() => setSelectedVendorId(selectedVendorId === vendor.id ? null : vendor.id)}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>לא נמצאו ספקים</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}