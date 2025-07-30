import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "../../../../Common/Components/BaseComponents/Form";
import { InputField } from "../../../../Common/Components/BaseComponents/Input";
import { SelectField } from "../../../../Common/Components/BaseComponents/Select";
import { Button } from "../../../../Common/Components/BaseComponents/Button";
import { CreateLeadRequest, Lead, LeadSource, WorkspaceType } from "shared-types";
import { useNavigate } from "react-router-dom";
import { showAlert } from "../../../../Common/Components/BaseComponents/ShowAlert";
import { useLeadsStore } from "../../../../Stores/LeadAndCustomer/leadsStore";

const workspaceTypeOptions = [
  { value: WorkspaceType.PRIVATE_ROOM1, label: 'חדר פרטי' },
  { value: WorkspaceType.PRIVATE_ROOM2, label: 'חדר של שתיים' },
  { value: WorkspaceType.PRIVATE_ROOM3, label: 'חדר של שלוש' },
  { value: WorkspaceType.DESK_IN_ROOM, label: 'שולחן בחדר' },
  { value: WorkspaceType.OPEN_SPACE, label: 'אופן ספייס' },
  { value: WorkspaceType.KLIKAH_CARD, label: 'כרטיס קליקה' },
];

const leadSourceOptions = [
  { value: LeadSource.WEBSITE, label: 'אתר אינטרנט' },
  { value: LeadSource.REFERRAL, label: 'הפניה' },
  { value: LeadSource.SOCIAL_MEDIA, label: 'רשתות חברתיות' },
  { value: LeadSource.EVENT, label: 'אירוע' },
  { value: LeadSource.PHONE, label: 'טלפון' },
  { value: LeadSource.WALK_IN, label: 'הגעה פיזית' },
  { value: LeadSource.EMAIL, label: 'אימייל' },
  { value: LeadSource.OTHER, label: 'אחר' },
];

// סכימת zod
const schema = z.object({
  name: z.string().nonempty("חובה למלא שם"),
  phone: z.string().regex(/^0\d{9}$/, "מספר טלפון לא תקין"),
  email: z.string().email("אימייל לא תקין"),
  businessType: z.string().min(2, "מינימום 2 תווים").refine(val =>
    !(/([a-zA-Z].*[א-ת])|([א-ת].*[a-zA-Z])/.test(val)), "אין לערבב עברית ואנגלית"),
  interestedIn: z.nativeEnum(WorkspaceType),
  source: z.nativeEnum(LeadSource).refine(val => !!val, { message: "חובה למלא מקור פנייה" }),
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
});

type LeadFormData = z.infer<typeof schema>;

export const LeadForm = () => {
  const methods = useForm<LeadFormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });
  const navigate = useNavigate();

  const { handleCreateLead, loading } = useLeadsStore();

  const { reset } = methods;
  // const { watch, reset } = methods;

  // const id = watch("idNumber");
  // const Name = watch("name");
  // const phone = watch("phone");
  // const email = watch("email");

  // מילוי אוטומטי לפי אחד מהשדות
  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       let response;
  //       if (id?.length === 9) {
  //         response = await axios.get(`/api/leads/byFilter/${id}`);
  //       } else if (Name?.split(" ").length >= 2) {
  //         response = await axios.get(`/api/leads/byFilter`, { params: { Name } });
  //       } else if (phone?.length === 10) {
  //         response = await axios.get(`/api/leads/byFilter`, { params: { phone } });
  //       } else if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  //         response = await axios.get(`/api/leads/byFilter`, { params: { email } });
  //       }

  //       if (response?.data) {
  //         const user: Lead = response.data;
  //       //   setValue("id", user.id);
  //         setValue("Name", user.name);
  //         setValue("email", user.email);
  //         setValue("phone", user.phone);
  //         setValue("businessType", user.businessType);
  //         setValue("interestedIn", user.interestedIn?.[0]??"");
  //         setValue("source", user.source);
  //         setValue("contactDate", user.contactDate);
  //         setValue("followUpDate", user.followUpDate);
  //         setValue("interactions", user.interestedIn?.[0] ?? "");
  //       }
  //     } catch {
  //       console.log("לא נמצא משתמש תואם");
  //     }
  //   };

  //   fetchData();
  // }, [id, Name, phone, email, setValue]);

  const onSubmit = async (data: LeadFormData) => {
    try {
      const leadRequest: CreateLeadRequest = {
        name: data.name,
        phone: data.phone,
        email: data.email,
        businessType: data.businessType,
        interestedIn: data.interestedIn,
        source: data.source,
        followUpDate: data.followUpDate,
        notes: data.notes,
      };

      const lead: Lead | undefined = await handleCreateLead(leadRequest);
      let latestError = useLeadsStore.getState().error;
      if (latestError) {
        showAlert("שגיאה ביצירת מתעניין", latestError, "error");
        return;
      }
      console.log("הנתונים נשלחו בהצלחה:", lead);
      reset();
      showAlert("", "המתעניין נוסף בהצלחה", "success");
      navigate(-1);
    } catch (error: Error | any) {
      console.error("שגיאה בשליחת הטופס:", error);
      showAlert("שגיאה ביצירת מתעניין", error.message || "שגיאה בלתי צפויה", "error");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold text-center text-blue-600 mb-4">טופס יצירת ליד</h2>

      <Form
        label="פרטי ליד"
        schema={schema}
        onSubmit={onSubmit}
        methods={methods}
      >
        <InputField name="name" label="שם" required />
        <InputField name="phone" label="טלפון" required />
        <InputField name="email" label="אימייל" required />
        <InputField name="businessType" label="סוג עסק" required />
        <SelectField
          name="interestedIn"
          label="מתעניין ב"
          options={workspaceTypeOptions}
          required
        />

        <SelectField
          name="source"
          label="מקור פנייה"
          options={leadSourceOptions}
          required
        />
        {/* <SelectField
          name="status"
          label="סטטוס"
          options={[
            { value: "new", label: "חדש" },
            { value: "contacted", label: "בוצעה פנייה" },
            { value: "interested", label: "מתעניין" },
            { value: "converted", label: "הומר ללקוח" },
          ]}
        /> */}
        <InputField name="followUpDate" label="תאריך מעקב" type="date" />
        <InputField name="notes" label="הערות" type="textarea" />


        <div className="flex justify-end mt-4">
          <Button type="submit" variant="primary" size="sm">שלח</Button>
        </div>
      </Form>
       {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                </div>
            )}
    </div>
    
  );
};