/**
 * Represents a booking calendar component for managing room bookings.
 * 
 * @component
 * @param {Object} props - Component properties
 * @param {string} props.roomId - Unique identifier for the room
 * @param {string} props.roomName - Display name of the room
 * @param {string} [props.roomType="MEETING_ROOM"] - Type of room (defaults to meeting room)
 * 
 * @description
 * This component provides a comprehensive calendar interface for:
 * - Viewing existing bookings
 * - Creating new bookings
 * - Editing and managing booking statuses
 * - Displaying booking statistics
 * 
 * Uses FullCalendar for rendering and supports Hebrew localization.
 */
import React, { useEffect, useState } from 'react';
import { BookingStatus, UpdateBookingRequest  } from 'shared-types';
import FullCalendar from '@fullcalendar/react';
import type {
  DateSelectArg,
  EventClickArg,
  EventDropArg,
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import heLocale from '@fullcalendar/core/locales/he';
import '../Css/bookingCalendar.css';
import { useBookingCalendarStore } from '../../../Stores/Workspace/bookingCalendarStore';
import { showAlert } from '../../../Common/Components/BaseComponents/ShowAlert';
import { RoomReservations } from './RoomReservations'; 
import type { FormFields } from './RoomReservations'; 
import { Button } from '../../../Common/Components/BaseComponents/Button';
import { useNavigate } from 'react-router-dom';
interface BookingCalendarProps {
  roomId: string;
  roomName: string;
  roomType?: string;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  roomId,
  roomName,
  roomType = "MEETING_ROOM"
}) => {
  const {
    bookings,
    loading,
    error,
    fetchBookings,
    updateBooking,
    deleteBooking
  } = useBookingCalendarStore();

  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<any>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formInitialData, setFormInitialData] = useState<Partial<FormFields>>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (roomId) {
      fetchBookings({ roomId });
    }
  }, [roomId, fetchBookings]);

  const roomBookings = bookings.filter((booking: any) => booking.roomId === roomId);

  const events = roomBookings.map((booking: any) => ({
    id: booking.id,
    title: booking.customerName || booking.externalUserName || 'הזמנה',
    start: booking.startTime,
    end: booking.endTime,
    className: `booking-status-${booking.status.toLowerCase()}`,
    extendedProps: booking
  }));

  // פונקציה לבדיקת validation לעדכונים
  const validateBookingUpdate = (startTime: string, endTime: string, bookingId: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (start >= end) {
      throw new Error('זמן התחלה חייב להיות לפני זמן הסיום');
    }
    
    if (start < new Date()) {
      if (!window.confirm('זמן ההתחלה בעבר. האם להמשיך?')) {
        throw new Error('עדכון בוטל על ידי המשתמש');
      }
    }
    
    const conflictingBookings = roomBookings.filter(b => 
      b.id !== bookingId && 
      b.status !== BookingStatus.CANCELED &&
      b.status !== BookingStatus.REJECTED &&
      ((new Date(b.startTime) < end && new Date(b.endTime) > start))
    );
    
    if (conflictingBookings.length > 0) {
      const conflictNames = conflictingBookings.map(b => b.customerName || b.externalUserName).join(', ');
      throw new Error(`קיימת חפיפה עם הזמנות של: ${conflictNames}`);
    }
  };

  // פונקציה לקבלת תווית סטטוס בעברית
  const getStatusLabel = (status: BookingStatus) => {
    const statusLabels = {
      [BookingStatus.PENDING]: 'ממתין לאישור',
      [BookingStatus.APPROVED]: 'מאושר',
      [BookingStatus.REJECTED]: 'נדחה', 
      [BookingStatus.CANCELED]: 'בוטל',
      [BookingStatus.COMPLETED]: 'הושלם'
    };
    return statusLabels[status] || status;
  };

  // פונקציה לקבלת צבע סטטוס
  const getStatusColor = (status: BookingStatus) => {
    const colors = {
      [BookingStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [BookingStatus.APPROVED]: 'bg-green-100 text-green-800',
      [BookingStatus.REJECTED]: 'bg-red-100 text-red-800',
      [BookingStatus.CANCELED]: 'bg-gray-100 text-gray-800',
      [BookingStatus.COMPLETED]: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleSelect = (selectInfo: DateSelectArg) => {
  setFormInitialData({
    startDate: selectInfo.startStr.slice(0, 10),
    startTime: selectInfo.startStr.slice(11, 16),
    endTime: selectInfo.endStr.slice(11, 16),
    selectedRoomId: roomId,
    // אפשר להוסיף כאן עוד נתונים אם יש
  });
  setShowFormModal(true);
  selectInfo.view.calendar.unselect()
  };

  const handleEventChange = async (changeInfo: EventDropArg) => {
    const { id } = changeInfo.event;
    const updatedBooking = {
      startTime: changeInfo.event.startStr,
      endTime: changeInfo.event.endStr
    };
    
    try {
      validateBookingUpdate(updatedBooking.startTime, updatedBooking.endTime, id);
      await updateBooking(id, updatedBooking);
      showAlert('הצלחה!', 'ההזמנה עודכנה בהצלחה', 'success');
    } catch (error: any) {
      showAlert('שגיאה', `שגיאה בעדכון ההזמנה: ${error.message}`, 'error');
      changeInfo.revert();
    }
  };

  // פונקציה מיוחדת לביטול הזמנה
  const handleCancelBooking = async (booking: any) => {
    if (booking.status === BookingStatus.CANCELED) {
      showAlert('אזהרה', 'ההזמנה כבר בוטלה', 'warning');
      return;
    }

    const reason = prompt('סיבת הביטול:');
    if (!reason) return;
    
    try {
      await updateBooking(booking.id, { 
        status: BookingStatus.CANCELED,
        notes: `${booking.notes || ''}\n[בוטל ב-${new Date().toLocaleString('he-IL')}]: ${reason}`
      });
      showAlert('הצלחה!', 'ההזמנה בוטלה בהצלחה', 'success');
    } catch (error) {
      showAlert('שגיאה', 'שגיאה בביטול ההזמנה', 'error');
    }
  };

  // פונקציה להצגת פרטי הזמנה במודל - תיקון השגיאה
  const showBookingDetails = (booking: any) => {
    const startTime = new Date(booking.startTime).toLocaleString('he-IL');
    const endTime = new Date(booking.endTime).toLocaleString('he-IL');
    
    // תיקון השגיאה - המרה מפורשת למספר
    const startTimeMs = new Date(booking.startTime).getTime();
    const endTimeMs = new Date(booking.endTime).getTime();
    const duration = Math.round((endTimeMs - startTimeMs) / (1000 * 60 * 60 * 100)) / 10;
    
    setModalContent(
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
        <h3 className="text-xl font-bold mb-4 text-gray-800">פרטי הזמנה</h3>
        <div className="space-y-3">
          <div><strong>לקוח:</strong> {booking.customerName || booking.externalUserName}</div>
          <div><strong>אימייל:</strong> {booking.externalUserEmail || 'לא צוין'}</div>
          <div><strong>טלפון:</strong> {booking.externalUserPhone || 'לא צוין'}</div>
          <div><strong>חדר:</strong> {roomName}</div>
          <div><strong>התחלה:</strong> {startTime}</div>
          <div><strong>סיום:</strong> {endTime}</div>
          <div><strong>משך:</strong> {duration} שעות</div>
          <div><strong>סטטוס:</strong> <span className={`px-2 py-1 rounded text-sm ${getStatusColor(booking.status)}`}>{getStatusLabel(booking.status)}</span></div>
          <div><strong>עלות:</strong> {booking.totalCharge || 0} שקל</div>
          <div><strong>שולם:</strong> {booking.isPaid ? 'כן' : 'לא'}</div>
          <div><strong>הערות:</strong> {booking.notes || 'אין הערות'}</div>
        </div>
        <button 
          onClick={() => setShowModal(false)}
          className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          סגור
        </button>
      </div>
    );
    setShowModal(true);
  };

  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    const hebrewStatus = getStatusLabel(newStatus);
    
    if (window.confirm(`האם לשנות סטטוס ההזמנה ל"${hebrewStatus}"?`)) {
      try {
        await updateBooking(bookingId, { status: newStatus });
        showAlert('הצלחה!', `סטטוס שונה ל"${hebrewStatus}" בהצלחה`, 'success');
      } catch (error) {
        showAlert('שגיאה', 'שגיאה בעדכון סטטוס', 'error');
      }
    }
  };

  const showStatusMenu = async (booking: any) => {
    const currentStatus = getStatusLabel(booking.status);
    const statusChoice = window.prompt(`סטטוס נוכחי: ${currentStatus}

בחר סטטוס חדש:
1 - ממתין לאישור (PENDING)
2 - מאושר (APPROVED)  
3 - נדחה (REJECTED)
4 - בוטל (CANCELED)
5 - הושלם (COMPLETED)
6 - ביטול`);

    const statusMap = {
      '1': BookingStatus.PENDING,
      '2': BookingStatus.APPROVED,
      '3': BookingStatus.REJECTED,
      '4': BookingStatus.CANCELED,
      '5': BookingStatus.COMPLETED
    };

    const newStatus = statusMap[statusChoice as keyof typeof statusMap];
    if (newStatus) {
      await handleStatusChange(booking.id, newStatus);
    }
  };

  // const handleEditBooking = async (booking: any) => {
  //   // יצירת פורם דינמי לעדכון
  //   const newStartTime = prompt('זמן התחלה (YYYY-MM-DDTHH:MM):', booking.startTime?.slice(0, 16));
  //   if (!newStartTime) return;
    
  //   const newEndTime = prompt('זמן סיום (YYYY-MM-DDTHH:MM):', booking.endTime?.slice(0, 16));
  //   if (!newEndTime) return;
    
  //   const newNotes = prompt('הערות:', booking.notes || '');
    
  //   // יצירת אובייקט עדכון לפי הטייפס
  //   const updateData: UpdateBookingRequest = {
  //     startTime: newStartTime,
  //     endTime: newEndTime,
  //     notes: newNotes || undefined
  //   };
    
  //   try {
  //     await updateBooking(booking.id, updateData);
  //     alert('ההזמנה עודכנה בהצלחה!');
  //   } catch (error) {
  //     alert('שגיאה בעדכון ההזמנה');
  //     console.error('Update error:', error);
  //   }
  // };

  const handleAdvancedEdit = async (booking: any) => {
    const formData = {
      startTime: booking.startTime?.slice(0, 16) || '',
      endTime: booking.endTime?.slice(0, 16) || '',
      notes: booking.notes || ''
    };
    
    const newStartTime = prompt(`עדכון מתקדם עבור ${booking.customerName || booking.externalUserName}
    
זמן התחלה חדש (YYYY-MM-DDTHH:MM):`, formData.startTime);
    
    if (newStartTime === null) return;
    
    const newEndTime = prompt('זמן סיום חדש (YYYY-MM-DDTHH:MM):', formData.endTime);
    if (newEndTime === null) return;
    
    const newNotes = prompt('הערות:', formData.notes);
    if (newNotes === null) return;
    
    try {
      validateBookingUpdate(newStartTime, newEndTime, booking.id);
      
      const updateData: UpdateBookingRequest = {};
      
      if (newStartTime !== formData.startTime) {
        updateData.startTime = newStartTime;
      }
      
      if (newEndTime !== formData.endTime) {
        updateData.endTime = newEndTime;
      }
      
      if (newNotes !== formData.notes) {
        updateData.notes = newNotes;
      }
      
      if (Object.keys(updateData).length === 0) {
        showAlert('מידע', 'לא בוצעו שינויים', 'info');
        return;
      }
      
      await updateBooking(booking.id, updateData);
      showAlert('הצלחה!', 'ההזמנה עודכנה בהצלחה!', 'success');
    } catch (error: any) {
      showAlert('שגיאה', `שגיאה: ${error.message}`, 'error');
      console.error('Update error:', error);
    }
  };

  const handleEventClick = async (clickInfo: EventClickArg) => {
    const booking = clickInfo.event.extendedProps;
    const customerName = booking.customerName || booking.externalUserName;
    
    const action = window.prompt(`פעולות עבור הזמנה של ${customerName}:
סטטוס נוכחי: ${getStatusLabel(booking.status)}

1 - עדכון מתקדם (זמנים + הערות)
2 - שינוי סטטוס  
3 - ביטול הזמנה (שמירת היסטוריה)
4 - מחיקת הזמנה (מחיקה מלאה)
5 - הצגת פרטים
6 - ביטול`);
    
    switch(action) {
      case '1':
        await handleAdvancedEdit(booking);
        break;
      case '2':
        await showStatusMenu(booking);
        break;
      case '3':
        await handleCancelBooking(booking);
        break;
      case '4':
        if (window.confirm(`אזהרה: מחיקה מלאה!\n\nהאם למחוק לצמיתות את ההזמנה של ${customerName}?\nפעולה זו לא ניתנת לביטול!`)) {
          try {
            await deleteBooking(clickInfo.event.id);
            showAlert('הצלחה!', 'ההזמנה נמחקה בהצלחה', 'success');
          } catch (error) {
            showAlert('שגיאה', 'שגיאה במחיקת ההזמנה', 'error');
          }
        }
        break;
      case '5':
        showBookingDetails(booking);
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">טוען הזמנות עבור {roomName}...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">שגיאה בטעינת {roomName}</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={() => fetchBookings({ roomId })}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  // סטטיסטיקות מהירות
  const getBookingStats = () => {
    const stats = {
      total: roomBookings.length,
      pending: roomBookings.filter(b => b.status === BookingStatus.PENDING).length,
      approved: roomBookings.filter(b => b.status === BookingStatus.APPROVED).length,
      canceled: roomBookings.filter(b => b.status === BookingStatus.CANCELED).length,
      completed: roomBookings.filter(b => b.status === BookingStatus.COMPLETED).length,
    };
    return stats;
  };

  const stats = getBookingStats();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* כותרת ומידע כללי */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-700 mb-2">
          יומן הזמנות - {roomName}
        </h1>
        <p className="text-gray-600 mb-4">
          ניהול הזמנות עבור {roomType === "MEETING_ROOM" ? "חדר ישיבות" : "לאונג'"} - {roomName}
        </p>
        
        {/* סטטיסטיקות מהירות */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div className="bg-white p-3 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">סה"כ הזמנות</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">ממתינות</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-gray-600">מאושרות</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-gray-600">{stats.canceled}</div>
            <div className="text-sm text-gray-600">בוטלו</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">הושלמו</div>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          ID חדר: {roomId} | עדכון אחרון: {new Date().toLocaleString('he-IL')}
        </div>
      </div>

      {/* הוראות שימוש */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">הוראות שימוש:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• לחץ על תאריך ריק ליצירת הזמנה חדשה</li>
          <li>• גרור הזמנה קיימת לשינוי זמן</li>
          <li>• לחץ על הזמנה קיימת לעריכה או שינוי סטטוס</li>
          <li>• השתמש בתפריט העליון לשינוי תצוגה (יום/שבוע/חודש)</li>
        </ul>
      </div>
      <div className="mb-4 flex justify-end">
      {/* <button
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-bold"
        onClick={() => {
          setFormInitialData({
            selectedRoomId: roomId,
            // אפשר להוסיף כאן עוד נתונים אם צריך
          });
          setShowFormModal(true);
          
        }}
      >
        יצירת אירוע חדש
      </button> */}
      <Button onClick={()=>navigate('/meetingRooms')}>להוספת הזמנה חדשה</Button>
    </div>

      {/* לוח השנה */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="p-6">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            locale={heLocale}
            direction="rtl"
            height="auto"
            expandRows={true}
            
            // תיקון זמנים - רק 8-18
            slotMinTime="08:00"
            slotMaxTime="22:00"
            slotDuration="01:00"
            slotLabelInterval="01:00"
            snapDuration="00:15"
            
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
            
            allDaySlot={false}
            weekends={true}
            
            // שעות עסקים
            businessHours={{
              daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
              startTime: '08:00',
              endTime: '22:00',
            }}
            
            // תיקון כותרת
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            
            // הגדרות נוספות לתיקון התצוגה
            dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
            
            // תיקון לאירועים
            selectConstraint={{
              // start: '08:00',
              // end: '18:00'
            }}
            
            // הגדרות נוספות
            aspectRatio={1.35}
            contentHeight="auto"
            events={events}
            selectMirror={true}
            selectable={true}
            selectOverlap={false}
            eventOverlap={false}
            select={handleSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventChange}
            editable={true}
            eventResizableFromStart={true}
            eventDurationEditable={true}
            dayMaxEvents={true}
            moreLinkText="עוד"
            noEventsText="אין הזמנות להצגה"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
            slotEventOverlap={false}
            eventDidMount={(info) => {
              const startTime = new Date(info.event.start!);
              const minutes = startTime.getMinutes();
              
              if (minutes !== 0) {
                info.el.setAttribute('data-start-minute', minutes.toString());
                info.el.style.marginTop = `${(minutes / 60) * 100}%`;
              }
            }}
          />
        </div>
      </div>

      {/* רשימת הזמנות מתחת ללוח השנה */}
      <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">רשימת הזמנות אחרונות</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-right">לקוח</th>
                  <th className="px-4 py-2 text-right">תאריך</th>
                  <th className="px-4 py-2 text-right">שעות</th>
                  <th className="px-4 py-2 text-right">סטטוס</th>
                  <th className="px-4 py-2 text-right">עלות</th>
                  <th className="px-4 py-2 text-right">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {roomBookings.slice(0, 10).map((booking: any) => (
                  <tr key={booking.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{booking.customerName || booking.externalUserName}</td>
                    <td className="px-4 py-2">{new Date(booking.startTime).toLocaleDateString('he-IL')}</td>
                    <td className="px-4 py-2">
                      {new Date(booking.startTime).toLocaleTimeString('he-IL', {hour: '2-digit', minute: '2-digit'})} - 
                      {new Date(booking.endTime).toLocaleTimeString('he-IL', {hour: '2-digit', minute: '2-digit'})}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(booking.status)}`}>
                        {getStatusLabel(booking.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2">{booking.totalCharge || 0} ש"ח</td>
                    <td className="px-4 py-2">
                      <button 
                        onClick={() => showBookingDetails(booking)}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        פרטים
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {roomBookings.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                אין הזמנות להצגה
              </div>
            )}
          </div>
        </div>
      </div>

      {/* מודל להצגת פרטים */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-96 overflow-y-auto">
            {modalContent}
          </div>
        </div>
      )}
      {showFormModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
      <RoomReservations
        initialData={formInitialData}
        onSubmit={() => setShowFormModal(false)}
      />

    </div>
  </div>
)}
    </div>
    
  );
  
};