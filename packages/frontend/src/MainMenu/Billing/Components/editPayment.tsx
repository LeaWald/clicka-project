import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Payment } from "shared-types";
import axios from "axios";
import { Button } from "../../../Common/Components/BaseComponents/Button";
import { InputField } from "../../../Common/Components/BaseComponents/Input";
import { Form } from "../../../Common/Components/BaseComponents/Form";
import { showAlert } from "../../../Common/Components/BaseComponents/ShowAlert";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  amount: z.coerce.number().positive("סכום חייב להיות חיובי"),
  method: z.string().nonempty("שיטת תשלום חובה"),
  invoice_number: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export const EditPayment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);

  const API_URL = process.env.REACT_APP_API_URL;

  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/payment/id/${id}`);
        const paymentData = response.data;
        setPayment(paymentData);
        
        methods.reset({
          amount: paymentData.amount,
          method: paymentData.method,
          invoice_number: paymentData.invoice_number || "",
        });
      } catch (error) {
        console.error("שגיאה בטעינת תשלום:", error);
        showAlert("שגיאה", "לא ניתן לטעון את פרטי התשלום", "error");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPayment();
    }
  }, [id, API_URL, methods]);

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      await axios.patch(`${API_URL}/payment/${id}`, data);
      showAlert("הצלחה", "התשלום עודכן בהצלחה", "success");
      navigate(-1);
    } catch (error) {
      console.error("שגיאה בעדכון תשלום:", error);
      showAlert("שגיאה", "שגיאה בעדכון התשלום", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !payment) {
    return <div className="text-center p-6">טוען...</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">
        עריכת תשלום
      </h2>
      
      <Form
        schema={schema}
        onSubmit={onSubmit}
        methods={methods}
        className="space-y-4"
      >
        <InputField
          name="amount"
          label="סכום"
          type="number"
          required
        />
        
        <InputField
          name="method"
          label="שיטת תשלום"
          required
        />
        
        <InputField
          name="invoice_number"
          label="מספר חשבונית"
        />

        <div className="flex gap-4 justify-center pt-4">
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "שומר..." : "שמור"}
          </Button>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => navigate(-1)}
          >
            ביטול
          </Button>
        </div>
      </Form>
    </div>
  );
};