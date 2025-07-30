import { z } from "zod";
import React, { useEffect } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import { Form } from "../../../../Common/Components/BaseComponents/Form";
import { SelectField } from "../../../../Common/Components/BaseComponents/Select";
import { InputField } from "../../../../Common/Components/BaseComponents/Input";
import { Lead } from "shared-types";
import { useLeadsStore } from "../../../../Stores/LeadAndCustomer/leadsStore";
import { useNavigate, useParams } from "react-router-dom";

const MySwal = withReactContent(Swal);

export const interactionSchema = z.object({
  type: z.enum(["phone", "email", "meeting","tour"], { required_error: "חובה לבחור סוג" }),
  notes: z.string().min(1, "יש להזין הערות"),
  date: z.string().refine(val => !isNaN(Date.parse(val)), "תאריך לא תקין"),
});
export type InteractionFormData = z.infer<typeof interactionSchema>;
interface InteractionFormProps {
  onSubmit: (lead: Lead) => Promise<any>;
  onCancel: () => void;
}
export const InteractionForm: React.FC<InteractionFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const {
    selectedLead,
    handleSelectLead
  } = useLeadsStore();

  const { leadId } = useParams()
  useEffect(() => {
    if (!selectedLead && leadId)
      // טען את הליד מהשרת ועדכן ב-store
      handleSelectLead(leadId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLead, leadId, handleSelectLead, handleSelectLead]);

  const nav = useNavigate()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 border border-blue-200">
        {/* כפתור סגירה עגול בפינה */}
        <button
          onClick={onCancel}
          className="absolute top-4 left-4 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full w-9 h-9 flex items-center justify-center shadow transition"
          aria-label="סגור"
          type="button"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">הוספת אינטראקציה</h2>
        <Form<InteractionFormData>
          label=""
          schema={interactionSchema}
          onSubmit={async (data) => {
            try {
              console.log(selectedLead);

              const temp = {
                ...selectedLead,
                interactions: [
                  ...(selectedLead?.interactions || []),
                  { ...data, userEmail: selectedLead?.email }
                ]
              } as Lead;

              handleSelectLead(temp.id!);
              await onSubmit(temp);

              MySwal.fire({
                title: 'בוצע בהצלחה!',
                text: 'האינטראקציה נוספה',
                icon: 'success',
                confirmButtonText: 'סגור',
                customClass: {
                  popup: 'swal2-rtl',
                }
              }).then(() => {
                handleSelectLead(null)
                nav('/leadAndCustomer/leads')
              });

            } catch (error) {
              MySwal.fire({
                title: 'אירעה שגיאה',
                text: 'ניסיון ההוספה נכשל. נסה שוב.',
                icon: 'error',
                confirmButtonText: 'סגור',
                customClass: {
                  popup: 'swal2-rtl',
                }
              });
            }
          }}
        >
          <label className="block mb-2 font-semibold text-blue-700">סוג אינטראקציה:</label>
          <SelectField
            required
            name="type"
            label=""
            options={[
              { label: "סיור", value: "tour" },
              { label: "שיחה", value: "phone" },
              { label: "אימייל", value: "email" },
              { label: "פגישה", value: "meeting" },
            ]}
          />

          <label className="block mb-2 font-semibold text-blue-700">תאריך:</label>
          <InputField required name="date" label="" type="date" />

          <label className="block mb-2 font-semibold text-blue-700">הערות:</label>
          <InputField required name="notes" label="" />

          <div className="flex justify-end gap-2 mt-8">
            <button
              type="button"
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition"
              onClick={onCancel}
            >
              ביטול
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              שמור
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
};