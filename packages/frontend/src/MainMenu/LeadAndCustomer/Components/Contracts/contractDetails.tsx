import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Contract, ContractStatus, WorkspaceType } from "shared-types";
import { Button } from "../../../../Common/Components/BaseComponents/Button";
import { useContractStore } from "../../../../Stores/LeadAndCustomer/contractsStore";
import { Pencil, Trash } from "lucide-react";
import { showAlert } from "../../../../Common/Components/BaseComponents/ShowAlert";
import { ShowAlertWarn } from "../../../../Common/Components/BaseComponents/showAlertWarn";

const statusLabels: Record<ContractStatus, string> = {
  DRAFT: "טיוטה",
  PENDING_SIGNATURE: "ממתין לחתימה",
  SIGNED: "חתום",
  ACTIVE: "פעיל",
  EXPIRED: "פג תוקף",
  TERMINATED: "הסתיים",
  RENEWED: "חודש"
};

const workspaceTypeLabels: Record<WorkspaceType, string> = {
  PRIVATE_ROOM1: "חדר פרטי",
  PRIVATE_ROOM2: "חדר של 2",
  PRIVATE_ROOM3: "חדר של 3",
    DESK_IN_ROOM: "שולחן בחדר",
    OPEN_SPACE: "עמדה במרחב פתוח",
    KLIKAH_CARD: "כרטיס קליקה",
    KLIKAH_CARD_UPGRADED: "כרטיס קליקה משודרג",
    DOOR_PASS: "כרטיס כניסה",
    WALL: "קיר",
    RECEPTION_DESK: "דלפק קבלה",
    COMPUTER_STAND: "עמדת מחשב",
    BASE: "בסיס"
};

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toISOString().split("T")[0].split("-").reverse().join("/") : "";

export const ContractDetails = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const customerName = location.state?.customerName ?? "לא ידוע";
  const { fetchContractsByCustomerId, loading, error } = useContractStore();
  const [customerContracts, setCustomerContracts] = useState<Contract[]>([]);
  const [openContractId, setOpenContractId] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;
    fetchContractsByCustomerId(customerId)
      .then(() => {
        const results = useContractStore.getState().contracts.filter(c => c.customerId === customerId);
        setCustomerContracts(results);
      })
      .catch(() => setCustomerContracts([]));
  }, [customerId, fetchContractsByCustomerId]);

  const toggleContract = (id: string) => {
    setOpenContractId(prev => (prev === id ? null : id));
  };


  const updateContract = (id: string, customerName: string) => {
    navigate(`/leadAndCustomer/contracts/edit/${id}`, {
      state: { customerName },
    })
  };

  const deleteContract = async (id: string) => {
    const confirmed = await ShowAlertWarn(
      "האם את בטוחה שברצונך למחוק חוזה זה?",
      "הפעולה אינה ניתנת לביטול"
    );
    if (confirmed) {
      await useContractStore
        .getState()
        .handleDeleteContract(id!)
        .then(() => {
          showAlert("נמחק", "החוזה נמחק בהצלחה", "success");
          setCustomerContracts((prev) =>
            prev.filter((c) => c.id !== id)
          );
        })
        .catch(() => {
          showAlert("שגיאה", "אירעה שגיאה במחיקת החוזה", "error");
        });
    }
  };

  if (loading) return <p className="text-center text-gray-600">טוען חוזים...</p>;
  if (error) return <p className="text-red-600 text-center">{error}</p>;
  if (customerContracts.length === 0) return <p className="text-center">לא נמצאו חוזים להצגה.</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      <h2 className="text-2xl font-bold text-blue-700 mb-6">חוזים של {customerName}</h2>

      {customerContracts.map((contract, index) => {
        const isOpen = contract.id === openContractId;
        return (
          <div key={contract.id} className="mb-6 border border-gray-200 rounded-xl shadow-md bg-white overflow-hidden transition">
            <button
              onClick={() => toggleContract(contract.id!)}
              className="w-full text-right px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold flex items-center justify-between"
            >
              <span>חוזה #{index + 1} - {statusLabels[contract.status]}</span>
              <span className="text-sm text-gray-600">({formatDate(contract.startDate)} - {formatDate(contract.endDate)})</span>
            </button>

            {isOpen && (
              <div className="p-5 bg-gray-50 text-sm text-gray-800">
                <div className="flex justify-end gap-2 mb-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="hover:ring hover:ring-blue-300 transition"
                    onClick={() => updateContract(contract.id!, customerName)}
                    title="עריכת חוזה"
                  >
                    <Pencil size={16} className="mr-1" />
                    ערוך
                  </Button>

                  <Button
                    variant="accent"
                    size="sm"
                    className="hover:ring hover:ring-red-300 transition"
                    onClick={() => deleteContract(contract.id!)}
                    title="מחיקת חוזה"
                  >
                    <Trash size={16} className="mr-1" />
                    מחק
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 mb-4">
                  <div><strong>גרסה:</strong> {contract.version}</div>
                  {contract.signDate && <div><strong>תאריך חתימה:</strong> {formatDate(contract.signDate)}</div>}
                  <div><strong>תאריך התחלה:</strong> {formatDate(contract.startDate)}</div>
                  <div><strong>תאריך סיום:</strong> {formatDate(contract.endDate)}</div>
                  <div><strong>סטטוס:</strong> {statusLabels[contract.status]}</div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-2">תנאי חוזה</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6">
                    <div><strong>סוג מקום עבודה:</strong> {contract.terms?.workspaceType !== undefined ? workspaceTypeLabels[contract.terms.workspaceType] : "—"}</div>
                    <div><strong>מספר עמדות:</strong> {contract.terms?.workspaceCount ?? "—"}</div>
                    <div><strong>תעריף חודשי:</strong> {contract.terms?.monthlyRate ?? "—"} ₪</div>
                    <div><strong>משך חודשים:</strong> {contract.terms?.duration ?? "—"}</div>
                    <div><strong>תנאי חידוש:</strong> {contract.terms?.renewalTerms ?? "—"}</div>
                    <div><strong>הודעת סיום:</strong> {contract.terms?.terminationNotice ?? "—"} ימים</div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-2">מסמכים</h4>
                  {(contract.documents ?? []).length > 0 ? (
                    <ul className="list-disc pr-5 space-y-1 text-blue-700">
                      {contract.documents.map((docId: string) => (
                        <li key={docId}>
                          <span className="text-blue-700">מסמך: {docId}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">אין מסמכים.</p>
                  )}
                </div>

                <div className="text-gray-600 space-y-1 text-xs">
                  {contract.signedBy && <p><strong>חתום על ידי:</strong> {contract.signedBy}</p>}
                  {contract.witnessedBy && <p><strong>עד/ה:</strong> {contract.witnessedBy}</p>}
                  <p><strong>נוצר:</strong> {formatDate(contract.createdAt)}</p>
                  <p><strong>עודכן:</strong> {formatDate(contract.updatedAt)}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}