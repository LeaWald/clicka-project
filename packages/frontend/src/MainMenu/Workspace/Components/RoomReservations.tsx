
import { useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
//יבוא מהעיצובים הכללים 
import { InputField } from "../../../Common/Components/BaseComponents/Input";
import { Button } from "../../../Common/Components/BaseComponents/Button";
import { SelectField } from "../../../Common/Components/BaseComponents/Select";
//יבוא מהקבצי STORE
import { useBookingStore } from "../../../Stores/Workspace/bookingStore";
import { useCustomerStore } from "../../../Stores/LeadAndCustomer/customerStore";
import { useFeatureStore } from "../../../Stores/Workspace/featureStore";
import {useRoomStore} from "../../../Stores/Workspace/roomStore";
import { v4 as uuidv4 } from "uuid";
import "../Css/roomReservations.css";
//יבוא מהספריה של ZOD ולולידציה
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Booking } from "shared-types";

export enum BookingStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELED = "CANCELED",
  COMPLETED = "COMPLETED",
}
export type FormFields = {
  customerStatus: "external" | "customer";
  phoneOrEmail?: string;
  customerId?: string;
  name?: string;
  phone?: string;
  email?: string;
  selectedRoomId: string;
  startDate: string;
  startTime: string;
  endTime: string;
};
export type RoomReservationsRef = {
  fillFormWithExternalData: (data: Partial<FormFields>) => void;
};
export type RoomReservationsProps = {
  initialData?: Partial<FormFields>;
  onSubmit?: () => void;
};
// בדיקת זמן בפורמט רבע שעה
const isQuarter = (time: string) => {
  const minutes = parseInt(time.split(":")[1], 10);
  return minutes % 15 === 0;
};
//בדיקה האם התאריך שנבחר הוא מהעבר
const isPastDate = (dateStr: string) => {
  const selectedDate = new Date(dateStr);
  const today = new Date();
  selectedDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return selectedDate >= today;
};
//בדיקה האם השעה שנבחרה היא כבר עברה
const isTodayAndStartTimeInPast = (startDate: string, startTime: string) => {
  const todayStr = new Date().toISOString().split("T")[0];
  if (startDate !== todayStr) return false;
  const now = new Date();
  const [hours, minutes] = startTime.split(":").map(Number);
  const selectedTime = new Date();
  selectedTime.setHours(hours, minutes, 0, 0);
  return selectedTime < now;
};

//ולידציה שיהיה אפשר לקחת את החדר רק לכמות שעות עגולות לא רבעים ולא חצאים
const isFullHourDifference = (startTime: string, endTime: string) => {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  const start = new Date();
  start.setHours(startHour, startMinute, 0, 0);
  const end = new Date();
  end.setHours(endHour, endMinute, 0, 0);
  const diffInMinutes = (end.getTime() - start.getTime()) / 1000 / 60;
  return diffInMinutes >= 60 && diffInMinutes % 60 === 0;
};
//הולידציות
const bookingSchema = z.object({
  customerStatus: z.enum(["external", "customer"]),
  customerId: z.string().optional(),
  name: z.string().min(1, "שם נדרש").optional(),
  phone: z.string().min(7, "טלפון נדרש").optional(),
  email: z.string().email("אימייל לא תקין").optional(),
  selectedRoomId: z.string().min(1, "חובה לבחור חדר"),
  startDate: z.string()
    .min(1, "חובה לבחור תאריך")
    .refine(isPastDate, { message: "אי אפשר לבחור תאריך מהעבר" }),
  startTime: z.string()
    .min(1, "שעת התחלה נדרשת")
    .refine(isQuarter, {
      message: "בחר רבע שעה: 00, 15, 30, 45",
    }),
  endTime: z.string()
    .min(1, "שעת סיום נדרשת")
    .refine(isQuarter, { message: "בחר רבע שעה: 00, 15, 30, 45", }),
})
  .refine(
    (data) => data.startTime < data.endTime,
    {
      message: "שעת התחלה חייבת להיות לפני שעת סיום",
      path: ["endTime"],
    }
  )
  .refine((data) => {
    return !isTodayAndStartTimeInPast(data.startDate, data.startTime);
  },
    {
      message: "שעת התחלה עבור היום לא יכולה להיות לפני השעה הנוכחית",
      path: ["startTime"],
    }
  )
  .refine(
    (data) => isFullHourDifference(data.startTime, data.endTime),
    {
      message: "יש לבחור משך זמן של שעה שלמה לפחות (למשל: 1:00, 2:00 וכו')",
      path: ["endTime"],
    }
  )
  .refine((data) => {
    if (data.customerStatus === "customer") {
      return !!data.customerId;
    } else {
      return !!(data.name?.trim() && data.phone?.trim() && data.email?.trim());
    }
  }, {
    message: "יש למלא את כל פרטי הלקוח לפי הסוג",
    path: ["customerId"],
  });
export const RoomReservations = forwardRef<RoomReservationsRef, RoomReservationsProps>(
  ({ initialData, onSubmit }, ref) => {
    const methods = useForm<FormFields>({
      defaultValues: {
        customerStatus: "customer",
        ...initialData,
      },
      mode: "onSubmit",
      resolver: zodResolver(bookingSchema),
    });

    const { createBookingInCalendar, createBooking, getCustomerByPhoneOrEmail} = useBookingStore();
    const {getAllRooms,rooms} = useRoomStore();
    const customers = useCustomerStore((s) => s.customers);
    const fetchCustomers = useCustomerStore((s) => s.fetchCustomers);
    const [roomOptions, setRoomOptions] = useState<{ label: string; value: string }[]>([]);
    const status = useWatch({ control: methods.control, name: "customerStatus" });
    const phoneOrEmail = useWatch({ control: methods.control, name: "phoneOrEmail" });
    const [selectedRoomFeatures, setSelectedRoomFeatures] = useState<string[]>([]);
    const {  getAllFeatures } = useFeatureStore();
      const navigate = useNavigate();

//חישוב כמות השעות שהמשתמש בחר את החדר
    const calculateDurationInMinutes = (startISO: string, endISO: string): number => {
      const start = new Date(startISO);
      const end = new Date(endISO);
      const diffInMs = end.getTime() - start.getTime();
      return (Math.floor(diffInMs / (1000 * 60))) / 60;
    };

    useImperativeHandle(ref, () => ({
      fillFormWithExternalData: (data: Partial<FormFields>) => {
        Object.entries(data).forEach(([key, value]) => {
          methods.setValue(key as keyof FormFields, value as any);
        });
      },
    }));
    //הבאת כל החדרים
    useEffect(() => {
      getAllRooms();
       //eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    //הבאת כל הלקוחות
    useEffect(() => {
      fetchCustomers();
      getAllFeatures();
       //eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const customerId = useWatch({ control: methods.control, name: "customerId" });
    useEffect(() => {
      if (status === "customer" && customerId) {
        const customer = customers.find((c) => c.id === customerId);
        if (customer) {
          methods.setValue("name", customer.name);
        }
      }
       //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, customerId, customers]);


    useEffect(() => {
      const fetch = async () => {
        if (status === "customer" && phoneOrEmail) {
          const customer = await getCustomerByPhoneOrEmail(phoneOrEmail);
          if (customer) {
            methods.setValue("customerId", customer.id);
            methods.setValue("name", customer.name);
            methods.setValue("email", customer.email);
            methods.setValue("phone", customer.phone);
          }
        }
      };
      fetch();
       //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, phoneOrEmail]);
    useEffect(() => {
      if (initialData?.selectedRoomId) {
        methods.setValue("selectedRoomId", initialData.selectedRoomId);
        void setRoomOptions;
      }
       //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomOptions]);

    const selectedRoomId = useWatch({ control: methods.control, name: "selectedRoomId" });
    //תכונות החדר
    useEffect(() => {
      const room = roomOptions.find((r) => r.value === selectedRoomId);
      if (room) {
        // צריך להיות לך מאגר החדרים המלא עם תכונות, לא רק label/value
        getAllRooms();
        
      } else {
        setSelectedRoomFeatures([]);
        
      }
      console.log(" selectedRoomId:", selectedRoomId);
       //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRoomId]);
    useEffect(() => {
      getAllFeatures().then(() => {
      });
       //eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const mapRoomFeatures = (fet:string[]) => {
      const featureofroom:string[] = [];
       //eslint-disable-next-line react-hooks/exhaustive-deps
      //  fet.map(f => {
      //    //eslint-disable-next-line react-hooks/exhaustive-deps
      //      features.map((feature) => {
      //       if (feature.id === f) {
      //          if(feature.description)
      //           featureofroom.push(feature.description);
      //       }
      //      });

      // });
      return featureofroom;
    };

    useEffect(() => {
      if (selectedRoomId && rooms.length > 0) {
        const room = rooms.find((r) => r.id === selectedRoomId);
        setSelectedRoomFeatures(room?.features || []);
      } else {
        setSelectedRoomFeatures([]);
        void selectedRoomFeatures;
      }
      //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRoomId, rooms]);


    const convertFormToBooking = (data: FormFields) => {
      const name = data.name?.trim() || "";
      const startTime = `${data.startDate}T${data.startTime}`;
      const endTime = `${data.startDate}T${data.endTime}`;
      const roomName = rooms.find((room) => room.id === data.selectedRoomId)?.name || "";
      console.log(roomName);
      const totalMinutes = calculateDurationInMinutes(startTime, endTime);
      //האוביקט המלא של הבוקינג
      const base = {
        id: uuidv4(),
        roomId: data.selectedRoomId,
        roomName,
        customerId: null,
        customerName: null,
        externalUserName: null,
        externalUserEmail: null,
        externalUserPhone: null,
        startTime,
        endTime,
        status: BookingStatus.PENDING,
        notes: "",
        googleCalendarEventId: null,
        totalHours: totalMinutes,
        chargeableHours: data.customerStatus==="external"? totalMinutes:"",
        totalCharge: 0,
        isPaid: false,
        approvedBy: "",
        approvedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
//אם הסטטוס הוא לקוח קיים לשלוף את נתונין
      if (data.customerStatus === "customer") {
        return {
          ...base,
          customerId: data.customerId ?? "",
          customerName: name,
        };
      }
//אחרת להחזירר את פרטי הלקוח החיצוני
      return {
        ...base,
        externalUserName: data.name ?? "",
        externalUserEmail: data.email ?? "",
        externalUserPhone: data.phone ?? "",
      };
    };
    // useEffect(() => {
    //    //eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [methods.formState.errors]);

    const handleSubmit = async (data: FormFields) => {
//שלא ישאר שדות ריקים
      try {
        if (data.customerStatus === "customer") {
          // if (!data.customerId) {
          
          //   return;
          // }
        } else {
          if (!data.name || !data.phone || !data.email) {
            alert("נא למלא את כל פרטי הלקוח החיצוני");
            return;
          }
        }
        //להכניס את נתוני הטופס ולהמירם לסוג של הדטה
        const bookingPayload = convertFormToBooking(data) as Booking;
        const result = await createBooking(bookingPayload);

          if(result){
            navigate('/bookings')
            methods.reset();
            onSubmit?.();
            navigate (-1);
          }

      } catch (err) {

      }
    };
//הטופס הזמנת חדרים
    return (
      <div className="flex items-center justify-center">
      {/* <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"></div> */}
      {/* <div className="form-page"> */}
        <div className="form-wrapper">
          <h1 className="form-title">הזמנות חדרים</h1>
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(handleSubmit)}>
              <fieldset>
                <label>סטטוס לקוח:  </label>
                <label>
                  <input
                    type="radio"
                    value="customer"
                    {...methods.register("customerStatus")}
                    defaultChecked
                  />
                  לקוח קיים       
                </label>
             
                <label>
                  <input
                    type="radio"
                    value="external"
                    {...methods.register("customerStatus")}
                  />
                  לקוח חיצוני  
                </label>
              </fieldset>
              {status === "customer" ? (
                <>
                  <div className="form-field">
                    <SelectField
                      name="customerId"
                      label="בחר לקוח מהרשימה"
                      options={customers.map((c) => ({
                        label: `${c.name} - ${c.phone}`,
                        value: c.id || "",
                      }))}
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-field">
                    <InputField name="name" label="שם" type="text" required />
                  </div>
                  <div className="form-field">
                    <InputField name="phone" label="טלפון" type="tel" required />
                  </div>
                  <div className="form-field">
                    <InputField name="email" label="מייל" type="email" required />
                  </div>
                </>
              )}
              <div className="form-field">
                <SelectField name="selectedRoomId" label="בחירת חדר" options={rooms.map((r) => ({
                        label: `${r.name}`,
                        value: r.id || "",
                      }))} required />
              </div>
              {selectedRoomId && (
                <div className="form-field">
                  <label>תכונות החדר:</label>
                  <ul>
  {rooms.length > 0 &&
    rooms.flatMap((room) =>
      mapRoomFeatures(room.features || []).map((feature) => (
        <li key={uuidv4()}>
          {feature}
        </li>
      ))
    )}
</ul>
                </div>
              )}  
                <InputField name="startDate" label="תאריך התחלה" type="date" required />
                <InputField name="startTime" label="שעת התחלה" type="time" required />
                <InputField name="endTime" label="שעת סיום" type="time" required />
              <div className="form-actions">
                <Button type="submit">שלח</Button>
                      <Button
        className="form-actions"
        onClick={() => {navigate(-1);}}
      >
        בטל
      </Button>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    );
  }
);
RoomReservations.displayName = "RoomReservations";