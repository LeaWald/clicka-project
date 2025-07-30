// מייבא טיפוסים מ־Storybook לגרסה שעובדת עם Webpack 5
import { Meta, StoryObj } from '@storybook/react-webpack5';

// מייבא את קומפוננטת תיבת הסימון
import { CheckboxField } from './CheckBox';

// מייבא את הפונקציות של React Hook Form – לניהול טפסים
import { useForm, FormProvider } from 'react-hook-form';

// מגדיר את המטא־דאטה של הסיפור: הכותרת לעץ ה־Storybook, הרכיב, תגים
const meta: Meta<typeof CheckboxField> = {
  // המיקום/שם הקטגוריה שבו יופיע הסיפור ב־Storybook
  title: 'BaseComponents/CheckBox',

  // הקומפוננטה שיוצג עליה הסיפור
  component: CheckboxField,

  // תגים שעוזרים ל־Storybook להבין איך ליצור תיעוד אוטומטי
  tags: ['autodocs'],
};

// ייצוא ברירת מחדל – כך Storybook יזהה את ההגדרות של הקובץ הזה
export default meta;

// מגדיר טיפוס כללי לכל הסיפורים שמבוססים על המטא־דאטה הזה
type Story = StoryObj<typeof meta>;

// הסיפור הראשון – מציג את הקומפוננטה כפי שהיא אמורה להיראות בשימוש רגיל
// export const Default: Story = {
  // פרופס שמועברים לקומפוננטה – כאן ניתן להדגים כיצד היא מתנהגת במצבים שונים
  // args: {
  //   name: 'example',         // שם השדה – חשוב כדי ש־react-hook-form יזהה אותו
  //   label: 'Test Checkbox',  // תווית שתופיע ליד תיבת הסימון
  //   required: true,          // מציין שזה שדה חובה בטופס
  // },

  // פונקציית render – מאפשרת לעטוף את הקומפוננטה ב־FormProvider
  // render: (args) => {
    // יוצר מופע של useForm – ניהול הטופס
    // const methods = useForm();

    // return (
      // עוטף את הקומפוננטה ב־FormProvider כדי לאפשר לה גישה להקשר של הטופס
      // <FormProvider {...methods}>
        {/* <CheckboxField {...args} /> */}
      // </FormProvider>
    // );
  // },
// };