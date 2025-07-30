import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../../Common/Components/BaseComponents/Button";
import { Table } from "../../../../Common/Components/BaseComponents/Table";
import { Contract, ContractStatus, ID } from "shared-types";
import { showAlert } from "../../../../Common/Components/BaseComponents/ShowAlert";
import { useContractStore } from "../../../../Stores/LeadAndCustomer/contractsStore";
import { ShowAlertWarn } from "../../../../Common/Components/BaseComponents/showAlertWarn";
// טיפוס פנימי לתצוגת טבלה
interface ValuesToTable {
  id: ID;
  customerId: ID;
  customerName: string;
  status: string;
  startDate: string;
  endDate: string;
  workspaceCount: number;
}

const statusLabels: Record<ContractStatus, string> = {
  [ContractStatus.DRAFT]: "טיוטה",
  [ContractStatus.PENDING_SIGNATURE]: "ממתין לחתימה",
  [ContractStatus.SIGNED]: "נחתם",
  [ContractStatus.ACTIVE]: "פעיל",
  [ContractStatus.EXPIRED]: "פג תוקף",
  [ContractStatus.TERMINATED]: "הסתיים",
  [ContractStatus.RENEWED]: "חודש", // ✅ ודא שיש סטטוס חודש
};

const formatDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const ContractManagement = () => {
  const navigate = useNavigate();
  type ContractWithCustomerName = Contract & { customerName: string };

  const [justRenewedContracts, setJustRenewedContracts] = useState<string[]>([]);

  const contracts = useContractStore(
    (state) => state.contracts
  ) as ContractWithCustomerName[];

  const [activeTab, setActiveTab] = useState<"all" | "endingSoon">("all");
  const { fetchContracts, fetchContractsEndingSoon, handleDeleteContract } =
    useContractStore();

  useEffect(() => {
    fetchContracts().catch((err) =>
      console.error("שגיאה בטעינת חוזים:", err)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const valuesToTable: ValuesToTable[] = contracts.map((contract) => ({
    id: contract.id ?? "",
    customerId: contract.customerId ?? "",
    customerName: contract.customerName,
    status: statusLabels[contract.status as ContractStatus] ?? contract.status,
    startDate: formatDate(contract.startDate),
    endDate: formatDate(contract.endDate),
    workspaceCount: contract.terms?.workspaceCount ?? 0,
  }));

  const deleteContract = async (row: ValuesToTable) => {
    const confirmed = await ShowAlertWarn(
      "האם אתה בטוח שברצונך למחוק את החוזה לצמיתות?",
      "לא ניתן לשחזר את המידע לאחר מחיקה."
    );

    if (confirmed) {
      await handleDeleteContract(row.id)
        .then(() => {
          showAlert("מחיקה", "החוזה נמחק בהצלחה", "success");
        })
        .catch((err: unknown) => {
          console.log("שגיאה במחיקת חוזה:", err);
          showAlert("מחיקה", "שגיאה במחיקת חוזה", "error");
        });
    }
  };

  const updateContract = (val: ValuesToTable) => {
    navigate(`edit/${val.id}`, { state: { customerName: val.customerName } });
  };

  const isExpiringSoon = (endDate: string) => {
    if (!endDate) return false;
    const now = new Date();
    const end = new Date(endDate.split("/").reverse().join("-"));
    const diffDays = Math.ceil(
      (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays > 0 && diffDays <= 30;
  };

  // ✅ חדש: שולחים גם contractId בניווט
  const renewContract = (row: ValuesToTable) => {
    const contract = contracts.find((c) => c.id === row.id);
    if (!contract) return;

    navigate("addContract", {
      state: {
        renewFrom: {
          contractId: contract.id, // ✅ הוספנו כדי שנדע לעדכן את הישן
          customerId: contract.customerId,
          status: contract.status,
          startDate: contract.endDate
            ? new Date(contract.endDate).toISOString().split("T")[0]
            : "",
          endDate: "",
          workspaceType: contract.terms?.workspaceType,
          workspaceCount: contract.terms?.workspaceCount ?? 1,
          monthlyRate: contract.terms?.monthlyRate ?? 0,
          duration: contract.terms?.duration ?? 12,
          renewalTerms: contract.terms?.renewalTerms ?? "",
          terminationNotice: contract.terms?.terminationNotice ?? 0,
          specialConditions: contract.terms?.specialConditions
            ? contract.terms?.specialConditions.join(", ")
            : "",
        },
        mode: "renew",
      },
    });

    setJustRenewedContracts((prev) => [...prev, row.id]);
  };

  const renderActions = (row: ValuesToTable) => {
    const isSoon = isExpiringSoon(row.endDate);
    const isRenewed =
      row.status === "חודש" || justRenewedContracts.includes(row.id);

    const showRenewButton =
      !isRenewed &&
      isSoon &&
      (row.status === "פעיל" || row.status === "נחתם");

    return (
      <div className="relative flex justify-center items-center w-full">
        {isRenewed ? (
          <span className="absolute right-0 text-green-600 font-bold px-2">
            חוזה חודש
          </span>
        ) : (
          showRenewButton && (
            <Button
              variant="primary"
              size="sm"
              className="absolute right-0"
              onClick={() => renewContract(row)}
            >
              חידוש חוזה
            </Button>
          )
        )}

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              navigate(`customer/${row.customerId}`, {
                state: { customerName: row.customerName },
              })
            }
          >
            פרטי חוזה
          </Button>

          {/* <Button
            variant="primary"
            size="sm"
            onClick={() => updateContract(row)}
          >
            עדכון
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => deleteContract(row)}
          >
            מחיקה
          </Button> */}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold text-blue-600">ניהול חוזים</h2>
      </div>

      <div className="flex gap-4 border-b mb-6">
        <button
          className={`px-4 py-2 font-semibold ${
            activeTab === "all"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600"
          }`}
          onClick={() => {
            setActiveTab("all");
            fetchContracts();
          }}
        >
          כל החוזים
        </button>
        <button
          className={`px-4 py-2 font-semibold ${
            activeTab === "endingSoon"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600"
          }`}
          onClick={() => {
            setActiveTab("endingSoon");
            fetchContractsEndingSoon(30);
          }}
        >
          חוזים שתוקפם יסתיים בקרוב
        </button>
      </div>

      <Table<ValuesToTable>
        data={valuesToTable}
        columns={[
          { header: "שם לקוח", accessor: "customerName" },
          { header: "סטטוס", accessor: "status" },
          { header: "תאריך התחלה", accessor: "startDate" },
          { header: "תאריך סיום", accessor: "endDate" },
          { header: "כמות עמדות", accessor: "workspaceCount" },
        ]}
        onDelete={deleteContract}
        onUpdate={updateContract}
        renderActions={renderActions}
      />
    </div>
  );
};
