import React, { useEffect } from "react";
import { useCustomerStore } from '../../../../Stores/LeadAndCustomer/customerStore';
import { useNavigate } from "react-router-dom";
export function ExcelCUpload() {
  const {
    uploadFile,
    uploadStatus,
    uploadMessage,
    setUploadFile,
    uploadExcelFile,
  } = useCustomerStore();
  const navigate = useNavigate();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.(xls|xlsx)$/i)) {
      alert("אנא בחר קובץ אקסל (.xls או .xlsx)");
      return;
    }
    setUploadFile(file);
  };
  useEffect(() => {
    if (uploadStatus === "success") {
      const timer = setTimeout(() => {
         setUploadFile(null); // איפוס הקובץ הנבחר
        navigate(-1);
      }, 1000); // נותן שנייה לראות את ההודעה
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadStatus, navigate]);
  return (
    <div>
          <h2 className="text-3xl font-bold text-center text-blue-600 mb-4">יבוא לקוחות מקובץ אקסל</h2>
      <label className="mb-1 text-sm font-medium text-gray-700"
        htmlFor="file-upload"
        style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
      >
        בחר קובץ
      </label>
      <input
        id="file-upload"
        type="file"
        accept=".xls,.xlsx"
        style={{ display: "none" }}
        onChange={onFileChange}
      />
      {uploadFile && (
        <p>הקובץ "{uploadFile.name}" נבחר בהצלחה</p>
      )}
      <button
        disabled={!uploadFile || uploadStatus === "uploading"}
        onClick={uploadExcelFile}
      >
        שלח
      </button>
      {uploadStatus === "uploading" && <p>מעלה קובץ...</p>}
      {(uploadStatus === "success" || uploadStatus === "error") && (
        <p>{uploadMessage}</p>
      )}
    </div>
  );
}
