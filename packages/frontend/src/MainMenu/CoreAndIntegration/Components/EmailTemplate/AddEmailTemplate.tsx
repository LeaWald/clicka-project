import { z } from "zod";
import { Form } from "../../../../Common/Components/BaseComponents/Form";
import { InputField } from "../../../../Common/Components/BaseComponents/Input";
import { SelectField } from "../../../../Common/Components/BaseComponents/Select";
import { Button } from "../../../../Common/Components/BaseComponents/Button";
import { showAlert } from "../../../../Common/Components/BaseComponents/ShowAlert";
import { TextAreaField } from "../../../../Common/Components/BaseComponents/TextArea";
import { EmailTemplate } from "shared-types";
import { useEmailTemplateStore } from "../../../../Stores/CoreAndIntegration/emailTemplateStore";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  name: z.string().nonempty("חובה למלא שדה זה"),
  subject: z.string().nonempty("חובה למלא שדה זה"),
  bodyHtml: z.string().nonempty("חובה למלא שדה זה"),
  bodyText: z.string().nonempty("חובה למלא שדה זה"),
  language: z.string().nonempty("חובה למלא שדה זה"),
  variables: z.string().nonempty("חובה למלא שדה זה"),
});

interface AddEmailTemplateProps {
  onClose?: () => void;
  onEmailTemplateAdded?: () => void;
}

export const AddEmailTemplate = ({
  onClose,
  onEmailTemplateAdded,
}: AddEmailTemplateProps) => {
  const { createEmailTemplate, loading } = useEmailTemplateStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  console.log("AddEmailTemplate loading state:", loading);

  const methods = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      language: "he",
    },
  });

  const [textDirection, setTextDirection] = useState<"rtl" | "ltr">("rtl");

  const handleSubmit = async (data: z.infer<typeof schema>) => {
    setIsSubmitting(true);
    try {
      const newEmailTemplate: EmailTemplate = {
        id: "",
        name: data.name,
        subject: data.subject,
        bodyHtml: data.bodyHtml,
        bodyText: data.bodyText,
        language: data.language as "he" | "en",
        variables: data.variables.split(",").map((v) => v.trim()), // Assuming variables are comma-separated
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const createdEmailTemplate = await createEmailTemplate(newEmailTemplate);

      if (createdEmailTemplate) {
        showAlert("", "תבנית המייל נוספה בהצלחה", "success");
        onEmailTemplateAdded?.();
        onClose?.();
      }
    } catch (error) {
      showAlert("שגיאה", "הוספת תבנית המייל נכשלה. נסה שוב", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const languageOptions = [
    { value: "he", label: "עברית" },
    { value: "en", label: "English" },
  ];

  // שימוש ב-useEffect כדי לעדכן את כיוון הטקסט
  useEffect(() => {
    const currentLanguage = methods.watch("language");
    setTextDirection(currentLanguage === "he" ? "rtl" : "ltr");
  }, [methods]);
  //methods.watch("language")]

  return (
    <div
      className={`max-w-2xl mx-auto p-6`}
      style={{ direction: textDirection }}
    >
      <div className="flex justify-between items-center mb-6">
        {/* <h2 className="text-2xl font-bold">הוספת תבנית דוא"ל חדשה</h2> */}
        {onClose && (
          <Button variant="secondary" onClick={onClose}>
            לבטל
          </Button>
        )}
      </div>

      <Form
        label='הוספת תבנית דוא"ל חדשה'
        schema={schema}
        onSubmit={handleSubmit}
        methods={methods}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField name="name" label="שם" required dir={textDirection} />
          <InputField
            name="subject"
            label="נושא"
            required
            dir={textDirection}
          />
        </div>
        <p>
          אפשר להיעזר בקישור:
          <a
            href="https://wordtohtml.net"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: "none",
              color: "black",
              borderBottom: "2px solid black",
              paddingBottom: "0px",
            }} // שימוש באובייקט
          >
            https://wordtohtml.net
          </a>
        </p>
        <TextAreaField
          name="bodyHtml"
          label="גוף HTML"
          required
          dir={textDirection}
          placeholder="הדבק כאן את קוד ה-HTML שלך"
          rows={7}
          minHeight={100}
        />
        <TextAreaField
          name="bodyText"
          label="גוף הטקסט"
          required
          dir={textDirection}
          placeholder="הדבק כאן את גוף הטקסט שלך"
          rows={7}
          minHeight={100}
        />
        <SelectField
          name="language"
          label="שפה"
          options={languageOptions}
          required
          dir={textDirection}
        />
        <InputField
          name="variables"
          label="משתנים - יש לכתוב את כל המשתנים הדרושים בשמם המדויק עם פסיק בין אחד לשני"
          required
          dir={textDirection}
        />
        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || loading}
            className="flex-1"
          >
            {isSubmitting ? "יוצר..." : 'צור תבנית דוא"ל'}
          </Button>
        </div>
      </Form>
    </div>
  );
};
