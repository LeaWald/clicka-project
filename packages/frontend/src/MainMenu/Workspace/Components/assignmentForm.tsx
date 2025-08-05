import React, { useEffect, useRef, useState } from "react";
import { useAssignmentStore } from "../../../Stores/Workspace/assigmentStore";
import { useCustomerStore } from "../../../Stores/LeadAndCustomer/customerStore";
import { useWorkSpaceStore } from "../../../Stores/Workspace/workspaceStore";
import { useForm } from "react-hook-form";
import { Form } from "../../../Common/Components/BaseComponents/Form"
import { InputField } from "../../../Common/Components/BaseComponents/Input";
import { SelectField } from "../../../Common/Components/BaseComponents/Select";
import { Button } from "../../../Common/Components/BaseComponents/Button";
import { WorkspaceType } from "shared-types";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { showAlert } from "../../../Common/Components/BaseComponents/ShowAlert";


interface AssignmentFormProps {
  onSubmit?: (data: any) => Promise<void>;
  title?: string;
  workspaceId?: string | number;
  workspaceName?: string;
  workspaceType?: WorkspaceType;
  customerId?: string | number;
  customerName?: string;
  assignedDate?: string;
  unassignedDate?: string;
  notes?: string;
  assignedBy?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'ENDED';
}






export const AssignmentForm: React.FC<AssignmentFormProps> = (props) => {
  const location = useLocation();
  const {
    space,
    displayDate,
    customerId,
    customerName,
    workspaceType: workspaceTypeFromRoot
  } = location.state || {};
  const {
    id: workspaceId,
    name: workspaceName,
    type: workspaceTypeFromSpace,
  } = space || {};

  const workspaceType = workspaceTypeFromRoot ?? workspaceTypeFromSpace;
  const assignedDate = (displayDate instanceof Date
    ? displayDate.toISOString()
    : new Date().toISOString()
  ).split("T")[0]; console.log("Location state:", JSON.stringify(location.state, null, 2));

  const onSubmit = props.onSubmit;
  const title = props.title ?? "הקצאת חלל עבודה";


  const navigate = useNavigate();
  const { workSpaces, getAllWorkspace } = useWorkSpaceStore();
  const customers = useCustomerStore((s) => s.customers);

  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

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

  const fetchCustomers = useCustomerStore((s) => s.fetchCustomers);

  const watch = methods.watch;
  const reset = methods.reset;
  const watchedWorkspaceId = watch("workspaceId");
  const watchedAssignedDate = watch("assignedDate");
  const watchedUnassignedDate = watch("unassignedDate");
  const watchedDaysOfWeek = watch("daysOfWeek");
  const isForCustomer = String(watch("isForCustomer")) === "true";

  const {
    loading,
    error,
    conflictCheck,
    createAssignment,
    checkConflicts,
    clearError,
  } = useAssignmentStore();
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading data...'); // debug
        await getAllWorkspace();
        console.log('Data loaded successfully'); // debug
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();

    // cleanup
    return () => {
      clearError();
    };
  }, [getAllWorkspace, clearError]);
  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers]);

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
  }, [watchedWorkspaceId, watchedAssignedDate, watchedUnassignedDate, watchedDaysOfWeek, checkConflicts]);
  // סינון חללים לפי סוג
  const filteredSpaces = React.useMemo(() => {
    if (!workspaceType) {
      return workSpaces.filter(space => space.status !== 'NONE');
    }
    console.log('workspaceType:', workspaceType);
    console.log('spaces:', workSpaces);
    return workSpaces.filter(space => space.type === workspaceType);
  }, [workSpaces, workspaceType]);

  // הוספת useEffect נפרד לdebug


  const handleFormSubmit = async (data: any) => {
    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        await createAssignment(data);
      }
      reset();

      const result = await showAlert({
        title: 'הקצאה הושלמה בהצלחה',
        text: 'האם ברצונך לעבור לרשימת ההקצאות?',
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'כן',
        cancelButtonText: 'לא',
        reverseButtons: true,
      });

      if (result.isConfirmed) {
        navigate('/assignmentTable');
      }

    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  console.log('Render - customers:', customers.length);
  console.log('Render - spaces:', workSpaces.length);
  console.log('Render - loading:', loading);
  console.log('Render - error:', error);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2">טוען נתונים...</p>
        <p className="text-xs text-gray-500">Customers: {customers.length}, Spaces: {workSpaces.length}</p>
      </div>
    );
  }
  return (
    <div className="flex justify-center items-center min-h-screen">
      <Form onSubmit={handleFormSubmit} methods={methods} label={title}>
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
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
            סוג ההקצאה: <span className="text-red-500">*</span>
          </label>
          <div className="flex justify-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="true"
                {...methods.register("isForCustomer")}
              />
              עבור לקוח
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="false"
                {...methods.register("isForCustomer")}
              />
              לשימוש פנימי
            </label>
          </div>
        </div>

        {/* שדות טופס */}
        <SelectField
          label="חלל עבודה"
          name="workspaceId"
          options={filteredSpaces.map(workSpaces => ({ label: workSpaces.name, value: workSpaces.id || '' }))}
          required
        />


        {isForCustomer && (
          <SelectField
            label="לקוח"
            name="customerId"
            options={customers.map(customer => ({
              label: customer.name,
              value: customer.id || ''
            }))}
            required
          />
        )}
        <InputField
          label="תאריך הקצאה"
          name="assignedDate"
          type="date"
          required
        />

        <InputField
          label="תאריך סיום"
          name="unassignedDate"
          type="date"
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
          type="textarea"
        />

        <InputField
          label="מוקצה ע"
          name="assignedBy"
          required
        />

        <SelectField
          label="סטטוס"
          name="status"
          options={
            isForCustomer
              ? [{ label: "פעיל", value: "ACTIVE" }]
              : [
                { label: "לא פעיל", value: "SUSPENDED" },
                { label: "תחזוקה", value: "ENDED" },
              ]
          }
          required
        />
        <div className="mt-6 flex justify-center">
          <Button type="submit" variant="primary" size="md" >
            בצע הקצאה
          </Button>
          <Button onClick={()=>{navigate(-1)}} variant="primary" size="md" >
            בטל
          </Button>
        </div>

      </Form>
    </div>
  );
};