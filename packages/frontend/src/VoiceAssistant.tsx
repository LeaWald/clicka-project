import { useState } from "react";
import { showAlert } from "./Common/Components/BaseComponents/ShowAlert";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const VoiceCommand = () => {
  const [listening, setListening] = useState(false);

  const handleListen = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = "he-IL";
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;

      console.log("הפקודה שהתקבלה:", transcript);
      handleCommand(transcript);
    };

    recognition.start();
  };

  return (
    <button
      onClick={handleListen}
      className={`fixed bottom-8 left-8 flex items-center justify-center w-16 h-16 rounded-full
        ${listening ? "bg-red-500 animate-pulse" : "bg-green-600 hover:bg-green-700"}
        text-white shadow-lg transition-colors duration-300`}
      title={listening ? "מאזין..." : "לחץ כדי לדבר"}
      aria-label="הפעל עוזרת קולית"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 1v11m0 0a3 3 0 0 0 3-3v-5a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm0 0v6m-4 0h8m-8 0a4 4 0 0 0 8 0"
        />
      </svg>
    </button>
  );
};

const handleCommand = (text: string) => {
  const lower = text.toLocaleLowerCase();

  const newCustomerKeywords = [
    "לקוח חדש",
    "הוספת לקוח",
    "פתיחת לקוח חדש",
    "תוסיפי לקוח",
    "תפתחי לקוח",
    "לפתוח לקוח",
    "הוסף לקוח",
    "הכנסת לקוח",
    "צור לקוח",
    "קליטה של לקוח",
    "אני רוצה להוסיף לקוח",
    "אני צריכה לקוח חדש",
    "פתחי כרטיס לקוח",
    "חדש לקוח",
  ];

  const customersListKeywords = [
    "לקוחות",
    "כל הלקוחות",
    "רשימת לקוחות",
    "תראי לי לקוחות",
    "אני רוצה לראות את הלקוחות",
    "תפתחי את דף הלקוחות",
    "דף לקוחות",
    "תציגי את הלקוחות",
    "כל כרטיסי הלקוחות",
    "הכרטיסים של הלקוחות",
    "כרטיסי לקוח",
    "לקוחות קיימים",
    "עיון בלקוחות",
  ];

  const newLead = [
    "מתעניין חדש",
    "הוספת מתעניין",
    "צור מתעניין",
    "פתחי מתעניין",
    "הוסף מתעניין",
    "אני רוצה להוסיף מתעניין",
    "קליטה של מתעניין",
    "לפתוח מתעניין",
    "הכנסת מתעניין",
  ];

  const leadsList = [
    "מתעניינים",
    "רשימת מתעניינים",
    "כל המתעניינים",
    "תראי לי מתעניינים",
    "אני רוצה לראות את המתעניינים",
    "דף מתעניינים",
    "עיון במתעניינים",
  ];

  const sourcesGraph = [
    "גרף מקורות",
    "מקורות",
    "תראי לי גרף מקורות",
    "גרף של המקורות",
    "ניתוח מקורות",
    "דוח מקורות",
    "גרף מקורות לקוחות",
  ];

  const contractList = [
    "חוזים",
    "רשימת חוזים",
    "כל החוזים",
    "תראי לי חוזים",
    "אני רוצה לראות את החוזים",
    "דף חוזים",
    "עיון בחוזים",
    "הסכמים",
  ];

  const history = [
    "היסטוריית לקוח",
    "היסטוריה של לקוח",
    "פעילות לקוח",
    "היסטוריה",
  ];

  const newVendorKeywords = [
    "ספק חדש",
    "הוספת ספק",
    "פתיחת ספק חדש",
    "תוסיפי ספק",
    "תפתחי ספק",
    "לפתוח ספק",
    "הוסף ספק",
    "הכנסת ספק",
    "צור ספק",
    "קליטה של ספק",
    "אני רוצה להוסיף ספק",
    "אני צריכה ספק חדש",
    "פתחי כרטיס ספק",
    "חדש ספק",
  ];

  const vendorsListKeywords = [
    "ספקים",
    "כל הספקים",
    "רשימת ספקים",
    "תראי לי ספקים",
    "אני רוצה לראות את הספקים",
    "תפתחי את דף הספקים",
    "דף ספקים",
    "תציגי את הספקים",
    "כל כרטיסי הספקים",
    "הכרטיסים של הספקים",
    "כרטיסי ספק",
    "ספקים קיימים",
    "עיון בספקים",
  ];

  const matches = (input: string, keywords: string[]) =>
    keywords.some((kw) => input.includes(kw));

  if (matches(lower, newCustomerKeywords)) {
    window.location.href = `${process.env.REACT_APP_GOOGLE_REDIRECT_URI}leadAndCustomer/customers/new`;
  } else if (matches(lower, customersListKeywords)) {
    window.location.href = `${process.env.REACT_APP_GOOGLE_REDIRECT_URI}leadAndCustomer/customers`;
  } else if (matches(lower, newLead)) {
    window.location.href = `${process.env.REACT_APP_GOOGLE_REDIRECT_URI}leadAndCustomer/leads/interestedCustomerRegistration`;
  } else if (matches(lower, leadsList)) {
    window.location.href = `${process.env.REACT_APP_GOOGLE_REDIRECT_URI}leadAndCustomer/leads`;
  } else if (matches(lower, contractList)) {
    window.location.href = `${process.env.REACT_APP_GOOGLE_REDIRECT_URI}leadAndCustomer/contracts`;
  } else if (matches(lower, sourcesGraph)) {
    window.location.href = `${process.env.REACT_APP_GOOGLE_REDIRECT_URI}leadAndCustomer/leads/LeadSourcesPieChart`;
  } else if (matches(lower, history)) {
    window.location.href = `${process.env.REACT_APP_GOOGLE_REDIRECT_URI}customerHistory`;
  } else if (matches(lower, newVendorKeywords)) {
    window.location.href = `${process.env.REACT_APP_GOOGLE_REDIRECT_URI}vendors/new`;
  } else if (matches(lower, vendorsListKeywords)) {
    window.location.href = `${process.env.REACT_APP_GOOGLE_REDIRECT_URI}vendor`;
  } else {
    showAlert("", "לא הבנתי את הפקודה... 😕 נסי שוב בבקשה", "warning");
  }
};
