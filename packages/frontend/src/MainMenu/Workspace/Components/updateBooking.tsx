import  { useState, useEffect } from "react";
import { Form } from "../../../Common/Components/BaseComponents/Form";
import { InputField } from "../../../Common/Components/BaseComponents/Input";
import { SelectField } from "../../../Common/Components/BaseComponents/Select";
import { Booking } from "shared-types";
import {  z } from "zod";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../../Common/Components/BaseComponents/Button";
import { useBookingStore } from "../../../Stores/Workspace/bookingStore";
import { useCustomerStore } from "../../../Stores/LeadAndCustomer/customerStore";
import { useRoomStore } from "../../../Stores/Workspace/roomStore";
import { useFormContext } from "react-hook-form";
type BookingUpdateData = z.infer<typeof bookingUpdateSchema>;

// פונקציה לבדיקת רבעי שעות
const isQuarter = (time: string) => {
  const minutes = parseInt(time.split(":")[1], 10);
  return minutes % 15 === 0;
};

// סכמת ולידציה 
const bookingUpdateSchema = z.object({
  customerStatus: z.enum(["external", "customer"]).optional(),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  externalUserName: z.string().optional(),
  externalUserEmail: z.string().email("אימייל לא תקין").optional().or(z.literal("")),
  externalUserPhone: z.string().optional(),
  roomId: z.string(),
  date: z.string().min(1, "תאריך נדרש"),
  startTime: z.string()
    .min(1, "שעת התחלה נדרשת")
    .refine( isQuarter,{message:"ניתן לבחור רק רבעי שעות (00, 15, 30, 45 דקות)"}),
  endTime: z.string()
    .min(1, "שעת סיום נדרשת")
    .refine( isQuarter , {message:"ניתן לבחור רק רבעי שעות (00, 15, 30, 45 דקות)"}),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.startTime && data.endTime) {
   return data.startTime < data.endTime;}
  return true;
}, {
  message: "שעת התחלה חייבת להיות לפני שעת הסיום",
  path: ["endTime", ]
}).refine((data) => {
  if (data.startTime && data.endTime) {
    return  data.endTime.split(":")[1] === data.startTime.split(":")[1];   
  }
  return true;
}, {
  message: "יש להזמין שעות עגולות בלבד",
  path: ["endTime"]
});


export const UpdateBooking = () => { 
  // const [formKey, setFormKey] = useState(0);
  const location = useLocation();
  const booking = location.state?.booking;
  const navigate = useNavigate();
  const [customerStatus, setCustomerStatus] = useState<'external' | 'customer'>(
    booking?.customerId ? 'customer' : 'external');
  const [roomOptions, setRoomOptions] = useState<{ label: string; value: string }[]>([]);
  const { updateBooking } = useBookingStore();
  const {rooms,getAllRooms}  = useRoomStore()
  const {customers,fetchCustomers} = useCustomerStore();
  // טעינת נתונים ראשונית
  useEffect(() => {
    fetchCustomers();
    getAllRooms()
    setRoomOptions(rooms.map((r)=>({label:r.name, value:r.name })))
        // eslint-disable-next-line react-hooks/exhaustive-deps
      },[]);
// חילוץ שעה בפורמט HH:MM
const getTimeFromISO = (isoString: string): string => {
  if (!isoString) return '';
  const timePart = isoString.split('T')[1]; 
  return timePart.split(':').slice(0, 2).join(':');
};
// חישוב שעות
const calculateHours = (date: string, startTime: string, endTime: string): number => {
  if (!date || !startTime || !endTime) return 0;
    const hours = parseInt(endTime.split(":")[0])- parseInt(startTime.split(":")[0])
    console.log("🕒 שעות מחושבות:",hours );
     return hours;
};
  // המרת נתוני טופס לאובייקט הזמנה
  const convertFormToBooking = (data: BookingUpdateData) => {
    const totalHours = calculateHours(data.date, data.startTime, data.endTime);
    const roomName = roomOptions.find((room) => room.value === data.roomId)?.label || "";
    console.log("👉 שם החדר:", roomName);
    const base = {
      id: booking.id,
      roomId: data.roomId || booking.roomId,
      roomName: roomName || booking.roomName ,
      startTime:  `${data.date || getDateFromISO(booking.endTime)}T${data.startTime}`|| booking.startTime,
      endTime:`${data.date}T${data.endTime}`||booking.endTime,
      totalHours: totalHours || booking.totalHours,
      status: data.status || booking.status,
      notes: data.notes || booking.notes,
      updatedAt: new Date().toISOString(),
    };
    if (customerStatus === "customer") {
      return {
        ...base,
        customerId: data.customerId || booking.customerId,
        customerName: data.customerName || booking.customerName,
        externalUserName: undefined,
        externalUserEmail: undefined,
        externalUserPhone: undefined,
      };
    } else {
      return {
        ...base,
        customerId: undefined,
        customerName: undefined,
        externalUserName: data.externalUserName,
        externalUserEmail: data.externalUserEmail,
        externalUserPhone: data.externalUserPhone,
      };
    }
  };
  const handleSubmit = async (data: BookingUpdateData) => {
    console.log("👉 נתוני הטופס בפועל:", data.customerName);
    try {
      const bookingPayload = convertFormToBooking(data) as Booking;
      console.log("🚀 לפני שליחת הטופס: לשרת", bookingPayload);
      const result = await updateBooking(booking.id, bookingPayload);
      
      if (result) {
       console.log("ההזמנה עודכנה בהצלחה");
        navigate("/bookings");
      } else {
        alert("שגיאה בעדכון ההזמנה");
      }
    } catch (err) {
      console.error("שגיאה בעדכון ההזמנה:", err);
    }
  };

  if (!booking) {
    return <div>לא נמצאה הזמנה לעריכה</div>;
  }
  const handleCancel = () => {
    navigate("/bookings");
  };
const getDateFromISO = (isoString: string): string => {
  if (!isoString) return '';
  return isoString.split('T')[0];
};

  return (
<div className="flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <Form<BookingUpdateData>
          schema={bookingUpdateSchema}
          onSubmit={handleSubmit}
          // key={formKey}
          label="עדכון פרטי הזמנה">
              {/* בחירת סוג לקוח */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">סוג לקוח</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="customerStatus"
                      value="customer"
                      checked={customerStatus === 'customer'}
                      onChange={(e) => setCustomerStatus(e.target.value as 'customer')}
                    /> לקוח קיים </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="customerStatus"
                      value="external"
                      checked={customerStatus === 'external'}
                      onChange={(e) => setCustomerStatus(e.target.value as 'external')}
                    />  לקוח חיצוני </label>
                </div>
              </div>

              {/* פרטי לקוח */}
              {customerStatus === "customer" ? (
                <div>
                  <SelectField
                    label="בחר לקוח מהרשימה"
                    name="customerId"
                    options={customers.map((c) => ({
                      label: `${c.name} - ${c.phone}`,
                      value: c.id || "",
                    }))}
                    className="w-full border rounded px-3 py-2"
                     defaultValue={booking.customerId || ''}
                  />
                </div>
              ) : (
                <>
                  <div>
                    <InputField
                      type="text"
                      label="שם משתמש חיצוני"
                      name="externalUserName"
                      defaultValue={booking.externalUserName || ""}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <InputField
                      label="אימייל"
                      name="externalUserEmail"
                      type="email"
                      defaultValue={booking.externalUserEmail || ""}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <InputField
                      label="טלפון"
                      name="externalUserPhone"
                      defaultValue={booking.externalUserPhone || ""}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </>
              )}

              {/* בחירת חדר */}
              <div>
                <SelectField
                  label="חדר"
                  name="roomId"
                  options={roomOptions}
                  defaultValue={booking.roomId || ''}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <InputField
                  label="שעת התחלה"
                  name="startTime"
                  type="time"
                  defaultValue={getTimeFromISO(booking.startTime)}
                 // defaultValue={getTimeFromISO(booking.startTime)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <InputField
                  label="שעת סיום"
                  name="endTime"
                  type="time"
                  defaultValue={getTimeFromISO(booking.endTime)}
                  // defaultValue={getTimeFromISO(booking.endTime) }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <InputField
                  label="תאריך"
                  name="date"
                  type="date"
                  defaultValue={getDateFromISO(booking.endTime)}
                  // defaultValue={ getDateFromISO(booking.endTime)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <InputField
                  label="הערות"
                  name="notes"
                  defaultValue={booking.notes || ""}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            
            <div>
              <Button
                type="button"
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                onClick={handleCancel}
              > בטל</Button>
              <Button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" 
                >שמור</Button>
            </div>
        </Form>
      </div>
    </div>
  );
}