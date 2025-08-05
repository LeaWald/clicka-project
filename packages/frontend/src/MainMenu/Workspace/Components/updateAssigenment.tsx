import { useState, useEffect, useRef } from "react";
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
import { useForm } from "react-hook-form";

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
  const { conflictCheck, checkConflicts,  updateAssignment } = useAssignmentStore();
  const {workSpaces,getAllWorkspace } = useWorkSpaceStore()
  const customers = useCustomerStore((s) => s.customers);
  const fetchCustomers = useCustomerStore((s) => s.fetchCustomers);
  const [workspaceOptions, setWorkspaceOptions] = useState<{ label: string; value: string }[]>([]);
  const{ workspaceId, customerId, assignedDate, workspaceName, customerName } = assignment || {};
  const methods = useForm({
        defaultValues: {
          isForCustomer: true,
          workspaceName: workspaceName || "",
          workspaceId: workspaceId || "",
          customerName: customerName || "",
          customerId: customerId || "",
          assignedDate: assignedDate,
          unassignedDate: "",
          daysOfWeek: [],
          notes: "",
          assignedBy: "",
          status: "ACTIVE",
        },
      });
      const didReset = useRef(false);
  const watch = methods.watch;
  const reset = methods.reset;
  const watchedWorkspaceId = watch("workspaceId");
  const watchedAssignedDate = watch("assignedDate");
  const watchedUnassignedDate = watch("unassignedDate");
  const watchedDaysOfWeek = watch("daysOfWeek");
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  
 
  useEffect(() => {
    console.log(assignment);
    fetchCustomers();
     getAllWorkspace();
      setWorkspaceOptions(
        workSpaces.map((w) => ({ label:w.name, value:w.id?w.id : ''}))
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);
 useEffect(() => {
    if (!didReset.current) {
      methods.reset({
        isForCustomer: true,
        workspaceName: workspaceName || "",
        workspaceId: workspaceId || "",
        customerName: customerName || "",
        customerId: customerId || "",
        assignedDate: assignedDate,
        unassignedDate: "",
        daysOfWeek: [],
        notes: "",
        assignedBy: "",
        status: "ACTIVE",
      });
      didReset.current = true;
    }
  }, [assignedDate, customerId, customerName, methods, workspaceId, workspaceName]);

  // בדיקת קונפליקטים בזמן אמת
  useEffect(() => {
        const checkForConflicts = async () => {
      const daysOfWeekForConflicts = (
        Array.isArray(watchedDaysOfWeek)
          ? watchedDaysOfWeek
          : watchedDaysOfWeek
            ? [watchedDaysOfWeek]
            : []
      ).map(Number).filter(n => !isNaN(n));

      if (watchedWorkspaceId && watchedAssignedDate) {
        setIsCheckingConflicts(true);
        try {
          await checkConflicts(
            watchedWorkspaceId,
            watchedAssignedDate,
            watchedUnassignedDate || undefined,
            undefined,
            daysOfWeekForConflicts
          );
        } catch (error) {
          console.error('Error checking conflicts:', error);
        } finally {
          setIsCheckingConflicts(false);
        }
      }
    };

    const timeoutId = setTimeout(checkForConflicts, 500);
    return () => clearTimeout(timeoutId);
  }, [watchedWorkspaceId, watchedAssignedDate, watchedUnassignedDate, watchedDaysOfWeek, checkConflicts,onchange]);
  const handleSubmit = async (data: SpaceAssignUpdateData) => {
    console.log(data)
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
        navigate("/assignmentTable");
      } else {
        alert("שגיאה בעדכון");
      }
    } catch (err) {
      console.error("שגיאה בעדכון :", err);
    }
  };
  if (!assignment) {
    return <div>לא נמצאה הקצאה לעריכה</div>;
  }
  const handleCancel = () => {
    navigate("/assignmentTable");
    navigate("/assignmentTable");
  };
console.log(assignment);

  return (
    <div className="flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <Form<SpaceAssignUpdateData>
          schema={spaceAssignUpdateSchema}
          onSubmit={handleSubmit}
          label="עדכון פרטי הקצאה">
            {/* הצגת תוצאות בדיקת קונפליקטים */}
        {isCheckingConflicts && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
              <span className="text-sm text-yellow-800">בודק קונפליקטים...</span>
            </div>
          </div>
        )}

        {conflictCheck && !isCheckingConflicts && (
          <div
            className={`mb-4 p-3 rounded-md ${conflictCheck.hasConflicts
              ? "bg-red-50 border border-red-200"
              : "bg-green-50 border border-green-200"
              }`}
          >
            <div
              className={`text-sm font-medium ${conflictCheck.hasConflicts ? "text-red-800" : "text-green-800"
                }`}
            >
              {conflictCheck.message}
            </div>

            {conflictCheck.hasConflicts && conflictCheck.conflicts.length > 0 && (
              <div className="mt-2 text-xs text-red-600">
                <strong>קונפליקטים:</strong>
                <ul className="mt-1 list-disc list-inside">
                  {conflictCheck.conflicts.map((conflict, index) => (
                    <li key={index}>
                      {conflict.assignedDate} -{" "}
                      {conflict.unassignedDate || "ללא תאריך סיום"}
                      {conflict.notes && ` (${conflict.notes})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
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
            options={customers.map((c) => ({ label: `${c.name} ${c.phone}`, value: c.id || "" }))}
            defaultValue={assignment.customerId}
            className="w-full border rounded px-3 py-2"
          />
          <InputField
            label="תאריך הקצאה"
            label="תאריך הקצאה"
            name="assignedDate"
            type="date"
            defaultValue={assignment.assignedDate}
            className="w-full border rounded px-3 py-2"
          />
          <InputField
            label="תאריך סיום"
            name="unassignedDate"
            type="date"
            defaultValue={assignment.unassignedDate ? assignment.unassignedDate : ""}
            className="w-full border rounded px-3 py-2"
          />
          <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ימים בשבוע
          </label>
          <div className="grid grid-cols-6 gap-1 text-sm">
            {[0, 1, 2, 3, 4, 5].map((day) => (
              <label key={day} className="flex items-center justify-center gap-1">
                <input
                  type="checkbox"
                  value={day}
                  {...methods.register("daysOfWeek")}
                  className="h-4 w-4"
                />
                {["א", "ב", "ג", "ד", "ה", "ו"][day]}
              </label>
            ))}
          </div>
        </div>

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









