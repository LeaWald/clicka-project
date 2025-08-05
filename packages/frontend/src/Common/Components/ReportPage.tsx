import React, { useRef, useState } from 'react';
import { ChartDisplay, ChartData } from '../Components/BaseComponents/Graph';
import { Button } from '../Components/BaseComponents/Button';

export const ReportPage = () => {
const chartRef = useRef<HTMLDivElement>(null);//עושים רפרנס לדיו שאחרי זה יעזור לי לייצא לPDF 
  
  const initialData: ChartData[] = [
    { label: 'Group A', value: 100 },
    { label: 'Group B', value: 150 },
    { label: 'Group C', value: 80 },
  ];
  //אלו הדברים הראשונים שרואים אותם בטעינת הקומםוננטה. הנתונים הראשונים שאח"כ מתי 
  //dynamicDrillDataשלוחצים עלים עובר לנו ל

  // האובייקטים האולו לא מחייבים שיהיו כך. אפשר להביא מה שכל אחד צריך מהAPI 
  const dynamicDrillData: Record<string, ChartData[]> = {
    'Group A': [
      { label: 'Element A1', value: 40 },
      //Label: השם של הקבוצנ 
      //value: יכול להיות גגם שמייצג מספר 
      { label: 'Element A2', value: 60 },
    ],
    //אם אני לוחצת על הGROUP A אז מראה לי את A1-A2 
    'Group B': [
      { label: 'Element B1', value: 90 },
      { label: 'Element B2', value: 60 },
    ],
    // IMPORTANT: חייב להיות שיהיה נתונים לאחרי הלחיצה שך הCHARTDATA אם לא הDRILL לא יעבוד 
  };

  // ✅ Estados
  const [data, setData] = useState<ChartData[]>(initialData);
  //מאחסן מה שהולכים לראות בגרף GROUP A או GROUP B 
  const [isDrillDown, setIsDrillDown] = useState(false);
  //אם אנחנו רואים את הנתונים עושה TRUE אם לא עושה FALSE 
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  // שומר פה איזה קבוצה נבחרה ונשמרה 

  // מסדר את הלחיצה בגרפים 
  const handleBarClick = (event: any) => {
    const label = event?.activeLabel;
    // שם של מה שלחצנו 
    if (!label) return;

    const detailData = dynamicDrillData[label];
    if (detailData) {
      setData(detailData);
      setSelectedLabel(label);
      setIsDrillDown(true);
    } else {
      alert(`There are not data to  "${label}"`);
    }
    //אם יש תנונים למה שבחרתי אז הור מביא לי אותם ואם אין את הנתונים אז קופץ לי ALERT 
  };

  const goBack = () => {
    setData(initialData);
    setIsDrillDown(false);
    setSelectedLabel(null);
  };
  //חוזר לגרך ההתחלתי 

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        {isDrillDown ? `Details of "${selectedLabel}"` : 'General Report'}
      </h1>

      {/* מה שיש בתוך הגרף*/}
      <div
        ref={chartRef}
        role="img"
        aria-label={isDrillDown ? `Graph details ${selectedLabel}` : 'Graph Report'}
        className="bg-white mt-4 p-4 shadow rounded"
      >
        <ChartDisplay
          type="bar"
          data={data}
          rtl={false}
        />
      </div>

      {/* Instruction and Bach Button */}
      {!isDrillDown && (
        <p className="text-sm text-gray-500 mt-2">
         Click on a bar to see details
        </p>
      )}
      {isDrillDown && (
        <Button
          onClick={goBack}
          className="mt-4 bg-gray-600 text-white px-4 py-2 rounded"
        >
          ← Back to summary
        </Button>
      )}
    </div>
  );
};