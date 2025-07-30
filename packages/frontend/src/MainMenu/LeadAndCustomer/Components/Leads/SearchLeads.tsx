import { useEffect, useRef } from "react";
import debounce from "lodash/debounce";
import { LeadStatus } from "shared-types"; // יבוא סטטוסים 

interface SearchLeadsProps {
  term: string;
  setTerm: (term: string) => void;
  onSearch: (term: string, status?: string) => void; // 👈 נוסיף גם סטטוס
  status: string;//חדש
  setStatus: (status: string) => void;//חדש
}

export const SearchLeads = ({ term, setTerm, onSearch, status, setStatus }: SearchLeadsProps) => {//✔ הוספתי את status ו־setStatus גם בחתימת הפונקציה:
  const inputRef = useRef<HTMLInputElement | null>(null);

  const statusTranslations: Record<string, string> = {
  NEW: "חדש",
  CONTACTED: "נוצר קשר",
  INTERESTED: "מעוניין",
  SCHEDULED_TOUR: "נקבע סיור",
  PROPOSAL_SENT: "נשלחה הצעה",
  CONVERTED: "הומר ללקוח",
  NOT_INTERESTED: "לא מעוניין",
  LOST: "אבד"
};


  const leadStatuses = Object.values(LeadStatus);//כדי להציג את הסטטוסים בסלקט יש צורך להמיר
  const debouncedSearch = useRef(
    debounce((value: string, statusValue: string) => {
      onSearch(value, statusValue);
    }, 300)
  ).current;

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTerm(value);
    debouncedSearch(value, status);
  };
  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      debouncedSearch.cancel();
      onSearch(term, status);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
       console.log("סטטוס נבחר:", newStatus);
    setStatus(newStatus);
    debouncedSearch(term, newStatus);
  };
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-12 h-px bg-slate-300 mx-auto"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={term}
            onChange={handleChange}
            onKeyDown={handleEnter}
            placeholder="חפש לפי שם, טלפון או אימייל"
            className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 text-right placeholder-slate-400"
          />
        </div>
        
        {/* Status Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
          </div>
          <select 
            value={status} 
            onChange={handleStatusChange}
            className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 text-right bg-white appearance-none cursor-pointer"
          >
            <option value="">כל הסטטוסים</option>
            {leadStatuses.map((s) => (
              <option key={s} value={s}>
                {statusTranslations[s] || s}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Clear Filters Button */}
      {(term || status) && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => {
              setTerm('');
              setStatus('');
              onSearch('', '');
            }}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors duration-200 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            ניקוי פילטרים
          </button>
        </div>
      )}
    </div>
  );
};