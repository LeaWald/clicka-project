import React from 'react';
import { Users, Map, CreditCard , FileBarChart2, Settings, Mail } from 'lucide-react';
export interface MenuItem {
  label: string;
  path: string;
}
export interface Menu {
  key: string;
  title: string;
  icon: React.ReactNode;
  items: MenuItem[];
}
export const menus: Menu[] = [
  {
    key: 'customers',
    title: 'לקוחות',
    icon: <Users size={18} style={{ marginLeft: 8 }} />,
    items: [
      { label: 'מתעניינים', path: '/leadAndCustomer/leads' },
      { label: 'לקוחות', path: '/leadAndCustomer/customers' },
      { label: 'חוזים', path: '/leadAndCustomer/contracts' },
      { label: 'לגרף מקורות', path: '/leadAndCustomer/leads/LeadSourcesPieChart' },
    ]
  },
  {
    key: 'workspace',
    title: 'חללים',
    icon: <Map size={18} style={{ marginLeft: 8 }} />,
    items: [
      {label: 'ניהול חדרים', path: '/rooms' },
      { label: 'מפה', path: '/workspaceMap' },
      { label: 'הקצאות', path: '/assignmentTable' },
      { label: 'ישיבות', path: '/bookingCalendar' },
      { label: 'ניהול', path: '/managementWorkspace' },
      { label: 'הזמנות', path: '/bookings' }
    ]
  },
  {
    key: 'billing',
    title: 'כספים',
    icon: <CreditCard size={18} style={{ marginLeft: 8 }} />,
    items: [
      { label: 'חשבוניות', path: '/billing/invoiceManagement' },
      { label: 'גבייה', path: '/billing/collection' },
      { label: 'תשלומים', path: '/payments' },
      { label: 'הוצאות', path: '/expenses' },
      { label: 'קופה קטנה', path: '/billing/expenses' },
      { label: 'ספקים', path: '/vendor' },
      { label: 'תמחור', path: '/pricing' }
    ]
  },
  {
    key: 'reports',
    title: 'דוחות',
    icon: <FileBarChart2 size={18} style={{ marginLeft: 8 }} />,
    items: [
      { label: 'דוח תפוסה', path: '/occupancyReports' },
      { label: 'דוח כספי', path: 'billing/financeReports' },
      { label: 'פעילות לקוחות', path: '/customerReports' }
    ]
  },
  {
    key: 'admin',
    title: 'ניהול מערכת',
    icon: <Settings size={18} style={{ marginLeft: 8 }} />,
    items: [
      { label: 'משתמשים', path: '/users' },
      { label: 'פעולות משתמשים', path: '/UserActions' },
      { label: 'הרשאות', path: '/permissions' },
      { label: 'הגדרות', path: '/settings' },
    ]
  },
  {
    key: 'communication',
    title: 'תקשורת',
    icon: <Mail size={18} style={{ marginLeft: 8 }} />,
    items: [
      { label: 'תבניות מייל', path: '/emailTemplate' },
      { label: 'תבניות מסמכים', path: '/document-templates' },
      { label: 'שליחת מיילים', path: '/sendEmails' },
    ]
  },
];






