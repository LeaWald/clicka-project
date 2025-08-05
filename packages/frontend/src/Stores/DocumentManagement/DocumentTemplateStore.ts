//  קובץ store - useDocumentTemplateStore.ts

import { create } from 'zustand';
import { DocumentTemplate } from 'shared-types';
import { axiosInstance } from '../../Service/Axios';
import{CreateDocumentTemplateRequest} from 'shared-types/template';


interface DocumentTemplateState {
  documentTemplates: DocumentTemplate[];
  currentDocumentTemplate: DocumentTemplate | null;
  loading: boolean;
  error: string | null;

  getDocumentTemplates: () => Promise<void>;
  getDocumentTemplateById: (id: string | undefined) => Promise<DocumentTemplate | null>;
  createDocumentTemplate: (templateData: CreateDocumentTemplateRequest) => Promise<DocumentTemplate | null>;
  deleteDocumentTemplate: (id: string) => Promise<DocumentTemplate | null>;
  updateDocumentTemplate: (id: string, templateData: CreateDocumentTemplateRequest) => Promise<DocumentTemplate | null>;
  previewDocumentTemplate: (id: string, variables: Record<string, string>) => Promise<string | null>;
  clearError: () => void;
  setCurrentDocumentTemplate: (documentTemplate: DocumentTemplate | null) => void;
}

export const useDocumentTemplateStore = create<DocumentTemplateState>((set) => ({
  documentTemplates: [],
  currentDocumentTemplate: null,
  loading: false,
  error: null,

  getDocumentTemplates: async () => {
        const API_BASE = process.env.REACT_APP_API_URL;
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/documents/document_template`,{method:'GET',
        headers: { 'Content-Type': 'application/json' }});
      const aa=await response.json();
      set({ documentTemplates:aa, loading: false });
    } catch (error) {
      set({ error: 'Error getting all documentTemplates', loading: false });
      throw error;
    }  
  },

  getDocumentTemplateById: async (id: string | undefined): Promise<DocumentTemplate | null> => {
    if (!id) {
      set({ error: 'Document template ID is required' });
      return null;
    }
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get<DocumentTemplate>(`/documents/document_template/${id}`);
      set({ currentDocumentTemplate: response.data, loading: false });
      console.log("success");
      return response.data;
    } catch (error) {
      set({ error: 'Error getting documentTemplate by id', loading: false });
      throw error;
    }
  },

  createDocumentTemplate: async (templateData: CreateDocumentTemplateRequest): Promise<DocumentTemplate | null> => {
    set({ loading: true, error: null });
    try {
      const now = new Date().toISOString();
    //   const templateToInsert = {
    //     name: templateData.name,
    //     type: templateData.type,
    //     language: templateData.language,
    //     template: templateData.template,
    //     variables: templateData.variables,
    //     isDefault: templateData.isDefault,
    //     active: templateData.active,
    //     createdAt: now,
    //     updatedAt: now
    //   };
    const templateToInsert = {
  name: templateData.name,
  type: templateData.type,
  language: templateData.language,
  template: templateData.template,
  variables: templateData.variables,
  isDefault: templateData.isDefault,
  active: templateData.active,
  createdAt: now,
  updatedAt: now
};
      const response = await axiosInstance.post('/documents/document_template', {newDocuments:templateToInsert});
      const newDocumentTemplate = response.data;
      set(state => ({
        documentTemplates: [...state.documentTemplates, newDocumentTemplate],
        loading: false
      }));
      return newDocumentTemplate;
    } catch (error) {
      set({ error: 'Error creating documentTemplate', loading: false });
      throw error;
    }
  },

  deleteDocumentTemplate: async (id: string): Promise<DocumentTemplate | null> => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.delete(`/documents/document_template/${id}`);
      const deletedDocumentTemplate = response.data;
      set(state => ({
        documentTemplates: state.documentTemplates.filter(documentTemplate => documentTemplate.id !== id),
        currentDocumentTemplate: state.currentDocumentTemplate?.id === id ? null : state.currentDocumentTemplate,
        loading: false
      }));
      return deletedDocumentTemplate;
    } catch (error) {
      set({ error: 'Error removing document template', loading: false });
      throw error;
    }
  },

  updateDocumentTemplate: async (id: string, templateData: CreateDocumentTemplateRequest): Promise<DocumentTemplate | null> => {
    set({ loading: true, error: null });
    try {
      const now = new Date().toISOString();
      const templateToUpdate = {
    //     name: templateData.name,
    //     type: templateData.type,
    //     language: templateData.language,
    //     template: templateData.template,
    //     variables: templateData.variables,
    //     isDefault: templateData.isDefault,
    //     active: templateData.active,
    //     updatedAt: now
    //   };
  name: templateData.name,
  type: templateData.type,
  language: templateData.language,
  template: templateData.template,
  variables: templateData.variables,
  isDefault: templateData.isDefault,     
  createdAt: now, // אם רוצים לשמור את התאריך המקורי
  updatedAt: now
};
console.log(templateToUpdate, "Updating template with data before 2 send");

      const response = await axiosInstance.put(`/documents/document_template/${id}`, templateToUpdate);
      const updatedDocumentTemplate = response.data;
      set(state => ({
        documentTemplates: state.documentTemplates.map(documentTemplate =>
          documentTemplate.id === id ? updatedDocumentTemplate : documentTemplate
        ),
        currentDocumentTemplate: state.currentDocumentTemplate?.id === id ? updatedDocumentTemplate : state.currentDocumentTemplate,
        loading: false
      }));
      return updatedDocumentTemplate;
    } catch (error) {
      set({ error: 'Error updating document template', loading: false });
      throw error;
    }
  },

  previewDocumentTemplate: async (id: string, variables: Record<string, string>): Promise<string | null> => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.post(`/documents/document_template/${id}/preview`, { variables });
      const renderedHtml = typeof response.data === 'string' ? response.data : response.data.renderedHtml;
      set({ loading: false });
      return renderedHtml ?? null;
    } catch (error) {
      set({ error: 'Error previewing document template', loading: false });
      throw error;
    }
  },

  setCurrentDocumentTemplate: (documentTemplate: DocumentTemplate | null) => {
    set({ currentDocumentTemplate: documentTemplate });
  },

  clearError: () => {
    set({ error: null });
  }
}));

//אופציה להוספה בהמשך מאוחר יותר
/*getActiveDocumentTemplates() - שליפת תבניות פעילות בלבד
toggleDocumentTemplateStatus(id) - הפעלה/השבתה של תבנית
getDocumentTemplatesByType(type) - שליפת תבניות לפי סוג
*/