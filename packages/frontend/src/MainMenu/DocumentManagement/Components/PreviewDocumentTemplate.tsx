import { useEffect, useState } from 'react';
import { Button } from '../../../Common/Components/BaseComponents/Button';
import { showAlert } from '../../../Common/Components/BaseComponents/ShowAlert';
import { DocumentTemplate } from 'shared-types';
import { useDocumentTemplateStore } from '../../../Stores/DocumentManagement/DocumentTemplateStore';
import { useNavigate, useParams } from 'react-router-dom';

interface PreviewDocumentTemplateProps {
  documentTemplate: DocumentTemplate;
  onClose: () => void;
  onRenderHtml: (html: any) => void;
}

export const PreviewDocumentTemplate = () => {
  const { previewDocumentTemplate, getDocumentTemplateById } = useDocumentTemplateStore();
  const { id } = useParams();
  const [documentTemplate, setDocumentTemplate] = useState<DocumentTemplate | null>(null);

  // מצב תצוגה מקדימה
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);

  // יצירת מצב התחלתי למשתנים - מילוי ערכים ריקים לכל משתנה בתבנית
  const [variables, setVariables] = useState<Record<string, string>>(() => {
    const initialVars: Record<string, string> = {};
    if (documentTemplate)
      documentTemplate.variables?.forEach(variableName => {
        const cleanKey = variableName.replace(/^"+|"+$/g, '').trim();
        initialVars[cleanKey] = '';
      });
    return initialVars;
  });

  // עדכון ערך משתנה ספציפי כאשר המשתמש מקליד
  const handleVariableChange = (key: string, value: string) => {
    const cleanKey = key.replace(/^"+|"+$/g, '').trim();
    setVariables(prev => ({ ...prev, [cleanKey]: value }));
  };

  const onRenderHtml = (html: string) => {
    console.log("HTML תצוגה מקדימה:", html);
    // אפשר לפתוח popup, להציג ב-iframe, וכו'
  };

  // יצירת תצוגה מקדימה של התבנית עם ערכי דוגמה
  const getPreviewHtml = () => {
    if (!documentTemplate?.template) return '';
    let html = documentTemplate.template;
    // ערכי דוגמה למשתנים
    const sampleData: Record<string, string> = {
      'שם': 'יוסי כהן',
      'שלום': 'שלום רב',
      'שם שולח': 'ציפי לוי',
      'date': new Date().toLocaleDateString('he-IL'),
      'amount': '1,500 ₪',
      'company_name': 'החברה שלי בע\"מ',
      'address': 'רחוב הרצל 123, תל אביב',
      'phone': '03-1234567',
      'email': 'info@company.co.il'
    };
    // החלפת משתנים ידועים
    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value);
    });
    // משתנים נוספים מתוך הרשימה
    documentTemplate.variables?.forEach(variable => {
      const regex = new RegExp(`{{${variable}}}`, 'g');
      html = html.replace(regex, `[${variable}]`);
    });
    return html;
  };

  // תצוגה מקדימה מהשרת (אם תרצה)
  const handlePreview = async (id: string | undefined) => {
    if (documentTemplate)
      if (!id) {
        showAlert("שגיאה", 'נדרש מזהה תבנית מסמך.', "error");
        return;
      }
    try {
      if (id) {
        const html = await previewDocumentTemplate(id, variables);
        if (html !== null) {
          onRenderHtml(html);
        }
      }
    } catch (error) {
      console.error("Error previewing document template:", error);
      showAlert("שגיאה", "תצוגת תבנית נכשלה.", "error");
    }
  };

  const navigate = useNavigate();
  const onClose = () => {
    navigate(-1);
  };

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!id) return;
      try {
        const result = await getDocumentTemplateById(id);
        setDocumentTemplate(result);
      } catch (error) {
        showAlert("שגיאה", "טעינת תבנית נכשלה.", "error");
      }
    };
    fetchTemplate();
  }, [id]);

  // ...existing code...
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto p-6" dir="rtl">
      <h2 className="text-3xl font-bold mb-4">תבנית מסמך: {documentTemplate && documentTemplate.template}</h2>

      {/* הצגת משתנים רק אם קיימים */}
      {documentTemplate && documentTemplate.variables && documentTemplate.variables.length > 0 && (
        documentTemplate.variables.map(variable => {
          const cleanKey = variable.replace(/^"+|"+$/g, '').trim();
          return (
            <div key={cleanKey} className="flex flex-col mb-4 w-full">
              <label className="font-semibold text-lg mb-2">{cleanKey}</label>
              <input
                type="text"
                value={variables[cleanKey] ?? ''}
                onChange={(e) => handleVariableChange(cleanKey, e.target.value)}
                className="border border-gray-300 rounded p-2 w-full"
                dir="auto"
              />
            </div>
          );
        })
      )}

      {/* כפתור תצוגה מקדימה תמיד מוצג */}
      <div className="flex justify-between mt-4 w-full gap-2">
        <Button onClick={() => setShowHtmlPreview(true)} className="flex-1 flex justify-center">
          הצג תצוגה מקדימה
        </Button>
        <Button onClick={onClose} className="flex-1 flex justify-center">
          סגור
        </Button>
      </div>

      {/* תצוגה מקדימה של HTML */}
      {showHtmlPreview && (
        <div className="w-full mt-6 border rounded bg-white p-4" dir="rtl">
          <h3 className="text-lg font-bold mb-2">תצוגה מקדימה (HTML):</h3>
          <div dangerouslySetInnerHTML={{ __html: getPreviewHtml() }} />
          <Button onClick={() => setShowHtmlPreview(false)} className="mt-4">סגור תצוגה מקדימה</Button>
        </div>
      )}
    </div>
  );
};