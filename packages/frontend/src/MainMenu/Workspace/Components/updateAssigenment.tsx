import { useState, useEffect } from "react";
import { Form } from "../../../Common/Components/BaseComponents/Form";
import { InputField } from "../../../Common/Components/BaseComponents/Input";
import { SelectField } from "../../../Common/Components/BaseComponents/Select";
import { z } from "zod";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../../Common/Components/BaseComponents/Button";
import { useAssignmentStore } from "../../../Stores/Workspace/assigmentStore";
import { useCustomerStore } from "../../../Stores/LeadAndCustomer/customerStore";
import { SpaceAssign } from "shared-types/spaceAssignment";
import { useWorkSpaceStore } from "../../../Stores/Workspace/workspaceStore";

type SpaceAssignUpdateData = z.infer<typeof spaceAssignUpdateSchema>;

const spaceAssignUpdateSchema = z.object({
  workspaceId: z.string().min(1, "נדרש מזהה חלל עבודה"),
  customerId: z.string().min(1, "נדרש מזהה לקוח"),
  assignedDate: z.string().min(1, "תאריך השמה נדרש"),
  unassignedDate: z.string().optional(),
  notes: z.string().optional(),
  assignedBy: z.string().min(1, "נדרש מזהה משבץ"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const UpdateAssigenment = () => {
  const location = useLocation();
  const assignment = location.state?.assignment;
  const navigate = useNavigate();
  const { updateAssignment } = useAssignmentStore();
  const {workSpaces,getAllWorkspace } = useWorkSpaceStore()
  const customers = useCustomerStore((s) => s.customers);
  const fetchCustomers = useCustomerStore((s) => s.fetchCustomers);
  const [workspaceOptions, setWorkspaceOptions] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    console.log(assignment);
    fetchCustomers();
     getAllWorkspace(); 
      setWorkspaceOptions(
        workSpaces.map((w) => ({ label:w.name , value:w.name}))
      );
    },[getAllWorkspace,fetchCustomers,workSpaces,assignment]);

  const handleSubmit = async (data: SpaceAssignUpdateData) => {
    try {
      const payload: SpaceAssign = {
        ...assignment,
        workspaceId: data.workspaceId,
        customerId: data.customerId,
        assignedDate: new Date(data.assignedDate),
        unassignedDate: data.unassignedDate ? new Date(data.unassignedDate) : undefined,
        notes: data.notes,
        assignedBy: data.assignedBy,
        // status: data.status,
        updatedAt: new Date(),
      };
      const result = await updateAssignment(assignment.id!, payload);
      if (result) {
        navigate("/space-assignments");
      } else {
        alert("שגיאה בעדכון ההשמה");
      }
    } catch (err) {
      console.error("שגיאה בעדכון ההשמה:", err);
    }
  };

  if (!assignment) {
    return <div>לא נמצאה השמה לעריכה</div>;
  }

  const handleCancel = () => {
    navigate("/assignmentTable");
  };

  return (
    <div className="flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <Form<SpaceAssignUpdateData>
          schema={spaceAssignUpdateSchema}
          onSubmit={handleSubmit}
          label="עדכון פרטי השמה">

          <SelectField
            label="חלל עבודה"
            name="workspaceId"
            options={workspaceOptions}
            defaultValue={assignment.workspaceId}
            className="w-full border rounded px-3 py-2"
          />

          <SelectField
            label="לקוח"
            name="customerId"
            options={customers.map((c) => ({ label: c.name, value: c.id || "" }))}
            defaultValue={assignment.customerId}
            className="w-full border rounded px-3 py-2"
          />

          <InputField
            label="תאריך השמה"
            name="assignedDate"
            type="date"
            // defaultValue={assignment.assignedDate.toISOString().split("T")[0]}
            className="w-full border rounded px-3 py-2"
          />

          <InputField
            label="תאריך ביטול (אם יש)"
            name="unassignedDate"
            type="date"
            // defaultValue={assignment.unassignedDate ? assignment.unassignedDate.toISOString().split("T")[0] : ""}
            className="w-full border rounded px-3 py-2"
          />

          <InputField
            label="הערות"
            name="notes"
            defaultValue={assignment.notes || ""}
            className="w-full border rounded px-3 py-2"
          />

          <InputField
            label="הוקצה עי"
            name="assignedBy"
            defaultValue={assignment.assignedBy}
            className="w-full border rounded px-3 py-2"
          />

          <SelectField
            label="סטטוס"
            name="status"
            options={[
              { label: "פעיל", value: "ACTIVE" },
              { label: "לא פעיל", value: "INACTIVE" }
            ]}
            defaultValue={assignment.status}
            className="w-full border rounded px-3 py-2"
          />

          <div className="flex gap-4 mt-4">
            <Button
              type="button"
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              onClick={handleCancel}
            >בטל</Button>

            <Button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >שמור</Button>
          </div>
        </Form>
      </div>
    </div>
  );
};
