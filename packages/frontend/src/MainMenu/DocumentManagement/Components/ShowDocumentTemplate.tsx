import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocumentTemplateStore } from '../../../Stores/DocumentManagement/DocumentTemplateStore';

export const ShowDocumentTemplate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
   const renderPreview = () => {
    if (!currentDocumentTemplate?.template) return '';

    let previewContent = currentDocumentTemplate.template;

    // משתנים מהתבנית
    const variables = currentDocumentTemplate.variables || [];

    // אם אין משתנים בכלל, מציג הודעה ברורה
    if (variables.length === 0) {
      return (
        <div>
          <div dangerouslySetInnerHTML={{ __html: previewContent }} />
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <strong>לתבנית זו לא הוגדרו משתנים.</strong><br />
            אם יש צורך במשתנים, יש להוסיף אותם במבנה <span className="font-mono bg-gray-100 px-2 py-1 rounded">{'{{שם_משתנה}}'}</span> בתוך התבנית.<br />
            דוגמה: <span className="font-mono bg-gray-100 px-2 py-1 rounded">&lt;p&gt;שלום {'{{שם}}'}&lt;/p&gt;</span>
          </div>
        </div>
      );
    }

    // החלפת משתנים בערכי דוגמה
    const sampleData: Record<string, string> = {
      'customer_name': 'יוסי כהן',
      'date': new Date().toLocaleDateString('he-IL'),
      'amount': '1,500 ₪',
      'company_name': 'החברה שלי בע"מ',
      'address': 'רחוב הרצל 123, תל אביב',
      'phone': '03-1234567',
      'email': 'info@company.co.il'
    };

    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      previewContent = previewContent.replace(regex, value);
    });

    variables.forEach((variable, index) => {
      if (!sampleData[variable]) {
        const regex = new RegExp(`{{${variable}}}`, 'g');
        previewContent = previewContent.replace(regex, `[ערך לדוגמה: ${variable}]`);
      }
    });

    return <div dangerouslySetInnerHTML={{ __html: previewContent }} />;
  };
  const { 
    currentDocumentTemplate, 
    loading, 
    error, 
    getDocumentTemplateById,
    deleteDocumentTemplate,
    setCurrentDocumentTemplate,
    clearError 
  } = useDocumentTemplateStore();

  /**
   * מצב תצוגה מקדימה של התבנית
   * מאפשר להחליף בין תצוגת קוד גולמי לתצוגה מעוצבת
   */
  const [showPreview, setShowPreview] = useState(false);

  /**
   * מצב הצגת משתנים
   * מאפשר להציג או להסתיר את רשימת המשתנים הזמינים
   */
  const [showVariables, setShowVariables] = useState(true);

  /**
   * טעינת פרטי התבנית לפי ID מה-URL
   * מתבצעת בעת טעינת הקומפוננטה או שינוי ה-ID
   */
  useEffect(() => {
    if (id) {
      const a= getDocumentTemplateById(id);
      (async () => {
        const template:any = await a;
        console.log("Loaded template:", (template as any).data) ;
        setCurrentDocumentTemplate((template as any).data);
      })();
      console.log("Loaded template:", currentDocumentTemplate);
      
    }
  }, [id, getDocumentTemplateById]);

  /**
   * ניווט לעמוד עריכת התבנית
   * מעביר את התבנית הנוכחית לעריכה
   */
  const handleEdit = () => {
    if (currentDocumentTemplate) {
      navigate(`/document-templates/edit/${currentDocumentTemplate.id}`);
    }
  };

  /**
   * מחיקת התבנית עם אישור בטיחות
   * כולל אישור כפול ומעבר לעמוד הראשי לאחר מחיקה
   */
  const handleDelete = async () => {
    if (!currentDocumentTemplate) return;

    const confirmMessage = `האם אתה בטוח שברצונך למחוק את התבנית "?\nפעולה זו לא ניתנת לביטול.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        if (currentDocumentTemplate.id)
        {
          await deleteDocumentTemplate(currentDocumentTemplate.id);
          alert('התבנית נמחקה בהצלחה');
          navigate('/document-templates');
        }
      } catch (error) {
        alert('שגיאה במחיקת התבנית');
      }
    }
  };

  /**
   * העתקת תוכן התבנית ללוח
   * מאפשר העתקה מהירה של תוכן התבנית לשימוש חוזר
   */
  const handleCopyTemplate = async () => {
    if (!currentDocumentTemplate?.template) return;

    try {
      await navigator.clipboard.writeText(currentDocumentTemplate.template);
      alert('תוכן התבנית הועתק ללוח');
    } catch (error) {
      alert('שגיאה בהעתקת התוכן');
    }
  };

  /**
   * הורדת התבנית כקובץ טקסט
   * יוצר קובץ .txt עם תוכן התבנית להורדה
   */
  const handleDownloadTemplate = () => {
    if (!currentDocumentTemplate) return;

    const content = `
סוג: ${currentDocumentTemplate.type}
שפה: ${currentDocumentTemplate.language}
תאריך יצירה: ${formatDate(currentDocumentTemplate.createdAt)}

תוכן התבנית:
${currentDocumentTemplate.template}

משתנים זמינים:
${currentDocumentTemplate.variables?.join(', ') || 'אין משתנים'}`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `template_${currentDocumentTemplate.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * יצירת תבנית חדשה על בסיס הנוכחית
   * מעביר לעמוד הוספה עם נתונים מועתקים
   */
  // const handleDuplicate = () => {
  //   if (!currentDocumentTemplate) return;
  //   const templateToDuplicate = {
  //     ...currentDocumentTemplate,
  //     id: undefined,
  //         name: `- תבנית- עותק`,

  //     // name: `${currentDocumentTemplate.name || 'תבנית'} - עותק`,
  //     isDefault: false
  //   };   
  //   setCurrentDocumentTemplate(templateToDuplicate);
  //   navigate('/document-templates/add');
  // };

  /**
   * חזרה לעמוד הראשי
   * מנקה את התבנית הנוכחית ומעביר לרשימה
   */
  const handleBack = () => {
    setCurrentDocumentTemplate(null);
    navigate('/document-templates');
  };

  /**
   * עיצוב תאריך בפורמט עברי קריא
   * מטפל במקרים של תאריך לא תקין
   */
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'לא זמין';
    try {
      return new Date(dateString).toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'תאריך לא תקין';
    }
  };

  /**
   * קבלת תרגום לסוג התבנית
   * מחזיר תרגום עברי לסוג התבנית
   */
  const getTypeTranslation = (type: string) => {
    const translations: Record<string, string> = {
      'RECEIPT': 'קבלה',
      'INVOICE': 'חשבונית',
      'CONTRACT': 'חוזה',
      'REPORT': 'דוח',
      'LETTER': 'מכתב',
      'OTHER': 'אחר'
    };
    return translations[type] || type;
  };

  /**
   * קבלת תרגום לשפה
   * מחזיר תרגום עברי לשפה
   */
  const getLanguageTranslation = (language: string) => {
    const translations: Record<string, string> = {
      'hebrew': 'עברית',
      'english': 'אנגלית',
      'arabic': 'ערבית'
    };
    return translations[language] || language;
  };

  /**
   * יצירת תצוגה מקדימה של התבנית
   * מחליף משתנים בערכי דוגמה להדגמה
   */
  // const renderPreview = () => {
  //   if (!currentDocumentTemplate?.template) return '';
    
  //   let previewContent = currentDocumentTemplate.template;
    
  //   // החלפת משתנים בערכי דוגמה
  //   const sampleData: Record<string, string> = {
  //     'customer_name': 'יוסי כהן',
  //     'date': new Date().toLocaleDateString('he-IL'),
  //     'amount': '1,500 ₪',
  //     'company_name': 'החברה שלי בע"מ',
  //     'address': 'רחוב הרצל 123, תל אביב',
  //     'phone': '03-1234567',
  //     'email': 'info@company.co.il'
  //   };

  //   // החלפת משתנים ידועים
  //   Object.entries(sampleData).forEach(([key, value]) => {
  //     const regex = new RegExp(`{{${key}}}`, 'g');
  //     previewContent = previewContent.replace(regex, value);
  //   });

  //   // החלפת משתנים נוספים מהרשימה
  //   currentDocumentTemplate.variables?.forEach((variable, index) => {
  //     if (!sampleData[variable]) {
  //       const regex = new RegExp(`{{${variable}}}`, 'g');
  //       previewContent = previewContent.replace(regex, `[דוגמה ${index + 1}]`);
  //     }
  //   });

  //   return previewContent;
  // };

  /**
   * מסך טעינה פשוט
   * מוצג בזמן שליפת נתוני התבנית
   */
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">טוען...</div>
      </div>
    );
  }

  /**
   * מסך שגיאה במקרה של בעיה בטעינה
   * מציג הודעת שגיאה עם אפשרות חזרה
   */
  if (error) {
    return (
      <div className="container mx-auto p-6" dir="rtl">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-500 hover:text-red-700">
              ✕
            </button>
          </div>
        </div>
        <button
          onClick={handleBack}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          חזרה לרשימה
        </button>
      </div>
    );
  }

  /**
   * מסך "לא נמצא" במקרה שהתבנית לא קיימת
   * מציג הודעה ברורה עם אפשרות חזרה
   */
  if (!currentDocumentTemplate) {
    return (
      <div className="container mx-auto p-6" dir="rtl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-600 mb-2">תבנית לא נמצאה</h2>
          <p className="text-gray-500 mb-4">התבנית המבוקשת אינה קיימת או נמחקה</p>
          <button
            onClick={handleBack}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            חזרה לרשימה
          </button>
        </div>
      </div>
    );
  }

  return (
  <div className="container mx-auto p-6" dir="rtl">
    {/* כותרת עם כפתורי פעולה */}
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <button
          onClick={handleBack}
          className="text-gray-600 hover:text-gray-800 p-2"
          title="חזרה"
        >
          ← חזרה
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {currentDocumentTemplate.name || 'תבנית ללא שם'}
          </h1>
          <p className="text-gray-600">
            {getTypeTranslation(currentDocumentTemplate.type)} • {getLanguageTranslation(currentDocumentTemplate.language)}
          </p>
        </div>
      </div>

      {/* כפתורי פעולה ראשיים */}
      <div className="flex gap-2">
        <button
          onClick={handleEdit}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg"
        >
          עריכה
        </button>
        <button
          onClick={handleDelete}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          מחיקה
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* פאנל פרטי התבנית */}
      <div className="lg:col-span-1 space-y-6">
        {/* מידע בסיסי */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">מידע בסיסי</h2>
          <div className="space-y-4">
            <div>
              <span className="text-sm text-gray-600">סוג תבנית:</span>
              <p className="font-medium">{getTypeTranslation(currentDocumentTemplate.type)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">שפה:</span>
              <p className="font-medium">{getLanguageTranslation(currentDocumentTemplate.language)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">תאריך יצירה:</span>
              <p className="font-medium">{formatDate(currentDocumentTemplate.createdAt)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">עדכון אחרון:</span>
              <p className="font-medium">{formatDate(currentDocumentTemplate.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* סטטוס והגדרות */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">סטטוס והגדרות</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">סטטוס פעילות:</span>
              <span className={`font-medium ${currentDocumentTemplate.active ? 'text-green-600' : 'text-red-600'}`}>
                {currentDocumentTemplate.active ? 'פעיל' : 'לא פעיל'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">ברירת מחדל:</span>
              <span className={`font-medium ${currentDocumentTemplate.isDefault ? 'text-blue-600' : 'text-gray-600'}`}>
                {currentDocumentTemplate.isDefault ? 'כן' : 'לא'}
              </span>
            </div>
          </div>
        </div>

        {/* משתנים זמינים */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">משתנים זמינים</h2>
            <button
              onClick={() => setShowVariables(!showVariables)}
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              {showVariables ? 'הסתר' : 'הצג'}
            </button>
          </div>
          {showVariables && (
            <div className="space-y-2">
              {currentDocumentTemplate.variables && currentDocumentTemplate.variables.length > 0 ? (
                currentDocumentTemplate.variables.map((variable, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 px-3 py-2 rounded flex items-center justify-between"
                  >
                    <span className="font-mono text-sm">{`{{${variable}}}`}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(`{{${variable}}}`)}
                      className="text-blue-500 hover:text-blue-700 text-xs"
                      title="העתק"
                    >
                      העתק
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">אין משתנים מוגדרים</p>
              )}
            </div>
          )}
        </div>

        {/* כפתורי פעולה נוספים */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">פעולות נוספות</h2>
          <div className="space-y-3">
            <button
              onClick={handleCopyTemplate}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              העתק תוכן
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              הורד כקובץ
            </button>
          </div>
        </div>
      </div>

      {/* תוכן התבנית */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">תוכן התבנית</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPreview(false)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  !showPreview 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                קוד גולמי
              </button>
              <button
                onClick={() => setShowPreview(true)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  showPreview 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                תצוגה מקדימה
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 min-h-96 bg-gray-50">
            {showPreview ? (
              <div className="bg-white p-6 rounded shadow-sm">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {renderPreview()}
                </div>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed text-gray-800 overflow-auto">
                {currentDocumentTemplate.template}
              </pre>
            )}
          </div>

          {showPreview && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                <strong>הערה:</strong> זוהי תצוגה מקדימה עם נתוני דוגמה. 
                בשימוש אמיתי, המשתנים יוחלפו בנתונים אמיתיים מהמערכת.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );    
}