# 📚 Storybook - Clicka Component Library

ברוכים הבאים לספריית הרכיבים של מערכת Clicka!
מטרת Storybook היא לאפשר לכל צוות (Core & Integration, Lead & Customer, Workspace, Billing) לפתח, לבדוק ולשתף רכיבי UI אחידים, רספונסיביים ותומכי עברית (RTL).

---

## 📦 התקנה והפעלה

התקן את כל התלויות:
```
yarn install
```

frontendהרץ ב:
```
yarn storybook
```

Storybook ירוץ בברירת מחדל בכתובת: `http://localhost:6006/`

---

## 📁 מבנה הפרויקט

storybook/
├── .storybook/
│   ├── main.ts         # קונפיגורציה כללית של Storybook
│   ├── preview.ts      # הגדרות גלובאליות - עיצוב, כיווניות, Theme
│
├── src/
│   ├── stories/        # סיפורים לדוגמה

---

## 🧩 הוספת Story חדש

1. צור קובץ `*.stories.tsx` לצד הרכיב שלך:

```tsx
// src/components/Button/Button.stories.tsx
import { Button } from './Button';

export default {
  title: 'Components/Button',
  component: Button,
};

export const Primary = () => <Button>התחברות</Button>;
```

2. ודא שיש עיצוב RTL:

```tsx
<Html dir="rtl">
```

---

## 🌐 תכונות כלליות

* **RTL מלא** – כל רכיב תומך בכיווניות RTL.
* **תמיכה בעברית** – כל רכיב מוצג ומעוצב בצורה נכונה לעברית.
* **Tailwind CSS** – רכיבים מעוצבים עם Tailwind, כולל תמיכה ב-RGB ו-RTL.
* **React 18 + TS** – כל הרכיבים נתמכים ב-React 18 עם TypeScript.
* **Zustand (state)** – כל רכיב יכול לשלב מצב עם Zustand אם יש צורך.
* **תיעוד אינטראקטיבי** – כל רכיב תועד בצורה אינטראקטיבית ב-Storybook.
* **גישה משותפת לכל הצוותים** – כל רכיב זמין לכל הצוותים בפרויקט.

---

## 🧪 בדיקות ואינטגרציה

Storybook משמש כבסיס גם לבדיקות ויזואליות.

---

## 🧠 טיפים לצוותים

* כל Story חייב לתמוך ב־RTL ולכלול דוגמה בעברית.
* כל רכיב חייב לעבור Accessibility בסיסי (כפתור נגיש, aria-label וכו’).

---

## ✍ תרומות

לפני פתיחת Pull Request:

* ודאו שהרכיב תומך ב־RTL
* כתבו לפחות 2 Stories (ברירת מחדל + גרסה נוספת)
* השתמשו ב־Types ברורים
* הוסיפו תיעוד בעברית

---
