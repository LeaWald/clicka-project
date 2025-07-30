import Swal from 'sweetalert2';

export const showAlertQuestion = async (
  text: string,
  title = '',
): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'question',
    confirmButtonText: 'כן',
    cancelButtonText: 'לא',
    showCancelButton: true,
  });
  return result.isConfirmed; // true אם נלחץ "כן"
};
