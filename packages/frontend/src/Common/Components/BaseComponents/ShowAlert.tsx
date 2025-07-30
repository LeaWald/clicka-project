import Swal from 'sweetalert2';
type AlertIcon = 'success' | 'error' | 'warning' | 'info';
interface ShowAlertOptions {
  title: string;
  text: string;
  icon: AlertIcon;
  showCancelButton?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
  reverseButtons?: boolean;
}
// תמיכה גם בצורה הישנה וגם בצורה החדשה
export const showAlert = async (
  optionsOrTitle: ShowAlertOptions | string,
  text?: string,
  icon?: AlertIcon
) => {
  if (typeof optionsOrTitle === 'string') {
    // קריאה ישנה: showAlert('כותרת', 'טקסט', 'success')
    return Swal.fire({
      title: optionsOrTitle,
      text: text || '',
      icon: icon || 'info',
      confirmButtonText: 'אישור',
    });
  } else {
    // קריאה חדשה: showAlert({ ...options })
    return Swal.fire({
      title: optionsOrTitle.title,
      text: optionsOrTitle.text,
      icon: optionsOrTitle.icon,
      showCancelButton: optionsOrTitle.showCancelButton || false,
      confirmButtonText: optionsOrTitle.confirmButtonText || 'אישור',
      cancelButtonText: optionsOrTitle.cancelButtonText || 'ביטול',
      reverseButtons: optionsOrTitle.reverseButtons || false,
    });
  }
};