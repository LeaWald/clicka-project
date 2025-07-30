import { create } from 'zustand';
import { EmailTemplate } from 'shared-types';
import axiosInstance from '../../Service/Axios';

interface EmailTemplateState {
  emailTemplates: EmailTemplate[];
  currentEmailTemplate: EmailTemplate | null;
  loading: boolean;
  error: string | null;

  // Actions
  getEmailTemplates: () => Promise<void>;
  getEmailTemplateById: (id: string | undefined) => Promise<EmailTemplate | null>;
  createEmailTemplate: (emailTemplate: EmailTemplate) => Promise<EmailTemplate | null>;
  deleteEmailTemplate: (id: string) => Promise<EmailTemplate | null>;
  updateEmailTemplate: (id: string, newEmailTemplate: EmailTemplate) => Promise<EmailTemplate | null>;
  previewEmailTemplate: (id: string, variables: Record<string, string>) => Promise<string | null>;
  clearError: () => void;
}

export const useEmailTemplateStore = create<EmailTemplateState>((set) => ({
  emailTemplates: [],
  currentEmailTemplate: null,
  loading: false,
  error: null,

  // פונקציה זו מחזירה את כל התבניות מייל מהשרת
  getEmailTemplates: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get<EmailTemplate[]>('/emailTemplate');
      set({ emailTemplates: response.data, loading: false });
    } catch (error) {
      console.error('Error getting all emailTemplates:', error);
      set({
        error: 'Error getting all emailTemplates',
        loading: false
      });
      throw error;
    }
  },

  // פונקציה זו מחזירה את התבנית מייל לפי ה-ID שלה
  getEmailTemplateById: async (id: string | undefined): Promise<EmailTemplate | null> => {
    if (!id) {
      set({ error: 'Email template ID is required' });
      return null;
    }
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get<EmailTemplate>(`/emailTemplate/${id}`);
      set({ currentEmailTemplate: response.data, loading: false });
      return response.data;
    } catch (error) {
      console.error('Error getting emailTemplate by id:', error);
      set({
        error: 'Error getting emailTemplate by id',
        loading: false
      });
      throw error;
    }
  },

  // פונקציה זו יוצרת תבנית מייל חדשה
  createEmailTemplate: async (emailTemplate: EmailTemplate): Promise<EmailTemplate | null> => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.post('/emailTemplate', emailTemplate);
      const newEmailTemplate = response.data;
      // עדכון רשימת תבניות המייל
      set(state => ({
        emailTemplates: [...state.emailTemplates, newEmailTemplate],
        loading: false
      }));
      return newEmailTemplate;
    } catch (error) {
      console.error('Error creating emailTemplate:', error);
      set({
        error: 'Error creating emailTemplate',
        loading: false
      });
      throw error;
    }
  },

  // פונקציה זו מוחקת תבנית מייל לפי ה-ID שלה
  deleteEmailTemplate: async (id: string): Promise<EmailTemplate | null> => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.delete(`/emailTemplate/${id}`);
      const deletedEmailTemplate = response.data;
      // הסרת תבנית המייל מהרשימה
      set(state => ({
        emailTemplates: state.emailTemplates.filter(emailTemplate => emailTemplate.id !== id),
        currentEmailTemplate: state.currentEmailTemplate?.id === id ? null : state.currentEmailTemplate,
        loading: false
      }));
      return deletedEmailTemplate;
    } catch (error) {
      console.error('Error removing email template:', error);
      set({
        error: 'Error removing email template',
        loading: false
      });
      throw error;
    }
  },

  // פונקציה זו מעדכנת תבנית מייל לפי ה-ID שלה
  updateEmailTemplate: async (id: string, newEmailTemplate: EmailTemplate): Promise<EmailTemplate | null> => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.put(`/emailTemplate/${id}`, newEmailTemplate);
      const updatedEmailTemplate = response.data;
      // עדכון תבנית המייל ברשימה
      set(state => ({
        emailTemplates: state.emailTemplates.map(emailTemplate =>
          emailTemplate.id === id ? updatedEmailTemplate : emailTemplate
        ),
        currentEmailTemplate: state.currentEmailTemplate?.id === id ? updatedEmailTemplate : state.currentEmailTemplate,
        loading: false
      }));
      return updatedEmailTemplate;
    } catch (error) {
      console.error('Error updating email template:', error);
      set({
        error: 'Error updating email template',
        loading: false
      });
      throw error;
    }
  },

  // פונקציה זו מציגה תצוגה מקדימה של תבנית המייל
  previewEmailTemplate: async (id: string, variables: Record<string, string>): Promise<string | null> => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.post(`/emailTemplate/${id}/preview`, { variables });
      console.log(":package: Full response data:", response.data);
      const renderedHtml = typeof response.data === 'string'
        ? response.data
        : response.data.renderedHtml;
      set({ loading: false });
      return renderedHtml ?? null;
    } catch (error) {
      console.error('Error previewing email template:', error);
      set({ error: 'Error previewing email template', loading: false });
      throw error;
    }
  },

  // פונקציה להגדרת תבנית המייל הנוכחית
  setCurrentEmailTemplate: (emailTemplate: EmailTemplate | null) => {
    set({ currentEmailTemplate: emailTemplate });
  },

  // פונקציה לניקוי שגיאות
  clearError: () => {
    set({ error: null });
  }
}));
