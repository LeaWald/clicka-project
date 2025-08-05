import { useParams, useNavigate } from 'react-router-dom';
import React, { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Contract, CustomerStatus, ExitReason, StatusChangeRequest } from 'shared-types';
import { Form } from '../../../../Common/Components/BaseComponents/Form';
import { SelectField } from '../../../../Common/Components/BaseComponents/Select';
import { InputField } from '../../../../Common/Components/BaseComponents/Input';
import { Button } from '../../../../Common/Components/BaseComponents/Button';
import { CheckboxField } from '../../../../Common/Components/BaseComponents/CheckBox';
import { useCustomerFormData } from '../../Hooks/useCustomerFormData';
import { showAlert } from '../../../../Common/Components/BaseComponents/ShowAlert';
import { useCustomerStore } from '../../../../Stores/LeadAndCustomer/customerStore';
import { useContractStore } from '../../../../Stores/LeadAndCustomer/contractsStore';

const schema = z
  .object({
    status: z.nativeEnum(CustomerStatus),
    //התאריך מתעדכן אוטומטית לתאריך של היום
    // effectiveDate: z.string().min(1, 'חובה לבחור תאריך'),
    notifyCustomer: z.boolean(),
    reason: z.string().optional(),
    exitNoticeDate: z.string().optional(),
    plannedExitDate: z.string().optional(),
    exitReason: z.nativeEnum(ExitReason).optional(),
    exitReasonDetails: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    //התאריך מתעדכן אוטומטית לתאריך של היום
    if (data.status === CustomerStatus.NOTICE_GIVEN) {
      // if (!data.exitNoticeDate) {
      //   ctx.addIssue({
      //     path: ['exitNoticeDate'],
      //     code: z.ZodIssueCode.custom,
      //     message: 'יש להזין תאריך הודעת עזיבה',
      //   });
      // }
      if (!data.plannedExitDate) {
        ctx.addIssue({
          path: ['plannedExitDate'],
          code: z.ZodIssueCode.custom,
          message: 'יש להזין תאריך עזיבה מתוכנן',
        });
      }
      if (!data.exitReason) {
        ctx.addIssue({
          path: ['exitReason'],
          code: z.ZodIssueCode.custom,
          message: 'יש לבחור סיבת עזיבה',
        });
      }
    }
  });

type FormData = z.infer<typeof schema>;

const statusLabels: Record<CustomerStatus, string> = {
  ACTIVE: 'פעיל',
  NOTICE_GIVEN: 'הודעת עזיבה',
  EXITED: 'עזב',
  PENDING: 'בהמתנה',
  CREATED: 'נוצר',
};

const reasonLabels: Record<ExitReason, string> = {
  RELOCATION: 'מעבר למיקום אחר',
  BUSINESS_CLOSED: 'סגירת עסק',
  PRICE: 'מחיר',
  WORK_FROM_HOME: 'עבודה מהבית',
  SPACE_NEEDS: 'צרכי חלל',
  DISSATISFACTION: 'חוסר שביעות רצון',
  OTHER: 'אחר',
};

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toISOString().split("T")[0].split("-").reverse().join("/") : "";

export const CustomerStatusChanged: React.FC = () => {


  const { fetchContractsByCustomerId, contractsByCustomer } = useContractStore();
  const [previousStatus, setPreviousStatus] = useState<CustomerStatus>();

  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();

  const {
    recordExitNotice,
    fetchCustomerById,
    changeCustomerStatus,
    loading,
  } = useCustomerStore();

  //  if (!customerId) return null;
  const handleClose = () => navigate(-1);

  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      status: CustomerStatus.ACTIVE,
      notifyCustomer: false,
      reason: '',
      exitNoticeDate: '',
      plannedExitDate: '',
      exitReason: undefined,
      exitReasonDetails: '',
    },
  });

  const selectedStatus = methods.watch('status');

  const fetchCustomerData = useCallback(async (id: string) => {
    const customer = await fetchCustomerById(id);
    setPreviousStatus(customer!.status);
    const latestPeriod = customer!.periods?.[0];
    await fetchContractsByCustomerId(id);
    return {
      status: customer!.status,
      notifyCustomer: false,
      reason: '',
      exitNoticeDate: formatDate(latestPeriod?.exitNoticeDate),
      plannedExitDate: formatDate(latestPeriod?.exitDate),
      exitReason: latestPeriod?.exitReason,
      exitReasonDetails: latestPeriod?.exitReasonDetails ?? '',
    };
  }, [fetchCustomerById, fetchContractsByCustomerId]);
  useCustomerFormData({
    open: !!customerId,
    customerId: customerId ?? '',
    methods,
    fetchCustomerData,
  });

  if (!customerId) return null;

  const onSubmit = async (data: FormData) => {
    if (!customerId) return;
    const hasActiveContract = contractsByCustomer.some(
      (contract: Contract) => contract.status === 'ACTIVE'
    );
    if (data.status === CustomerStatus.EXITED && hasActiveContract) {
      showAlert("שגיאה", "לא ניתן לשנות לסטטוס 'עזב' כאשר יש חוזה פעיל", "error");
      return;
    }
    if (previousStatus === CustomerStatus.NOTICE_GIVEN && data.status === CustomerStatus.EXITED) {
      const exitDate = new Date().toISOString();
      data.exitReasonDetails += ` | עזב בפועל בתאריך: ${exitDate}`;
    }
    if (data.status === CustomerStatus.NOTICE_GIVEN) {
      await recordExitNotice(customerId, {
        exitNoticeDate: data.exitNoticeDate!,
        plannedExitDate: data.plannedExitDate!,
        exitReason: data.exitReason!,
        exitReasonDetails: data.exitReasonDetails,
      });
    }
    try {
      const changeStatusData: StatusChangeRequest = {
        newStatus: data.status,
        effectiveDate: new Date().toISOString(),
        reason: data.reason,
        notifyCustomer: data.notifyCustomer,
        notes: data.exitReasonDetails,
      };
      await changeCustomerStatus(customerId, changeStatusData);
    } catch (error: any) {
      showAlert("שגיאה", `שגיאה בשליחת מייל:\n${error}`, "error");
      return;
    }
    const latestError = useCustomerStore.getState().error;
    if (latestError) {
      showAlert("שגיאה", `שגיאה בעדכון סטטוס:\n${latestError}`, "error");
    } else {
      showAlert("עדכון", "סטטוס עודכן בהצלחה!", "success");
      navigate(-1);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-6">
      <h2 className="text-xl font-bold text-center text-blue-700 mb-4">שינוי סטטוס לקוח</h2>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        </div>
      )}
      <Form
        schema={schema}
        onSubmit={onSubmit}
        methods={methods}
        label="עדכון סטטוס"
        className="space-y-4"
      >
        <SelectField
          name="status"
          label="סטטוס חדש"
          options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))}
          required
        />

        {/* <InputField name="effectiveDate" label="תאריך שינוי" type="date" required /> */}
        <InputField name="reason" label="סיבת שינוי" />
        <CheckboxField name="notifyCustomer" label="שלח התראה ללקוח" />

        {selectedStatus === CustomerStatus.NOTICE_GIVEN && previousStatus !== CustomerStatus.NOTICE_GIVEN && (
          <div className="border p-4 rounded bg-gray-50">
            <h3 className="font-semibold text-gray-700 mb-2">פרטי עזיבה</h3>
            <InputField name="exitNoticeDate" label="תאריך הודעת עזיבה" type="date" required />
            <InputField name="plannedExitDate" label="תאריך עזיבה מתוכנן" type="date" required />
            <SelectField
              name="exitReason"
              label="סיבת עזיבה"
              options={Object.entries(reasonLabels).map(([value, label]) => ({ value, label }))}
              required
            />
            <InputField name="exitReasonDetails" label="פירוט נוסף" />
          </div>
        )}
        <div className="flex justify-between mt-6">
          
          <Button type="submit" variant="primary">
            שמור
          </Button>
        </div>
      </Form>
      <Button type="button" variant="secondary" onClick={handleClose}>
            סגור
          </Button>
    </div>
  );
};