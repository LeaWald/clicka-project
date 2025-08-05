import { Routes, Route } from 'react-router-dom';
import  DocumentTemplate  from '../Components/DocumentTemplate';
import  AddDocumentTemplate  from '../Components/AddDocumentTemplate';
import { UpdateDocumentTemplate } from '../Components/UpdateDocumentTemplate';
import {ShowDocumentTemplate} from '../Components/ShowDocumentTemplate';
import { PreviewDocumentTemplate } from './PreviewDocumentTemplate';

// הגדרת כל הנתיבים הקשורים לניהול תבניות מסמכים
export const DocumentTemplateRoutes = () => {
  return (
    <Routes>
      {/* נתיב ראשי - הצגת טבלת תבניות המסמכים */}
      <Route index element={<DocumentTemplate />} />
      
      {/* נתיב ליצירת תבנית מסמך חדשה */}
      <Route path="create" element={<AddDocumentTemplate />} />
      <Route path="add" element={<AddDocumentTemplate />} />
      
      {/* נתיב לעריכת תבנית מסמך קיימת */}
      <Route path="edit/:id" element={<UpdateDocumentTemplate />} />
      <Route path="update/:id" element={<UpdateDocumentTemplate />} />
      
      {/* נתיב לצפייה בתבנית מסמך ספציפית */}
      <Route path="view/:id" element={<ShowDocumentTemplate />} />
      <Route path="show/:id" element={<ShowDocumentTemplate />} />
      
      {/* נתיב לתצוגה מקדימה של תבנית מסמך */}
      <Route path="preview/:id" element={<PreviewDocumentTemplate />} />
      
      {/* נתיב לצפייה בתבנית מסמך (נתיב חלופי) */}
      <Route path=":id" element={<ShowDocumentTemplate />} />
    </Routes>
  );
};