import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTemplateStore } from '../../../Stores/DocumentManagement/DocumentTemplateStore';
import { DocumentTemplate as DocumentTemplateType } from 'shared-types';
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaToggleOn, FaToggleOff, FaFileExport } from 'react-icons/fa';

const DocumentTemplate: React.FC = () => {
  const navigate = useNavigate();
  const {
    documentTemplates,
    loading,
    error,
    getDocumentTemplates,
    deleteDocumentTemplate,
    clearError,
    setCurrentDocumentTemplate
  } = useDocumentTemplateStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterActive, setFilterActive] = useState<string>('ALL');

  // טעינת כל התבניות בעת טעינת הקומפוננטה
  useEffect(() => {
    getDocumentTemplates();
  }, [getDocumentTemplates]);

  // פונקציה לסינון התבניות לפי חיפוש, סוג וסטטוס
    const filteredTemplates = documentTemplates.filter(template => {
      const matchesSearch = template.template?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.type?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'ALL' || template.type === filterType;
      const matchesActive = filterActive === 'ALL' || 
                         (filterActive === 'ACTIVE' && template.active) ||
                         (filterActive === 'INACTIVE' && !template.active);
    
    return matchesSearch && matchesType && matchesActive;
});
  
  // פונקציה לניווט לעמוד הוספת תבנית חדשה
  const handleAdd = () => {
    navigate('/document-templates/add');
  };

  // פונקציה לניווט לעמוד עריכת תבנית קיימת
  const handleEdit = (template: DocumentTemplateType) => {
    setCurrentDocumentTemplate(template);
    navigate(`/document-templates/edit/${template.id}`);
  };

  // פונקציה לניווט לעמוד צפייה בפרטי התבנית
  const handleView = (template: DocumentTemplateType) => {
    setCurrentDocumentTemplate(template);
    navigate(`/document-templates/view/${template.id}`);
  };

  // פונקציה לניווט לעמוד תצוגה מקדימה של התבנית
  const handlePreview = (template: DocumentTemplateType) => {
    setCurrentDocumentTemplate(template);
    navigate(`/document-templates/preview/${template.id}`);
  };

  // פונקציה למחיקת תבנית עם אישור מהמשתמש
  const handleDelete = async (id: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק תבנית זו?')) {
      try {
        await deleteDocumentTemplate(id);
        alert('התבנית נמחקה בהצלחה');
      } catch (error) {
        alert('שגיאה במחיקת התבנית');
      }
    }
  };

  // פונקציה לעיצוב תאריך בפורמט עברי
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  // הצגת אנימציית טעינה בזמן שליפת הנתונים
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
console.log(filteredTemplates, "Filtered Templates");

  return (
    <div className="container mx-auto p-6" dir="rtl">
      {/* כותרת עם כפתור הוספה */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">ניהול תבניות מסמכים</h1>
        <button
          onClick={handleAdd}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <FaPlus /> הוסף תבנית חדשה
        </button>
      </div>

      {/* הצגת הודעת שגיאה אם קיימת */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-500 hover:text-red-700">
            ✕
          </button>
        </div>
      )}

      {/* פאנל סינונים וחיפוש */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* שדה חיפוש טקסט */}
          <div className="relative">
            <FaSearch className="absolute right-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש תבניות..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* רשימה נפתחת לסינון לפי סוג תבנית */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">כל הסוגים</option>
            <option value="RECEIPT">קבלה</option>
            <option value="INVOICE">חשבונית</option>
            <option value="CONTRACT">חוזה</option>
            <option value="REPORT">דוח</option>
          </select>

          {/* רשימה נפתחת לסינון לפי סטטוס פעיל/לא פעיל */}
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">כל הסטטוסים</option>
            <option value="ACTIVE">פעיל</option>
            <option value="INACTIVE">לא פעיל</option>
          </select>

          {/* הצגת מספר התוצאות שנמצאו */}
          <div className="flex items-center text-gray-600">
            <span>נמצאו {filteredTemplates.length} תבניות</span>
          </div>
        </div>
      </div>

      {/* טבלה מרכזית להצגת כל התבניות */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                 <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  שם התבנית
                </th> 
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  סוג
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  שפה
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  סטטוס
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ברירת מחדל
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  תאריך יצירה
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* הצגת הודעה אם לא נמצאו תבניות */}
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    לא נמצאו תבניות
                  </td>
                </tr>
              ) : (
                // מיפוי וחזרה על כל התבניות המסוננות
                filteredTemplates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                     <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {template.name || 'ללא שם'}
                      </div>
                    </td> 
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {template.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {template.language}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        template.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {template.active ? 'פעיל' : 'לא פעיל'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {template.isDefault ? (
                        <FaToggleOn className="text-green-500" />
                      ) : (
                        <FaToggleOff className="text-gray-400" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {template.createdAt ? formatDate(template.createdAt) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {/* כפתורי פעולות לכל תבנית */}
                      <div className="flex gap-2">
                        <button
      onClick={() => handleView(template)}
      className="text-blue-600 hover:text-blue-900 p-1"
      title="צפייה"
    >
      <FaEye />
    </button>
    <button
      onClick={() => handlePreview(template)}
      className="text-green-600 hover:text-green-900 p-1"
      title=" תצוגה וייצוא"
    >
      <FaFileExport />
    </button>
    <button
      onClick={() => handleEdit(template)}
      className="text-yellow-600 hover:text-yellow-900 p-1"
      title="עריכה"
    >
      <FaEdit />
    </button>
    <button
      onClick={ () =>template.id&& handleDelete(template.id)}
      className="text-red-600 hover:text-red-900 p-1"
      title="מחיקה"
    >
      <FaTrash />
    </button>
 </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* פאנל סטטיסטיקות מסכם
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-2xl font-bold text-blue-600">{documentTemplates.length}</div>
          <div className="text-gray-600">סך הכל תבניות</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-2xl font-bold text-green-600">
            {documentTemplates.filter(t => t.active).length}
          </div>
          <div className="text-gray-600">תבניות פעילות</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-2xl font-bold text-orange-600">
            {documentTemplates.filter(t => t.isDefault).length}
          </div>
          <div className="text-gray-600">תבניות ברירת מחדל</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-2xl font-bold text-purple-600">
            {new Set(documentTemplates.map(t => t.type)).size}
          </div>
          <div className="text-gray-600">סוגי תבניות</div>
        </div> */}
      {/* </div> */}
    </div>
  );
};

export default DocumentTemplate;

