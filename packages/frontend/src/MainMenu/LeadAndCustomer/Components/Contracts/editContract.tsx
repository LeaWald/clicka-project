import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { Form } from "../../../../Common/Components/BaseComponents/Form";
import { InputField } from "../../../../Common/Components/BaseComponents/Input";
import { SelectField } from "../../../../Common/Components/BaseComponents/Select";
import { FileInputField } from "../../../../Common/Components/BaseComponents/FileInputFile";
import { Button } from "../../../../Common/Components/BaseComponents/Button";
import { Contract, ContractStatus, WorkspaceType } from "shared-types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getContractFormData, mapRawContractToCamelCase } from "../../Hooks/useContractFormData";
import { showAlert } from "../../../../Common/Components/BaseComponents/ShowAlert";
import { useContractStore } from "../../../../Stores/LeadAndCustomer/contractsStore";

// תוויות סטטוס
const statusLabels = {
  DRAFT: "טיוטה",
  PENDING_SIGNATURE: "ממתין לחתימה",
  SIGNED: "נחתם",
  ACTIVE: "פעיל",
  EXPIRED: "פג תוקף",
  TERMINATED: "הסתיים",
  RENEWED: "חודש"
} satisfies Record<ContractStatus, string>;

// תוויות סוג חלל עבודה
const workspaceTypeLabels = {
  PRIVATE_ROOM1: "חדר פרטי",
  PRIVATE_ROOM2: "חדר של 2",
  PRIVATE_ROOM3: "חדר של 3",
  DESK_IN_ROOM: "שולחן בחדר",
  OPEN_SPACE: "אופן ספייס",
  KLIKAH_CARD: "כרטיס קליקה",
  DOOR_PASS: "כרטיס כניסה",
  WALL: "קיר",
  COMPUTER_STAND: "עמדת מחשב",
  RECEPTION_DESK: "דלפק קבלה",
  BASE: "בסיס"
} satisfies Record<WorkspaceType, string>;

// סכימת אימות Zod
const contractSchema = z.object({
  status: z.nativeEnum(ContractStatus),
  version: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  signDate: z.string().optional(),
  workspaceType: z.nativeEnum(WorkspaceType),
  workspaceCount: z.coerce.number().min(1),
  monthlyRate: z.coerce.number().min(0),
  duration: z.coerce.number().min(1),
  renewalTerms: z.string().nonempty(),
  terminationNotice: z.coerce.number().min(0),
  specialConditions: z.string().optional(),
  signedBy: z.string().optional(),
  witnessedBy: z.string().optional(),
  documents: z.any().optional(),
});
export type ContractFormData = z.infer<typeof contractSchema>;

export const EditContract = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchContractDetails, handleUpdateContract } = useContractStore();
  const customerName = (location.state as { customerName?: string })?.customerName ?? "לא ידוע";

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  const formMethods = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {},
  });

  // שליפה
  useEffect(() => {
    if (!contractId) return;
    fetchContractDetails(contractId)
      .then(raw => {
        const mapped = mapRawContractToCamelCase(raw);
        setContract(mapped);
        formMethods.reset(getContractFormData(mapped));
      })
      .catch(() => showAlert("טעינת חוזה", "שגיאה בטעינת חוזה", "error"))
      .finally(() => setLoading(false));
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId, formMethods]);

  // שליחה
  const handleSubmit = async (data: ContractFormData) => {
    if (!contract?.id) return;

    const payload = {
      version: data.version !== "" ? Number(data.version) : undefined,
      status: data.status,
      start_date: data.startDate,
      end_date: data.endDate || undefined,
      sign_date: data.signDate || undefined,
      signed_by: data.signedBy,
      witnessed_by: data.witnessedBy,
      updated_at: new Date().toISOString(),
      documents: data.documents ?? [],
      terms: {
        workspaceType: data.workspaceType,
        workspaceCount: data.workspaceCount,
        monthlyRate: data.monthlyRate,
        duration: data.duration,
        renewalTerms: data.renewalTerms,
        terminationNotice: data.terminationNotice,
        specialConditions: data.specialConditions
          ? data.specialConditions.split(",").map(s => s.trim())
          : [],
      },
    };

    try {
      await handleUpdateContract(contract.id, payload);
      showAlert("עדכון", "החוזה עודכן בהצלחה", "success");
      navigate("/leadAndCustomer/contracts/");
      setLoading(false);
    } catch (err) {
      console.error(err);
      showAlert("עדכון", "שגיאה בעדכון חוזה", "error");
      setLoading(false);
      return;
    }
  };

  if (loading) return <p className="text-center">טוען...</p>;
  if (!contract) return <p className="text-red-600 text-center">לא נמצא חוזה לעריכה</p>;

  return (
    <div dir="rtl" className="max-w-2xl mx-auto p-6 shadow border rounded">
      <h2 className="text-2xl font-bold text-center text-blue-700 mb-4">עריכת חוזה</h2>

      <Form<ContractFormData>
        schema={contractSchema}
        onSubmit={handleSubmit}
        methods={formMethods}
        className="space-y-4"
      >
        <div><strong>שם לקוח:</strong> {customerName}</div>

        <SelectField name="status" label="סטטוס" options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))} required />
        <InputField name="version" label="גרסה" />
        <InputField name="startDate" label="תאריך התחלה" type="date" required />
        <InputField name="endDate" label="תאריך סיום" type="date" />
        <InputField name="signDate" label="תאריך חתימה" type="date" />
        <SelectField name="workspaceType" label="סוג חלל עבודה" options={Object.entries(workspaceTypeLabels).map(([value, label]) => ({ value, label }))} required />
        <InputField name="workspaceCount" label="מספר עמדות" type="number" required />
        <InputField name="monthlyRate" label="מחיר חודשי" type="number" required />
        <InputField name="duration" label="משך (חודשים)" type="number" required />
        <InputField name="renewalTerms" label="תנאי חידוש" required />
        <InputField name="terminationNotice" label="ימי התראה לפני סיום" type="number" required />
        <InputField name="specialConditions" label="תנאים מיוחדים (מופרדים בפסיקים)" />
        <InputField name="signedBy" label="נחתם על ידי" />
        <InputField name="witnessedBy" label="עד לחתימה" />
        <FileInputField name="documents" label="מסמכים" multiple />

        <div className="flex justify-between pt-4">
          <Button type="submit" variant="primary">שמור שינויים</Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>ביטול</Button>
        </div>
      </Form>
    </div>
  );
};
