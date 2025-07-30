import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { NumberInputField } from '../../../../Common/Components/BaseComponents/InputNumber';
import { useLoungePricingStore } from '../../../../Stores/Billing/pricing/loungePricingStore';
import { UpdateLoungePricingRequest } from 'shared-types';
import { showAlert } from '../../../../Common/Components/BaseComponents/BaseAlert'; // קומפוננטת בסיס להתראות

// ----------------------
// Props לרכיב
// ----------------------
interface Props {
  initialData?: any;           // ערכים לעריכה אם קיימים
  onSuccess?: () => void;      // פונקציה שתופעל לאחר שמירה
}

const LoungePricingForm: React.FC<Props> = ({ initialData, onSuccess }) => {
  // ----------------------
  // הגדרת טופס עם ערכי ברירת מחדל
  // ----------------------
  const methods = useForm<UpdateLoungePricingRequest>({
    defaultValues: {
      eveningRate: 0,
      memberDiscountRate: 0,
      effectiveDate: '',
    },
  });

  const { save, error, loading } = useLoungePricingStore();

  // ----------------------
  // עדכון ערכי ברירת מחדל אם התקבלו נתונים לעריכה
  // ----------------------
  useEffect(() => {
    if (initialData) {
      methods.reset({
        ...initialData,
        memberDiscountRate: initialData.memberDiscountRate * 100,
        effectiveDate: initialData.effectiveDate?.split('T')[0] || '',
      });
    } else {
      methods.reset({
        eveningRate: 0,
        memberDiscountRate: 0,
        effectiveDate: '',
      });
    }
    methods.clearErrors();
  }, [initialData, methods]);

  // ----------------------
  // שליחה וטיפול בטופס
  // ----------------------
  const onSubmit = async (data: UpdateLoungePricingRequest) => {
    methods.clearErrors();

    try {
      const dataToSend = {
        ...data,
        memberDiscountRate: data.memberDiscountRate / 100,
      };

      await save(dataToSend, initialData?.id);

      showAlert({
        icon: 'success',
        title: 'הפעולה בוצעה בהצלחה!',
        text: initialData ? 'המחיר עודכן בהצלחה.' : 'המחיר נוצר בהצלחה.',
      });

      onSuccess?.();
    } catch (e: any) {
      const errorMessage = e.message || 'אירעה שגיאה לא ידועה בשמירה';

      // ----------------------
      // שגיאה: תאריך שכבה קיים
      // ----------------------
      if (errorMessage.includes('תאריך התחולה') && errorMessage.includes('מתנגש עם שכבה קיימת')) {
        const dateMatch = errorMessage.match(/(\d{4}-\d{2}-\d{2})/);
        const conflictingDate = dateMatch ? dateMatch[0] : 'לא ידוע';

        methods.setError('effectiveDate', {
          type: 'manual',
          message: `שגיאה: תאריך התחולה ${conflictingDate} כבר קיים. אנא בחר תאריך אחר, או עדכן את הרשומה הקיימת.`,
        });

        showAlert({
          icon: 'error',
          title: 'שגיאת תאריך!',
          text: `תאריך התחולה ${conflictingDate} כבר קיים. אנא בחר תאריך אחר, או עדכן את הרשומה הקיימת.`,
        });

        return;
      }

      // ----------------------
      // שגיאה כללית על שדה תאריך
      // ----------------------
      if (errorMessage.includes('תאריך התחילה') || errorMessage.includes('effectiveDate')) {
        methods.setError('effectiveDate', {
          type: 'manual',
          message: errorMessage,
        });

        showAlert({
          icon: 'error',
          title: 'שגיאת תאריך!',
          text: errorMessage,
        });

        return;
      }

      // ----------------------
      // שגיאה כללית
      // ----------------------
      console.error('שגיאה בשמירה:', errorMessage);

      showAlert({
        icon: 'error',
        title: 'שגיאה!',
        text: errorMessage,
      });
    }
  };

  // ----------------------
  // UI
  // ----------------------
  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="grid gap-4 p-4 border rounded-lg bg-white shadow-sm"
      >
        <h3 className="text-lg font-semibold mb-2 text-gray-800">
          {initialData ? "עדכון מחיר לאונג'" : "יצירת מחיר חדש לאונג'"}
        </h3>

        <NumberInputField
          name="eveningRate"
          label="תעריף ערב"
          required
          min={0}
        />
        <NumberInputField
          name="memberDiscountRate"
          label="הנחה לחברים (%)"
          required
          min={0}
          max={100}
        />

        {/* שדה תאריך תחילה */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">תאריך תחילה</label>
          <input
            type="date"
            {...methods.register('effectiveDate', { required: 'שדה חובה' })}
            className="border px-3 py-2 rounded w-full focus:ring-blue-500 focus:border-blue-500"
            disabled={!!initialData}
          />
          {methods.formState.errors.effectiveDate && (
            <p className="text-red-500 text-sm">
              {methods.formState.errors.effectiveDate.message}
            </p>
          )}
        </div>

        {/* הודעת שגיאה כללית אם אינה קשורה לתאריך */}
        {error &&
          !methods.formState.errors.effectiveDate &&
          !(error.includes('תאריך התחולה') && error.includes('מתנגש עם שכבה קיימת')) && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold transition-colors duration-200"
          disabled={loading}
        >
          {loading ? 'שומר...' : initialData ? 'עדכון מחיר' : 'יצירת מחיר חדש'}
        </button>
      </form>
    </FormProvider>
  );
};

export default LoungePricingForm;
