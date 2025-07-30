// import React from 'react';
// import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// import FileUploader from './FileUploader';

// test('ניתן להעלות קובץ והוא מופיע ברשימה', async () => {
//  render(<FileUploader folderPath="טסטים/בדיקה" />);

//   // מוצא את ה-input לפי ה-id שהגדרת
//   const fileInput = screen.getByLabelText(/בחר קובץ/i) || screen.getByLabelText(/file-upload/i) || document.getElementById('file-upload');
//   // מוצא את ה-input לפי ה-id שהגדרת
//   const fileInput = screen.getByLabelText(/בחר קובץ/i) || screen.getByLabelText(/file-upload/i) || document.getElementById('file-upload');

//   // יוצר קובץ מזויף
//   const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
//   // יוצר קובץ מזויף
//   const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

//   // מדמה העלאת קובץ
//   fireEvent.change(fileInput, { target: { files: [file] } });
//   // מדמה העלאת קובץ
//   fireEvent.change(fileInput, { target: { files: [file] } });

//   // בודק שהקובץ מופיע ברשימת הקבצים
//   await waitFor(() => {
//     expect(screen.getByText('hello.txt')).toBeInTheDocument();
//   });
// });
//   // בודק שהקובץ מופיע ברשימת הקבצים
//   await waitFor(() => {
//     expect(screen.getByText('hello.txt')).toBeInTheDocument();
//   });
// });