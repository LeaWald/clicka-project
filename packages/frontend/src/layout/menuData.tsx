import React from 'react';
import { Home, Users, Map, FileText, FileBarChart2, Settings, Mail, HelpCircle } from 'lucide-react';

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
    key: 'dashboard',
    title: 'לוח בקרה',
    icon: <Home size={18} style={{ marginLeft: 8 }} />,
    items: [
      { label: 'סקירה כללית', path: '/dashboard' },
      { label: 'חוזים קרובים', path: '/dashboard/contracts' },
      { label: 'תשלומים אחרונים', path: '/dashboard/payments' },
      { label: 'מפת חללים', path: '/workspaceMap' },
      { label: 'לגרף מקורות', path: '/leadAndCustomer/leads/LeadSourcesPieChart' },
    ]
  },
  {
    key: 'customers',
    title: 'לקוחות',
    icon: <Users size={18} style={{ marginLeft: 8 }} />,
    items: [
      { label: 'מתעניינים', path: '/leadAndCustomer/leads' },
      { label: 'לקוחות', path: '/leadAndCustomer/customers' },
      { label: 'חוזים', path: '/leadAndCustomer/contracts' },
      { label: 'לגרף מקורות', path: '/leadAndCustomer/leads/LeadSourcesPieChart' },
      { label: 'היסטוריית לקוח', path: '/customerHistory' }
    ]
  },
  {
    key: 'workspace',
    title: 'חללים',
    icon: <Map size={18} style={{ marginLeft: 8 }} />,
    items: [
      {label: 'חדרים', path: '/rooms' },
      { label: 'מפה', path: '/workspaceMap' },
      { label: 'הקצאות', path: '/assignmentTable' },
      { label: 'ישיבות', path: '/bookingCalendar' },
      { label: 'חללים', path: '/managementWorkspace' },
      { label: 'הזמנות', path: '/bookings' }
    ]
  },
  {
    key: 'billing',
    title: 'חשבוניות',
    icon: <FileText size={18} style={{ marginLeft: 8 }} />,
    items: [
      { label: 'חשבוניות', path: '/billing/invoiceManagement' },
      { label: 'גבייה', path: '/billing/collection' },
      { label: 'תשלומים', path: '/payments' },
      { label: 'הוצאות', path: '/expenses' },
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
      { label: 'אינטגרציות', path: '/integrations' },
      { label: 'העלאת מסמכים', path: '/documentUpload' }
    ]
  },
  {
    key: 'communication',
    title: 'תקשורת',
    icon: <Mail size={18} style={{ marginLeft: 8 }} />,
    items: [
      { label: 'תבניות מייל', path: '/emailTemplate' },
      { label: 'שליחת מיילים', path: '/sendEmails' },
      { label: 'התראות', path: '/notifications' }
    ]
  },
  {
    key: 'support',
    title: 'תמיכה',
    icon: <HelpCircle size={18} style={{ marginLeft: 8 }} />,
    items: [
      { label: 'שאלות נפוצות', path: '/faq' },
      { label: 'מדריכים', path: '/help' },
      { label: 'צור קשר', path: '/contactSupport' }
    ]
  }
];