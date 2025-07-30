import Swal from 'sweetalert2';

export const ShowAlertWarn = async (title: string, text: string, icon?:'warning' | 'question') => {
  const result = await Swal.fire({
    title,
    text,
    icon: icon || 'question',
    confirmButtonText: 'אישור',
    showCancelButton: true,
    cancelButtonText: 'ביטול',
  });
  return result.isConfirmed; // מחזיר true אם המשתמש לחץ על "אישור"
};
