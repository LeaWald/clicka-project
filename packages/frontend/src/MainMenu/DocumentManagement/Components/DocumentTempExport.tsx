import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../../../Common/Components/BaseComponents/Button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocumentTemplateStore } from '../../../Stores/DocumentManagement/DocumentTemplateStore';

export const DocumentTemplatePreviewPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getDocumentTemplateById, currentDocumentTemplate, loading, error } = useDocumentTemplateStore();
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const { 
      setCurrentDocumentTemplate
    } = useDocumentTemplateStore();
  
  // שליפת התבנית לפי id
  useEffect(() => {
      if (id) {
        const a= getDocumentTemplateById(id);
        (async () => {
          const template:any = await a;
          setCurrentDocumentTemplate((template as any).data);
        })();
      }
    }, [id, getDocumentTemplateById, setCurrentDocumentTemplate]);

  // עדכון ערך משתנה
  const handleVariableChange = (key: string, value: string) => {
    setVariables(prev => ({ ...prev, [key]: value }));
  };

  // החלפת משתנים בתבנית
  const getPreviewHtml = () => {
    let html = currentDocumentTemplate?.template || '';
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value || `[${key}]`);
    });
    return html;
  };

  // ייצוא ל-PDF משופר
  const exportToPDF = async () => {
    if (!previewRef.current) return;
    // הגדלת איכות התמונה
    const canvas = await html2canvas(previewRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // חישוב יחס גודל
    const pageWidth = pdf.internal.pageSize.getWidth();
    // const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`${currentDocumentTemplate?.name || 'document'}.pdf`);
  };

  if (loading) {
    return <div className="text-center p-8">טוען...</div>;
  }
  if (error) {
    return <div className="text-center text-red-500 p-8">{error}</div>;
  }
  if (!currentDocumentTemplate) {
    return <div className="text-center p-8">לא נמצאה תבנית</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">{currentDocumentTemplate.name}</h1>
      <div className="mb-4 text-gray-700">
        {currentDocumentTemplate.variables && currentDocumentTemplate.variables.length > 0 ? (
          <>
            <p>לתבנית זו יש משתנים. יש להכניס ערך לכל משתנה:</p>
            <ul className="list-disc pr-5 mb-2">
              {currentDocumentTemplate.variables.map(variable => (
                <li key={variable}>{variable}</li>
              ))}
            </ul>
          </>
        ) : (
          <p>לתבנית זו אין משתנים. ניתן להציג תצוגה מקדימה או לייצא ל-PDF.</p>
        )}
      </div>

      {/* טבלת משתנים */}
      {currentDocumentTemplate.variables && currentDocumentTemplate.variables.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">הזן ערכים למשתנים:</h2>
          <table className="w-full border mb-4">
            <thead>
              <tr>
                <th className="border px-2 py-1">שם משתנה</th>
                <th className="border px-2 py-1">ערך</th>
              </tr>
            </thead>
            <tbody>
              {currentDocumentTemplate.variables.map(variable => (
                <tr key={variable}>
                  <td className="border px-2 py-1">{variable}</td>
                  <td className="border px-2 py-1">
                    <input
                      type="text"
                      value={variables[variable] || ''}
                      onChange={e => handleVariableChange(variable, e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-4 mb-4">
        <Button onClick={() => setShowPreview(true)}>הצג תצוגה מקדימה</Button>
        <Button onClick={() => navigate(-1)}>חזור</Button>
      </div>

      {/* תצוגה מקדימה */}
      {showPreview && (
        <div>
          <div ref={previewRef} className="border rounded p-4 bg-white mb-4" dir="rtl">
            <div dangerouslySetInnerHTML={{ __html: getPreviewHtml() }} />
          </div>
          <div className="flex gap-4">
            <Button onClick={exportToPDF}>ייצוא ל-PDF</Button>
            <Button onClick={() => setShowPreview(false)}>סגור תצוגה מקדימה</Button>
          </div>
        </div>
      )}
        </div>
  );
};