// import React from 'react';
import { useNavigate } from 'react-router-dom';

const PricingHomePage = () => {
  // useNavigate מאפשר לנו לבצע ניווט בתוכנית (SPA) לתוך ראוטים שונים
  const navigate = useNavigate();

  return (
    <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded shadow">
      {/* כותרת ראשית */}
      <h1 className="text-2xl font-bold mb-8 text-center">ניהול תמחור</h1>

      {/* מקטע הכפתורים - עמודה עם ריווח בין הכפתורים */}
      <div className="flex flex-col gap-6">
        {/* כפתור לתמחור סביבת עבודה */}
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded text-lg font-semibold shadow"
          onClick={() => navigate('/pricing/workspace')} // ניווט לנתיב תמחור סביבת עבודה
        >
          תמחור סביבת עבודה
        </button>

        {/* כפתור לתמחור חדרי ישיבות */}
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded text-lg font-semibold shadow"
          onClick={() => navigate('/pricing/meeting-room')} // ניווט לנתיב תמחור חדרי ישיבות
        >
          תמחור חדרי ישיבות
        </button>

        {/* כפתור לתמחור לאונג' */}
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded text-lg font-semibold shadow"
          onClick={() => navigate('/pricing/lounge')} // ניווט לנתיב תמחור לאונג'
        >
          תמחור לאונג'
        </button>
      </div>
    </div>
  );
};

export default PricingHomePage;
