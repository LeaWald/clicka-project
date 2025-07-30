// import React, { useEffect, useState } from "react";
// import { Button, ButtonProps } from '../../../../Common/Components/BaseComponents/Button';
// import { Table, TableColumn } from "../../../../Common/Components/BaseComponents/Table";
// import axios from "axios";
// import { Outlet, useNavigate } from "react-router-dom";
// import { Link, NavLink } from "react-router-dom";
// import { Lead, LeadSource, LeadStatus, Person } from "shared-types";
// import { SearchLeads } from "./searchLead";
// import { deleteLead } from "../../Service/LeadAndCustomersService";

// interface ValuesToTable {
//   id: string
//   name: string; // שם המתעניין
//   status: LeadStatus; // סטטוס המתעניין
//   phone: string; // פלאפון
//   email: string; // מייל
// }
// //צריך לעשות קריאת שרת לקבלת כל המתעניינים למשתנה הזה

import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "../../../../Common/Components/BaseComponents/Button";
import { SearchLeads } from "./SearchLeads";
import { Lead } from "shared-types";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { LeadsTable } from "./LeadsTable"; // 💡 ודאי שהשמות תואמים
// import { deleteLead } from "../../Service/LeadAndCustomersService";
import { deleteLead } from "../../Service/LeadAndCustomersService";

export const LeadsHomePage = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState(""); // סטטוס לחיפוש
  const [isSearching, setIsSearching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const allLeadsRef = useRef<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // שליפת לידים מדף מסוים
  const fetchLeads = async (page: number, limit: number = 50) => {
    try {
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/leads/by-page`, {
        params: { page, limit },
      });

      if (data.length < limit) setHasMore(false);

      setLeads((prev) => [...prev, ...data]);
      allLeadsRef.current = [...allLeadsRef.current, ...data];
      setIsLoading(false);
    } catch (error) {
      console.error("שגיאה בשליפת מתעניינים:", error);
    }
  };

  // טעינת לידים כשהעמוד משתנה ואנחנו לא בחיפוש
  useEffect(() => {
    if (!isSearching) fetchLeads(page);
  }, [page, isSearching]);

  // אינטרסקשן אובזרבר לטעינת דפים נוספים (אינסופיניט סקרול)
  useEffect(() => {
    if (!loaderRef.current || isSearching) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) setPage((p) => p + 1);
    });
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [isSearching, hasMore]);

  // פונקציית החיפוש עם לוגים
  const handleSearch = (term: string, searchStatus: string = "") => {
    console.log("handleSearch נקרא עם:", { term, searchStatus });
    console.log("לידים לפני סינון (allLeadsRef.current):", allLeadsRef.current);

    setSearchTerm(term);
    setStatus(searchStatus);

    // אם אין טקסט ואין סטטוס, מציגים את כל הלידים ללא סינון
    if (!term.trim() && !searchStatus) {
      console.log("אין טקסט ואין סטטוס — מחזירים את כל הלידים");
      setIsSearching(false);
      setLeads(allLeadsRef.current);
      return;
    }

    // סינון הלידים לפי טקסט וסטטוס
    const filtered = allLeadsRef.current.filter((l) => {
      console.log("התחלת סינון הלידים, כמות לידים:", allLeadsRef.current.length);

        const leadStatus = l.status?.toLowerCase().trim() || "";
  const searchStatus = status.toLowerCase().trim();
      // בדיקת טקסט - אם יש מונח חיפוש
      const textMatch = term
        ? l.name.toLowerCase().includes(term.toLowerCase()) ||
          l.phone.includes(term) ||
          l.email?.toLowerCase().includes(term.toLowerCase())
        : true;

      // בדיקת סטטוס - אם יש סטטוס לחיפוש
      const statusMatch = searchStatus
        ? l.status?.toLowerCase().trim() === searchStatus.toLowerCase().trim()
        : true;

      // לוג לבדיקה
      console.log(`בדיקה לליד id=${l.id}, status=${l.status}, textMatch=${textMatch}, statusMatch=${statusMatch}`);

      return textMatch && statusMatch;
    });

    console.log("לידים לאחר סינון:", filtered);

    if (filtered.length > 0) {
      setIsSearching(true);
      setLeads(filtered);
    } else {
      // חיפוש בשרת אם אין תוצאות בסינון מקומי
      axios
        .get(`${process.env.REACT_APP_API_URL}/leads/search`, {
          params: { q: term },
        })
        .then((res) => {
          setIsSearching(true);
          if (res.data.length > 0) {
            setLeads(res.data);
          } else {
            setLeads([]);
          }
        })
        .catch((err) => {
          console.error("שגיאה בחיפוש מהשרת:", err);
          setLeads([]);
        });
    }
  };

  const deleteCurrentLead = async (id: string) => {
    try {
      // await deleteLead(id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
      allLeadsRef.current = allLeadsRef.current.filter((l) => l.id !== id);
      alert("מתעניין נמחק בהצלחה");
    } catch (error) {
      console.error("שגיאה במחיקה:", error);
      alert("מחיקה נכשלה");
    }
  };

  return (
    <>
      {isLoading ? (
        <h2 className="text-3xl font-bold text-center text-blue-600 my-4">
          טוען...
        </h2>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extralight text-slate-900 mb-4 tracking-wide">מתעניינים</h2>
              <div className="w-24 h-px bg-slate-300 mx-auto mb-8"></div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-8 justify-center">
              <button 
                onClick={() => navigate("newLead")}
                className="group flex items-center gap-3 px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                הוספת מתעניין חדש
              </button>
              
              <button 
                onClick={() => navigate("intersections")}
                className="group flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                אינטראקציות
              </button>
              
              <button 
                onClick={() => navigate("LeadSourcesPieChart")}
                className="group flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                גרף מקורות
              </button>
            </div>

            {/* Search Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
              <SearchLeads
                term={searchTerm}
                setTerm={setSearchTerm}
                status={status}
                setStatus={setStatus}
                onSearch={handleSearch}
              />
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <LeadsTable leads={leads} onDelete={deleteCurrentLead} />
            </div>
            
            <div ref={loaderRef} className="h-4 mt-8" />
          </div>
        </div>
      )}
    </>
  );
};
