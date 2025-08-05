// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useDocumentTemplateStore } from '../../../Stores/DocumentManagement/DocumentTemplateStore';
// import { FaSave, FaArrowLeft, FaPlus, FaMinus, FaEye } from 'react-icons/fa';

// interface FormData {
//   customer_id: string;
//   type: string;
//   language: string;
//   template: string;
//   variables: string[];
//   is_default: boolean;
//   active: boolean;
// }

// const AddDocumentTemplate: React.FC = () => {
//   const navigate = useNavigate();
//   const { createDocumentTemplate, loading, error, clearError } = useDocumentTemplateStore();

//   /**
//    * ניהול מצב הטופס עם ערכי ברירת מחדל
//    * מכיל את כל השדות הנדרשים ליצירת תבנית חדשה
//    */
//   const [formData, setFormData] = useState<FormData>({
//      customerId: '',
//   name: '',
//   type: 'RECEIPT',
//   language: 'hebrew',
//   template: '',
//   variables: [],
//   isDefault: false,
//   active: true
//   });

//   /**
//    * ניהול מצב שגיאות ואימות טופס
//    * מכיל שגיאות ספציפיות לכל שדה
//    */
//   const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
//   /**
//    * מצב עזר להוספת משתנה חדש
//    * מאפשר הוספת משתנים לרשימה בצורה דינמית
//    */
//   const [newVariable, setNewVariable] = useState('');

//   /**
//    * מצב תצוגה מקדימה של התבנית
//    * מאפשר לראות איך התבנית תיראה בזמן אמת
//    */
//   const [showPreview, setShowPreview] = useState(false);

//   /**
//    * עדכון ערכי הטופס
//    * מטפל בכל השדות הבסיסיים של הטופס
//    */
//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
//     const { name, value, type } = e.target;
    
//     setFormData(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
//     }));

//     // ניקוי שגיאה של השדה שהשתנה
//     if (formErrors[name]) {
//       setFormErrors(prev => ({
//         ...prev,
//         [name]: ''
//       }));
//     }
//   };

//   /**
//    * הוספת משתנה חדש לרשימת המשתנים
//    * מאפשר הוספת משתנים שיהיו זמינים בתבנית
//    */
//   const handleAddVariable = () => {
//     if (newVariable.trim() && !formData.variables.includes(newVariable.trim())) {
//       setFormData(prev => ({
//         ...prev,
//         variables: [...prev.variables, newVariable.trim()]
//       }));
//       setNewVariable('');
//     }
//   };

//   /**
//    * הסרת משתנה מהרשימה
//    * מאפשר הסרת משתנים שאינם נדרשים יותר
//    */
//   const handleRemoveVariable = (index: number) => {
//     setFormData(prev => ({
//       ...prev,
//       variables: prev.variables.filter((_, i) => i !== index)
//     }));
//   };

//   /**
//    * אימות נתוני הטופס לפני שליחה
//    * בודק שכל השדות החובה מלאים ותקינים
//    */
//   const validateForm = (): boolean => {
//     const errors: Record<string, string> = {};

//     if (!formData.customer_id.trim()) {
//       errors.customer_id = 'מזהה לקוח הוא שדה חובה';
//     }

//     if (!formData.type) {
//       errors.type = 'סוג התבנית הוא שדה חובה';
//     }

//     if (!formData.language) {
//       errors.language = 'שפה היא שדה חובה';
//     }

//     if (!formData.template.trim()) {
//       errors.template = 'תוכן התבנית הוא שדה חובה';
//     }

//     setFormErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   /**
//    * שליחת הטופס ליצירת תבנית חדשה
//    * מבצע אימות, שולח לשרת ומנווט חזרה בהצלחה
//    */
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     clearError();

//     if (!validateForm()) {
//       return;
//     }

//     try {
//       await createDocumentTemplate(formData);
//       alert('התבנית נוצרה בהצלחה!');
//       navigate('/document-templates');
//     } catch (error) {
//       console.error('Error creating template:', error);
//       alert('שגיאה ביצירת התבנית');
//     }
//   };

//   /**
//    * ביטול הטופס וחזרה לעמוד הראשי
//    * מציג אישור אם יש שינויים שלא נשמרו
//    */
//   const handleCancel = () => {
//     const hasChanges = formData.customer_id || formData.template || formData.variables.length > 0;
    
//     if (hasChanges && !window.confirm('יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לצאת?')) {
//       return;
//     }
    
//     navigate('/document-templates');
//   };

//   /**
//    * הצגת תצוגה מקדימה של התבנית
//    * מחליף משתנים בערכי דוגמה להדגמה
//    */
//   const renderPreview = () => {
//     let previewContent = formData.template;
    
//     // החלפת משתנים בערכי דוגמה
//     formData.variables.forEach(variable => {
//       const regex = new RegExp(`{{${variable}}}`, 'g');
//       previewContent = previewContent.replace(regex, `[${variable}]`);
//     });

//     return previewContent;
//   };

//   return (
//     <div className="container mx-auto p-6" dir="rtl">
//       {/* כותרת עם כפתור חזרה */}
//       <div className="flex items-center gap-4 mb-6">
//         <button
//           onClick={handleCancel}
//           className="text-gray-600 hover:text-gray-800 p-2"
//           title="חזרה"
//         >
//           <FaArrowLeft size={20} />
//         </button>
//         <h1 className="text-3xl font-bold text-gray-800">הוספת תבנית מסמך חדשה</h1>
//       </div>

//       {/* הצגת שגיאות כלליות */}
//       {error && (
//         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
//           <span>{error}</span>
//           <button onClick={clearError} className="text-red-500 hover:text-red-700">
//             ✕
//           </button>
//         </div>
//       )}

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* טופס הוספת תבנית */}
//         <div className="bg-white rounded-lg shadow-md p-6">
//           <h2 className="text-xl font-semibold mb-4">פרטי התבנית</h2>
          
//           <form onSubmit={handleSubmit} className="space-y-4">
//             {/* מזהה לקוח */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 מזהה לקוח *
//               </label>
//               <input
//                 type="text"
//                 name="customer_id"
//                 value={formData.customer_id}
//                 onChange={handleInputChange}
//                 className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//                   formErrors.customer_id ? 'border-red-500' : 'border-gray-300'
//                 }`}
//                 placeholder="הכנס מזהה לקוח"
//               />
//               {formErrors.customer_id && (
//                 <p className="text-red-500 text-sm mt-1">{formErrors.customer_id}</p>
//               )}
//             </div>

//             {/* סוג התבנית */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 סוג התבנית *
//               </label>
//               <select
//                 name="type"
//                 value={formData.type}
//                 onChange={handleInputChange}
//                 className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//                   formErrors.type ? 'border-red-500' : 'border-gray-300'
//                 }`}
//               >
//                 <option value="RECEIPT">קבלה</option>
//                 <option value="INVOICE">חשבונית</option>
//                 <option value="CONTRACT">חוזה</option>
//                 <option value="REPORT">דוח</option>
//                 <option value="LETTER">מכתב</option>
//                 <option value="OTHER">אחר</option>
//               </select>
//               {formErrors.type && (
//                 <p className="text-red-500 text-sm mt-1">{formErrors.type}</p>
//               )}
//             </div>

//             {/* שפה */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 שפה *
//               </label>
//               <select
//                 name="language"
//                 value={formData.language}
//                 onChange={handleInputChange}
//                 className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//                   formErrors.language ? 'border-red-500' : 'border-gray-300'
//                 }`}
//               >
//                 <option value="hebrew">עברית</option>
//                 <option value="english">אנגלית</option>
//                 <option value="arabic">ערבית</option>
//               </select>
//               {formErrors.language && (
//                 <p className="text-red-500 text-sm mt-1">{formErrors.language}</p>
//               )}
//             </div>

//             {/* תוכן התבנית */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 תוכן התבנית *
//               </label>
//               <textarea
//                 name="template"
//                 value={formData.template}
//                 onChange={handleInputChange}
//                 rows={10}
//                 className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//                   formErrors.template ? 'border-red-500' : 'border-gray-300'
//                 }`}
//                 placeholder="הכנס את תוכן התבנית כאן... השתמש ב-{{variable}} למשתנים"
//               />
//               {formErrors.template && (
//                 <p className="text-red-500 text-sm mt-1">{formErrors.template}</p>
//               )}
//             </div>

//             {/* ניהול משתנים */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 משתנים
//               </label>
              
//               {/* הוספת משתנה חדש */}
//               <div className="flex gap-2 mb-2">
//                 <input
//                   type="text"
//                   value={newVariable}
//                   onChange={(e) => setNewVariable(e.target.value)}
//                   onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddVariable())}
//                   className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   placeholder="שם המשתנה"
//                 />
//                 <button
//                   type="button"
//                   onClick={handleAddVariable}
//                   className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg"
//                 >
//                   <FaPlus />
//                 </button>
//               </div>

//               {/* רשימת משתנים קיימים */}
//               <div className="space-y-1">
//                 {formData.variables.map((variable, index) => (
//                   <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">

//                     <span className="text-sm">{`{{${variable}}}`}</span>
//                     <button
//                       type="button"
//                       onClick={() => handleRemoveVariable(index)}
//                       className="text-red-500 hover:text-red-700"
//                     >
//                       <FaMinus />
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* הגדרות נוספות */}
//             <div className="space-y-3">
//               <div className="flex items-center">
//                 <input
//                   type="checkbox"
//                   id="is_default"
//                   name="is_default"
//                   checked={formData.is_default}
//                   onChange={handleInputChange}
//                   className="mr-2"
//                 />
//                 <label htmlFor="is_default" className="text-sm text-gray-700">
//                   הגדר כתבנית ברירת מחדל
//                 </label>
//               </div>

//               <div className="flex items-center">
//                 <input
//                   type="checkbox"
//                   id="active"
//                   name="active"
//                   checked={formData.active}
//                   onChange={handleInputChange}
//                   className="mr-2"
//                 />
//                 <label htmlFor="active" className="text-sm text-gray-700">
//                   תבנית פעילה
//                 </label>
//               </div>
//             </div>

//            {/* כפתורי פעולה */}
//             <div className="flex gap-3 pt-4">
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
//               >
//                 <FaSave />
//                 {loading ? 'שומר...' : 'שמור תבנית'}
//               </button>
              
//               <button
//                 type="button"
//                 onClick={handleCancel}
//                 className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
//               >
//                 ביטול
//               </button>
              
//               <button
//                 type="button"
//                 onClick={() => setShowPreview(!showPreview)}
//                 className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
//               >
//                 <FaEye />
//                 {showPreview ? 'הסתר תצוגה מקדימה' : 'הצג תצוגה מקדימה'}
//               </button>
//             </div>
//           </form>
//         </div>

//         {/* פאנל תצוגה מקדימה */}
//         <div className="bg-white rounded-lg shadow-md p-6">
//           <h2 className="text-xl font-semibold mb-4">תצוגה מקדימה</h2>
          
//           {showPreview ? (
//             <div className="border border-gray-200 rounded-lg p-4 min-h-96 bg-gray-50">
//               <div className="bg-white p-4 rounded shadow-sm">
//                 <h3 className="text-lg font-medium mb-3 text-gray-800">
//                   {formData.type} - {formData.language}
//                 </h3>
//                 <div className="whitespace-pre-wrap text-sm leading-relaxed">
//                   {formData.template ? renderPreview() : 'הכנס תוכן תבנית כדי לראות תצוגה מקדימה...'}
//                 </div>
//               </div>
//             </div>
//           ) : (
//             <div className="border border-gray-200 rounded-lg p-4 min-h-96 bg-gray-50 flex items-center justify-center">
//               <div className="text-center text-gray-500">
//                 <FaEye size={48} className="mx-auto mb-3 opacity-50" />
//                 <p>לחץ על "הצג תצוגה מקדימה" כדי לראות איך התבנית תיראה</p>
//               </div>
//             </div>
//           )}

//           {/* מידע עזר על משתנים */}
//           <div className="mt-4 p-3 bg-blue-50 rounded-lg">
//             <h4 className="font-medium text-blue-800 mb-2">עזרה למשתנים:</h4>
//             <ul className="text-sm text-blue-700 space-y-1">
//               <li>• השתמש ב-{`{{variable_name}}`} כדי להוסיף משתנה</li>
//               <li>• הוסף משתנים ברשימה כדי שיהיו זמינים</li>
//               <li>• משתנים יוחלפו בערכים אמיתיים בעת יצירת המסמך</li>
//               <li>• דוגמאות: {`{{customer_name}}, {{date}}, {{amount}}`}</li>
//             </ul>
//           </div>

//           {/* רשימת משתנים זמינים */}
//           {formData.variables.length > 0 && (
//             <div className="mt-4 p-3 bg-green-50 rounded-lg">
//               <h4 className="font-medium text-green-800 mb-2">משתנים זמינים:</h4>
//               <div className="flex flex-wrap gap-2">
//                 {formData.variables.map((variable, index) => (
//                   <span
//                     key={index}
//                     className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-mono"
//                   >
//                     {`{{${variable}}}`}
//                   </span>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* טיפים ועזרה */}
//       <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
//         <h3 className="font-medium text-yellow-800 mb-2">💡 טיפים ליצירת תבנית:</h3>
//         <ul className="text-sm text-yellow-700 space-y-1">
//           <li>• וודא שהמזהה לקוח תואם למזהה בבסיס הנתונים</li>
//           <li>• השתמש בשמות משתנים ברורים ומובנים</li>
//           <li>• בדוק את התצוגה המקדימה לפני השמירה</li>
//           <li>• תבנית ברירת מחדל תשמש אוטומטית למסמכים חדשים</li>
//           <li>• ניתן לערוך את התבנית גם לאחר השמירה</li>
//         </ul>
//       </div>
//     </div>
//   );
// };
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTemplateStore } from '../../../Stores/DocumentManagement/DocumentTemplateStore';
import { DocumentType } from 'shared-types'; // או מהנתיב הנכון

interface FormData {
  name: string;
  type: DocumentType; // 👈 השתמש ב-enum במקום union type
  language: 'hebrew' | 'english';
  template: string;
  variables: string[];
  isDefault: boolean;
  active: boolean;
}
const AddDocumentTemplate: React.FC = () => {
  const navigate = useNavigate();
  const { createDocumentTemplate, error, clearError } = useDocumentTemplateStore();
  const currentDocumentTemplate = useDocumentTemplateStore(state => state.currentDocumentTemplate);
  const [formData, setFormData] = useState<FormData>(  currentDocumentTemplate
    ? {
        name: currentDocumentTemplate.name || '',
        type: currentDocumentTemplate.type || DocumentType.RECEIPT,
        language: currentDocumentTemplate.language || 'hebrew',
        template: currentDocumentTemplate.template || '',
        variables: currentDocumentTemplate.variables || [],
        isDefault: false, // תמיד לא ברירת מחדל בשכפול
        active: true
      }
    : {
        name: '',
        type: DocumentType.RECEIPT,
        language: 'hebrew',
        template: '',
        variables: [],
        isDefault: false,
        active: true
      }
);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newVariable, setNewVariable] = useState('');
  const [showPreview] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddVariable = () => {
    if (newVariable.trim() && !formData.variables.includes(newVariable.trim())) {
      setFormData(prev => ({
        ...prev,
        variables: [...prev.variables, newVariable.trim()]
      }));
      setNewVariable('');
    }
  };

  const handleRemoveVariable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'יש להזין שם תבנית';
    if (!formData.template.trim()) errors.template = 'תוכן התבנית נדרש';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validateForm()) return;
    try {
      await createDocumentTemplate(formData);      
      alert('התבנית נוצרה בהצלחה!');
      navigate('/document-templates');
    } catch {
      alert('שגיאה ביצירת התבנית');
    }
  };

  const renderPreview = () => {
    let previewContent = formData.template;
    formData.variables.forEach(variable => {
      const regex = new RegExp(`{{${variable}}}`, 'g');
      previewContent = previewContent.replace(regex, `[${variable}]`);
    });
    return previewContent;
  };
useEffect(() => {
  if (currentDocumentTemplate) {
    setFormData({
      name: currentDocumentTemplate.name || '',
      type: currentDocumentTemplate.type || DocumentType.RECEIPT,
      language: currentDocumentTemplate.language || 'hebrew',
      template: currentDocumentTemplate.template || '',
      variables: currentDocumentTemplate.variables || [],
      isDefault: false,
      active: true
    });
  }
}, [currentDocumentTemplate]);
  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">הוספת תבנית מסמך</h1>
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">

        <input name="name" placeholder="שם תבנית" value={formData.name} onChange={handleInputChange} className="w-full p-2 border" />
        {formErrors.name && <p className="text-red-500 text-sm">{formErrors.name}</p>}

        <select name="type" value={formData.type} onChange={handleInputChange} className="w-full p-2 border">
          <option value="RECEIPT">קבלה</option>
          <option value="INVOICE">חשבונית</option>
          <option value="TAX_INVOICE">חשבונית מס</option>
          <option value="CREDIT_NOTE">זיכוי</option>
          <option value="STATEMENT">דו"ח מצב</option>
        </select>

        <select name="language" value={formData.language} onChange={handleInputChange} className="w-full p-2 border">
          <option value="hebrew">עברית</option>
          <option value="english">אנגלית</option>
        </select>
       <a
  href="https://wordtohtml.net/"
  className="text-blue-500 hover:underline"
  target="_blank"
  rel="noopener noreferrer"
>
  ליצירת תוכן תבנית לחץ כאן עצב תוכן והעתק קוד
</a>
         <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                                <h4 className="font-semibold text-blue-800 mb-2">עצות לכתיבת תבניות:</h4>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• השתמש ב-{`{{variable_name}}`} להוספת משתנים</li>
                                    <li>• לדוגמה: שלום {`{{customer_name}}`}, סכום לתשלום: {`{{amount}}`}</li>
                                    <li>• ודא שהמשתנים מופיעים ברשימת המשתנים</li>
                                </ul>
                            </div>
        <textarea name="template" value={formData.template} onChange={handleInputChange} className="w-full h-40 p-2 border" placeholder="תוכן התבנית" />
        {formErrors.template && <p className="text-red-500 text-sm">{formErrors.template}</p>}

        <div className="space-y-2">
          <h4 className="font-semibold text-gray-800">רשימת המשתנים:</h4>
          <div className="flex"> 
            <input value={newVariable} onChange={(e) => setNewVariable(e.target.value)} className="flex-1 p-2 border" placeholder="משתנה חדש" />
            <button type="button" onClick={handleAddVariable} className="p-2 bg-green-500 text-white">הוסף</button>
          </div>
          {formData.variables.map((v, i) => (
            <div key={i} className="flex justify-between border p-2">
              <span>{`{{${v}}}`}</span>
              <button type="button" onClick={() => handleRemoveVariable(i)}>הסר</button>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <label>
            <input type="checkbox" name="isDefault" checked={formData.isDefault} onChange={handleInputChange} /> ברירת מחדל
          </label>
          <label>
            <input type="checkbox" name="active" checked={formData.active} onChange={handleInputChange} /> פעיל
          </label>
        </div>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">שמור</button>
        {/* <button type="button" onClick={() => setShowPreview(!showPreview)} className="bg-gray-500 text-white px-4 py-2 ml-2 rounded">
          תצוגה מקדימה
        </button> */}
      </form>

      {showPreview && (
        <div className="mt-6 border p-4 bg-gray-50 rounded">
          <h2 className="text-lg font-bold mb-2">תצוגה מקדימה:</h2>
          <div className="whitespace-pre-wrap text-sm">{renderPreview()}</div>
        </div>
      )}
    </div>
  );
};

export default AddDocumentTemplate;
