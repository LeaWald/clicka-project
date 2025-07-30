import { useEffect, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CustomerStatus, ExitReason } from 'shared-types';
import { z } from 'zod';
const schema = z.object({
  status: z.nativeEnum(CustomerStatus),
  // effectiveDate: z.string().min(1),
  notifyCustomer: z.boolean(),
  reason: z.string().optional(),
  exitNoticeDate: z.string().optional(),
  plannedExitDate: z.string().optional(),
  exitReason: z.nativeEnum(ExitReason).optional(),
  exitReasonDetails: z.string().optional(),
});
type FormData = z.infer<typeof schema>;
interface UseCustomerFormDataParams {
  open: boolean;
  customerId: string;
  methods: UseFormReturn<FormData>;
  fetchCustomerData?: (id: string) => Promise<FormData>;
}
export function useCustomerFormData({
  open,
  customerId,
  methods,
  fetchCustomerData,
}: UseCustomerFormDataParams) {
  const didFetch = useRef(false); // מונע reset כפול
  useEffect(() => {
    if (!open || didFetch.current) return;
    const fetchData = async () => {
      try {
        const data = fetchCustomerData
          ? await fetchCustomerData(customerId)
          : {
              status: CustomerStatus.NOTICE_GIVEN,
              // effectiveDate: '2025-06-25',
              notifyCustomer: true,
              reason: 'לקוח ביקש לעזוב',
              exitNoticeDate: '2025-06-01',
              plannedExitDate: '2025-07-01',
              exitReason: ExitReason.RELOCATION,
              exitReasonDetails: 'מעבר לעיר אחרת',
            };
        methods.reset(data);
        didFetch.current = true;
      } catch (err) {
        console.error('שגיאה בטעינת לקוח:', err);
      }
    };
    fetchData();
    return () => {
      // כאשר המודאל נסגר, מאפסים את הדגל כדי לאפשר reset שוב בפעם הבאה
      didFetch.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, customerId, fetchCustomerData]);
}