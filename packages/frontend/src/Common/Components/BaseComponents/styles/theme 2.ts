// מערכת עיצוב לפי קובץ האפיון
export const designSystem = {
  colors: {
    primary: '#2563EB',      // כחול עיקרי
    secondary: '#DAA520',    // זהב משני
    success: '#10B981',      // ירוק הצלחה
    error: '#EF4444',        // אדום שגיאה
    warning: '#F59E0B',      // כתום אזהרה
    neutral: {
      50: '#F9FAFB',
      100: '#F3F4F6', 
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827'
    }
  },
  
  // יחידת בסיס 4 פיקסלים לפי ההנחיות
  spacing: {
    base: 4,
    xs: 4,    // 4px
    sm: 8,    // 8px  
    md: 16,   // 16px
    lg: 24,   // 24px
    xl: 32,   // 32px
    xxl: 48   // 48px
  },
  
  typography: {
    fontFamily: {
      hebrew: '"Noto Sans Hebrew", sans-serif',
      latin: '"Inter", sans-serif'
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px'
    }
  },
  
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px'
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
  }
};

// פונקציות עזר
export const spacing = (multiplier: number) => `${designSystem.spacing.base * multiplier}px`;

export const getColor = (colorPath: string) => {
  const keys = colorPath.split('.');
  let result: any = designSystem.colors;
  for (const key of keys) {
    result = result[key];
  }
  return result;
};