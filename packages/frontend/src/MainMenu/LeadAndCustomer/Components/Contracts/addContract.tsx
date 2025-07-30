import React, { useState, useEffect } from "react";
import { z } from "zod";
import { Form } from "../../../../Common/Components/BaseComponents/Form";
import { InputField } from "../../../../Common/Components/BaseComponents/Input";
import { SelectField } from "../../../../Common/Components/BaseComponents/Select";
import { Button } from "../../../../Common/Components/BaseComponents/Button";
import { FileInputField } from "../../../../Common/Components/BaseComponents/FileInputFile";
import { useNavigate, useLocation } from "react-router-dom";
import { showAlert } from "../../../../Common/Components/BaseComponents/ShowAlert";
import { useContractStore } from "../../../../Stores/LeadAndCustomer/contractsStore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Contract, WorkspaceType } from "shared-types";

// enums
export enum ContractStatus {
  DRAFT = "DRAFT",
  PENDING_SIGNATURE = "PENDING_SIGNATURE",
  SIGNED = "SIGNED",
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  TERMINATED = "TERMINATED",
  RENEWED = "RENEWED", // ✅ הוספנו לוודא שיש גם סטטוס חודש
}

// תוויות עבריות לסטטוס
const statusLabels: Record<ContractStatus, string> = {
  [ContractStatus.DRAFT]: "טיוטה",
  [ContractStatus.PENDING_SIGNATURE]: "ממתין לחתימה",
  [ContractStatus.SIGNED]: "נחתם",
  [ContractStatus.ACTIVE]: "פעיל",
  [ContractStatus.EXPIRED]: "פג תוקף",
  [ContractStatus.TERMINATED]: "הסתיים",
  [ContractStatus.RENEWED]: "חודש",
};

// תוויות עבריות לסוגי עמדות
const workspaceTypeLabels: Record<WorkspaceType, string> = {
  [WorkspaceType.PRIVATE_ROOM1]: "חדר פרטי",
  [WorkspaceType.PRIVATE_ROOM2]: "חדר של 2",
  [WorkspaceType.PRIVATE_ROOM3]: "חדר של 3",
  [WorkspaceType.DESK_IN_ROOM]: "שולחן בחדר",
  [WorkspaceType.OPEN_SPACE]: "אופן ספייס",
  [WorkspaceType.KLIKAH_CARD]: "כרטיס קליקה",
  [WorkspaceType.DOOR_PASS]: "מעבר דלת",
  [WorkspaceType.WALL]: "קיר",
  [WorkspaceType.COMPUTER_STAND]: "עמדת מחשב",
  [WorkspaceType.RECEPTION_DESK]: "דלפק קבלה",
  [WorkspaceType.BASE]: "בסיס",
};

// סכימת אימות (Zod)
const contractSchema = z.object({
  customerId: z.string().nonempty("שדה חובה"),
  status: z.nativeEnum(ContractStatus),
  startDate: z.string(),
  endDate: z.string().optional(),
  workspaceType: z.nativeEnum(WorkspaceType),
  workspaceCount: z.coerce.number().min(1),
  monthlyRate: z.coerce.number().min(0),
  duration: z.coerce.number().min(1),
  renewalTerms: z.string().nonempty(),
  terminationNotice: z.coerce.number().min(0),
  specialConditions: z.string().optional(),
  documents: z.any().optional(),
});

type ContractFormData = z.infer<typeof contractSchema>;

export const AddContract = () => {
  const [loading, setLoading] = useState(false);

  //  handleUpdateContract לעדכון חוזה ישן
  const { handleCreateContract, handleUpdateContract } = useContractStore();

  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.state?.mode ?? "add";

  // contractId קבלת כל הנתונים של החוזה לחידוש כולל 
  const renewFrom = (
    location.state as { renewFrom?: Partial<ContractFormData> & { contractId?: string } }
  )?.renewFrom;

  const formMethods = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: renewFrom || {},
  });

  const { setValue } = formMethods;

  useEffect(() => {
    if (mode === "renew" && renewFrom?.startDate) {
      const start = new Date(renewFrom.startDate);
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + 1);
      setValue("endDate", end.toISOString().split("T")[0]);
    }
  }, [mode, renewFrom, setValue]);

  const handleSubmit = async (data: ContractFormData) => {
    setLoading(true);
    const now = new Date().toISOString();
    const specialConditions = data.specialConditions
      ? data.specialConditions.split(",").map((s) => s.trim())
      : [];


    const payload = {
      customer_id: data.customerId,
      status: data.status,
      start_date: data.startDate || null,
      end_date: data.endDate || null,
      version: 1,
      created_at: now,
      updated_at: now,
      documents: data.documents ?? [],
      terms: {
        workspaceType: data.workspaceType,
        workspaceCount: data.workspaceCount,
        monthlyRate: data.monthlyRate,
        duration: data.duration,
        renewalTerms: data.renewalTerms,
        terminationNotice: data.terminationNotice,
        specialConditions: specialConditions,
      },
    };


    try {
      await handleCreateContract(payload as Partial<Contract>);
      showAlert("הוספה", "החוזה נוסף בהצלחה", "success");

      // ✅ חדש: אם זה מצב חידוש - עדכן סטטוס חוזה ישן ל-RENEWED
      if (mode === "renew" && renewFrom?.contractId) {
        try {

          await handleUpdateContract(renewFrom.contractId, {
            status: ContractStatus.RENEWED,
            updated_at: new Date().toISOString(), // ✅ שימי לב לשינוי
          } as any);
          console.log(`✅ חוזה ישן ${renewFrom.contractId} עודכן לסטטוס חודש`);
          // ✅ חדש: רענון ה-store כדי שהתצוגה תראה מיד "חודש"
          const { fetchContracts } = useContractStore.getState();
          await fetchContracts();

        } catch (updateErr) {
          console.error("שגיאה בעדכון סטטוס חוזה ישן:", updateErr);
        }
      }

      navigate("/leadAndCustomer/contracts/");
    } catch (err) {
      console.error(err);
      showAlert("הוספה", "שגיאה בהוספת חוזה", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="max-w-xl mx-auto p-6 border rounded shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">
        {mode === "renew" ? "חידוש חוזה" : "הוספת חוזה חדש"}
      </h2>

      <Form<ContractFormData>
        schema={contractSchema}
        onSubmit={handleSubmit}
        methods={formMethods}
        className="space-y-4"
      >
        <InputField name="customerId" label="מזהה לקוח" required />
        <SelectField
          name="status"
          label="סטטוס"
          options={Object.entries(statusLabels).map(([value, label]) => ({
            value,
            label,
          }))}
          required
        />
        <InputField name="startDate" label="תאריך התחלה" type="date" required />
        <InputField name="endDate" label="תאריך סיום" type="date" />

        <SelectField
          name="workspaceType"
          label="סוג עמדה"
          options={Object.entries(workspaceTypeLabels).map(([value, label]) => ({
            value,
            label,
          }))}
          required
        />

        <InputField
          name="workspaceCount"
          label="מספר עמדות"
          type="number"
          required
        />
        <InputField
          name="monthlyRate"
          label="תעריף חודשי"
          type="number"
          required
        />
        <InputField
          name="duration"
          label="משך בחודשים"
          type="number"
          required
        />
        <InputField name="renewalTerms" label="תנאי חידוש" required />
        <InputField
          name="terminationNotice"
          label="ימי התראה"
          type="number"
          required
        />
        <InputField
          name="specialConditions"
          label="תנאים מיוחדים (מופרדים בפסיקים)"
        />
        <FileInputField name="documents" label="מסמכים (אפשרי)" multiple />

        <Button type="submit" variant="primary" size="md" disabled={loading}>
          {loading ? "שולח..." : mode === "renew" ? "חדש חוזה" : "שמור חוזה"}
        </Button>
      </Form>
    </div>
  );
};
