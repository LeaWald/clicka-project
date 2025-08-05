import { z } from 'zod';
import { Form } from '../../../Common/Components/BaseComponents/Form';
import { InputField } from '../../../Common/Components/BaseComponents/Input';
import { SelectField } from '../../../Common/Components/BaseComponents/Select';
import { CheckboxField } from '../../../Common/Components/BaseComponents/CheckBox';
import { Button } from '../../../Common/Components/BaseComponents/Button';
import { showAlert } from '../../../Common/Components/BaseComponents/ShowAlert';
import { DocumentTemplate, DocumentType } from 'shared-types';
import { useDocumentTemplateStore } from '../../../Stores/DocumentManagement/DocumentTemplateStore';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useNavigate } from 'react-router-dom';

// סכמת ולידציה לטופס עדכון תבנית מסמך
const schema = z.object({
    name: z.string().nonempty("חובה למלא שדה זה").max(100, "שם התבנית לא יכול להיות ארוך מ-100 תווים"),
    type: z.nativeEnum(DocumentType),
    language: z.enum(["hebrew", "english"]),
    template: z.string().nonempty("חובה למלא תוכן התבנית"),
    variables: z.string().optional(),
    active: z.boolean().optional(),
    is_default: z.boolean().optional()
});

interface UpdateDocumentTemplateProps {
    documentTemplate?: DocumentTemplate;
    onClose?: () => void;
    onDocumentTemplateUpdated?: () => void;
}

export const UpdateDocumentTemplate = ({
    documentTemplate,
    onClose,
    onDocumentTemplateUpdated
}: UpdateDocumentTemplateProps) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const {
        updateDocumentTemplate,
        getDocumentTemplateById,
        loading
    } = useDocumentTemplateStore();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [textDirection, setTextDirection] = useState<'rtl' | 'ltr'>('rtl');

    // קביעת התבנית לעריכה - מה-props או מה-store
    const [templateToEdit,setTemplateToEdit] = useState(useDocumentTemplateStore(state => state.currentDocumentTemplate) || documentTemplate);
    
    const methods = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            type: DocumentType.INVOICE, // 👈 עדכן לערך שקיים
            language: 'hebrew',
            template: '',
            variables: '',
            active: true,
            is_default: false
        }
    });

    // טעינת התבנית מהשרת אם יש ID ואין תבנית מה-props
    useEffect(() => {
         if (id) {
             const a= getDocumentTemplateById(id);
             (async () => {
               const template:any = await a;
               console.log("Loaded template:", (template as any).data) ;
            setTemplateToEdit((template as any).data);
             })();
             console.log("Loaded template:", templateToEdit);
           }
    }, [id, documentTemplate, getDocumentTemplateById,templateToEdit]);

    // מילוי הטופס עם נתוני התבנית הקיימת
    useEffect(() => {
        if (templateToEdit) {
            methods.reset({
                type: templateToEdit.type || DocumentType.INVOICE, // 👈 עדכן לערך שקיים
                language: templateToEdit.language || 'hebrew',
                template: templateToEdit.template || '',
                variables: templateToEdit.variables?.join(', ') || '',
                active: templateToEdit.active ?? true,
                is_default: templateToEdit.isDefault ?? false
            });
        }
    }, [templateToEdit, methods]);

    // עדכון כיוון הטקסט בהתאם לשפה שנבחרה
    useEffect(() => {
        const currentLanguage = methods.watch("language");
        setTextDirection(currentLanguage === 'hebrew' ? 'rtl' : 'ltr');
    }, [methods.watch("language")]);

    // זיהוי אוטומטי של משתנים בתוכן התבנית והוספתם לשדה המשתנים
    const detectVariables = () => {
        const templateContent = methods.getValues("template");
        const variablePattern = /\{\{([^}]+)\}\}/g;
        const matches = templateContent.match(variablePattern);
        
        if (matches) {
            const variables = matches
                .map(match => match.replace(/[{}]/g, ''))
                .filter((variable, index, self) => self.indexOf(variable) === index);
            
            methods.setValue("variables", variables.join(', '));
            showAlert("", `נמצאו ${variables.length} משתנים והתווספו לרשימה`, "success");
        } else {
            showAlert("", "לא נמצאו משתנים בתוכן התבנית", "info");
        }
    };

    // שמירת השינויים בתבנית המסמך
    const handleSubmit = async (data: z.infer<typeof schema>) => {
        if (!templateToEdit?.id) {
            showAlert("שגיאה", "לא נמצאה תבנית לעדכון", "error");
            return;
        }
        setIsSubmitting(true);
        try {
            const updatedTemplate = {
                name: data.name,
                type: data.type,
                language: data.language,
                template: data.template,
                variables: data.variables ? data.variables.split(',').map(v => v.trim()).filter(v => v) : [],
                isDefault: data.is_default ?? false,
                active: data.active ?? true
            };
            console.log("Updating template with data before send:", updatedTemplate);
            const result = await updateDocumentTemplate(templateToEdit.id, updatedTemplate);
            
            if (result) {
                showAlert("", "תבנית המסמך עודכנה בהצלחה", "success");
                onDocumentTemplateUpdated?.();
                
                if (onClose) {
                    onClose();
                } else {
                    navigate(`/document-templates/${templateToEdit.id}`);
                }
            }
        } catch (error) {
            console.error("Error updating document template:", error);
            showAlert("שגיאה", "עדכון תבנית המסמך נכשל. נסה שוב", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ביטול העריכה וחזרה לעמוד הקודם
    const handleCancel = () => {

        navigate(-1);
        return;
        // if (onClose) 
        //     onClose();
        // } else if (templateToEdit) {
        //     navigate(`/document-templates/`);
    };

    // 👈 עדכן את האפשרויות לערכים שקיימים באמת
    const typeOptions = [
        { value: DocumentType.INVOICE, label: "חשבונית" },
        { value: DocumentType.RECEIPT, label: "קבלה" },
        { value: DocumentType.CREDIT_NOTE, label: "זיכוי" },
        { value: DocumentType.STATEMENT, label: "דוח חשבון" },
        { value: DocumentType.TAX_INVOICE, label: "חשבונית מס" }
    ];

    // אפשרויות בחירה לשפות - רק עברית ואנגלית
    const languageOptions = [
        { value: "hebrew", label: "עברית" },
        { value: "english", label: "אנגלית" }
    ];

    // הצגת מסך טעינה בזמן טעינת התבנית
    if (loading && !templateToEdit) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg">טוען תבנית לעריכה...</div>
            </div>
        );
    }

    // הצגת מסך "תבנית לא נמצאה" אם התבנית לא קיימת
    if (!templateToEdit) {
        return (
            <div className="container mx-auto p-6" dir="rtl">
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-600 mb-2">תבנית לא נמצאה</h2>
                    <p className="text-gray-500 mb-4">התבנית המבוקשת אינה קיימת או נמחקה</p>
                    <Button variant="primary" onClick={handleCancel}>
                        חזרה לרשימה
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={`max-w-6xl mx-auto p-6`} style={{ direction: textDirection }}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold">עריכת תבנית מסמך</h2>
                    {/* <p className="text-gray-600">עדכון פרטי התבנית: {templateToEdit.name}</p> */}
                </div>
                {onClose && (
                    <Button variant="secondary" onClick={onClose}>
                        לבטל
                    </Button>
                )}
            </div>

            <Form
                label='עדכון מידע על תבנית מסמך'
                schema={schema}
                onSubmit={handleSubmit}
                methods={methods}
                className="space-y-6"
            >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* פאנל הגדרות */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-xl font-semibold mb-4">פרטים בסיסיים</h3>
                            <div className="space-y-4">
                                <InputField
                                    name="name"
                                    label="שם התבנית"
                                    required
                                    dir={textDirection}
                                />
                                <SelectField
                                    name="type"
                                    label="סוג תבנית"
                                    options={typeOptions}
                                    required
                                    dir={textDirection}
                                />
                                <SelectField
                                    name="language"
                                    label="שפה"
                                    options={languageOptions}
                                    required
                                    dir={textDirection}
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-xl font-semibold mb-4">הגדרות</h3>
                            <div className="space-y-4">
                                <CheckboxField
                                    name="active"
                                    label="תבנית פעילה"
                                />
                                <CheckboxField
                                    name="is_default"
                                    label="ברירת מחדל לסוג זה"
                                />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold">משתנים</h3>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={detectVariables}
                                    className="text-sm"
                                >
                                    זהה אוטומטית
                                </Button>
                            </div>
                            
                            <InputField
                                name="variables"
                                label="משתנים (מופרדים בפסיקים)"
                                placeholder="customer_name, date, amount"
                                dir={textDirection}
                            />
                        </div>
                    </div>
                    {/* עורך התוכן */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-xl font-semibold mb-4">תוכן התבנית</h3>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    תוכן התבנית *
                                </label>
                                <textarea
                                    {...methods.register("template")}
                                    rows={20}
                                    dir={textDirection}
                                    placeholder="הכנס את תוכן התבנית כאן..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                {methods.formState.errors.template && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {methods.formState.errors.template.message}
                                    </p>
                                )}
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                                <h4 className="font-semibold text-blue-800 mb-2">עצות לכתיבת תבניות:</h4>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• השתמש ב-{`{{variable_name}}`} להוספת משתנים</li>
                                    <li>• לדוגמה: שלום {`{{customer_name}}`}, סכום לתשלום: {`{{amount}}`}</li>
                                    <li>• לחץ על "זהה אוטומטית" כדי לזהות משתנים בטקסט</li>
                                    <li>• ודא שהמשתנים מופיעים ברשימת המשתנים</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div
                        style={{width: '120px',height: '40px'}}
                     >
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={isSubmitting || loading}
                    >
                        {isSubmitting ? 'מעדכן...' : 'שמור שינויים'}
                    </Button>
                    </div>
                </div>
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-2">מידע על התבנית הנוכחית:</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>נוצר:</strong> {new Date(templateToEdit.createdAt || '').toLocaleDateString()}</p>
                        <p><strong>עדכון אחרון:</strong> {new Date(templateToEdit.updatedAt || '').toLocaleDateString()}</p>
                    </div>
                </div>
                {isSubmitting && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-4">
                        <p className="text-blue-800">מעדכן תבנית מסמך, אנא המתן...</p>
                    </div>
                )}
            </Form>
            <div style={{width: '120px',height: '40px'}}>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    >
                        ביטול
                    </Button>
                    </div>

        </div>
    );
};