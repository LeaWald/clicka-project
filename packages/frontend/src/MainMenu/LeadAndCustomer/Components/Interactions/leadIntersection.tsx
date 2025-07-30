import { useEffect, useRef, useState } from "react";
import { useLeadsStore } from "../../../../Stores/LeadAndCustomer/leadsStore";
import { Lead } from "shared-types";
import { LeadInteractionDetails } from "./leadInteractionDetails";
import { SearchLeads } from "../Leads/SearchLeads";
import { Button } from "../../../../Common/Components/BaseComponents/Button";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import {
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Building2,
  Calendar,
  FileText,
  ScrollText,
} from "lucide-react";
import { ShowAlertWarn } from "../../../../Common/Components/BaseComponents/showAlertWarn";
import { showAlert } from "../../../../Common/Components/BaseComponents/ShowAlert";
type SortField = "name" | "status" | "createdAt" | "updatedAt" | "lastInteraction";
type AlertCriterion = "noRecentInteraction" | "statusIsNew" | "oldLead";
export const LeadInteractions = () => {
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [alertCriterion, setAlertCriterion] = useState<AlertCriterion>("noRecentInteraction");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const allLeadsRef = useRef<Lead[]>([]);
  const [status, setStatus] = useState("");//הוספה
  const navigate = useNavigate();
  const {
    leads,
    fetchLeads,
    handleDeleteLead,
    handleSelectLead,
    resetSelectedLead,
    selectedLead,
  } = useLeadsStore();
  const handleRegistration = (lead: Lead | undefined) => {
    if (lead) {
      navigate("interestedCustomerRegistration", { state: { data: lead } });
    }
  };
  useEffect(() => {
    fetchLeads().then(() => {
      allLeadsRef.current = useLeadsStore.getState().leads;
    });
  }, [page, fetchLeads]);
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 && !isSearching) {
        setPage((prev) => prev + 1);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isSearching]);

  const deleteCurrentLead = async (leadId: string) => {
    const confirmed = await ShowAlertWarn(
      "האם אתה בטוח שברצונך למחוק את המתעניין לצמיתות?",
      "לא ניתן לשחזר את המידע לאחר מחיקה.",
      "warning"
    );
    if (confirmed) {
      await handleDeleteLead(leadId);
      showAlert("מחיקה", "לקוח נמחק בהצלחה", "success");
      const latestError = useLeadsStore.getState().error;
      if (latestError) {
        const errorMessage = latestError || "שגיאה בלתי צפויה";
        console.error("Error:", errorMessage);
        showAlert("שגיאה במחיקת מתעניין", errorMessage, "error");
      }
    }
  };
  const handleSearch = (term: string, status: string = "") => {
    setSearchTerm(term);
    setStatus(status);
    setPage(1);
    // אין טקסט ואין סטטוס => החזר הכל
    if (!term.trim() && !status.trim()) {
      setIsSearching(false);
      useLeadsStore.setState({ leads: allLeadsRef.current });
      return;
    }
    // :white_check_mark: אם כל הלידים טעונים (לא פונים לשרת בכלל)
    if (allLeadsRef.current.length > 0) {
      const filtered = allLeadsRef.current.filter((l) => {
        const matchesTerm =
          !term.trim() ||
          l.name?.toLowerCase().includes(term.toLowerCase()) ||
          l.phone?.includes(term) ||
          l.email?.toLowerCase().includes(term.toLowerCase());
        const matchesStatus = !status.trim() ||
          l.status?.toLowerCase().trim() === status.toLowerCase().trim();
        return matchesTerm && matchesStatus;
      });
      setIsSearching(true);
      useLeadsStore.setState({ leads: filtered });
      return;
    }
    // :white_check_mark: אם אין את כל הלידים טעונים => fallback לשרת
    fetch(`${process.env.REACT_APP_API_URL}leads/search?q=${term}&status=${status}`)
      .then((res) => res.json())
      .then((data: Lead[]) => {
        setIsSearching(true);
        useLeadsStore.setState({ leads: data.length > 0 ? data : [] });
      })
      .catch((err) => {
        console.error("שגיאה בחיפוש מהשרת:", err);
        useLeadsStore.setState({ leads: [] });
      });
  };
  const isAlert = (lead: Lead): boolean => {
    switch (alertCriterion) {
      case "noRecentInteraction":
        const recentThreshold = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
        return !lead.interactions?.some((i) =>
          new Date(i.updatedAt || i.createdAt || i.date) >= recentThreshold
        );
      case "statusIsNew":
        return lead.status?.toLowerCase() === "new";
      case "oldLead":
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return new Date(lead.createdAt || 0) < sixMonthsAgo;
      default:
        return false;
    }
  };
  const getSortValue = (lead: Lead): string | number | Date => {
    switch (sortField) {
      case "name":
        return lead.name?.toLowerCase() || "";
      case "status":
        return lead.status?.toLowerCase() || "";
      case "createdAt":
        return new Date(lead.createdAt || 0);
      case "updatedAt":
        return new Date(lead.updatedAt || 0);
      case "lastInteraction":
        const dates = lead.interactions?.map((i) => new Date(i.updatedAt || i.createdAt)) || [];
        return dates.length > 0 ? Math.max(...dates.map((d) => d.getTime())) : 0;
      default:
        return "";
    }
  };
  const sortedLeads = [...leads].sort((a, b) => {
    const aVal = getSortValue(a);
    const bVal = getSortValue(b);
    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });
  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-center text-blue-600 mb-4">מתעניינים</h2>
      <SearchLeads
        term={searchTerm}
        setTerm={setSearchTerm}
        status={status}        // :white_check_mark: הוספה
        setStatus={setStatus}  // :white_check_mark: הוספה
        onSearch={handleSearch}
      />
      <div className="flex flex-wrap justify-center gap-4 mb-6 mt-4">
        <div className="flex flex-col items-start">
          <label className="mb-1 text-sm font-medium text-gray-700">מיין לפי:</label>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="border border-gray-300 rounded-xl bg-white px-4 py-2 pr-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          >
            <option value="name">שם</option>
            <option value="status">סטטוס</option>
            <option value="createdAt">תאריך יצירה</option>
            <option value="updatedAt">תאריך עדכון</option>
            <option value="lastInteraction">אינטראקציה אחרונה</option>
          </select>
        </div>
        <div className="flex flex-col items-start">
          <label className="mb-1 text-sm font-medium text-gray-700">כיוון מיון:</label>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl shadow transition"
          >
            {sortOrder === "asc" ? ":arrow_up: עולה" : ":arrow_down: יורד"}
            <span className="hidden sm:inline">
              ({sortOrder === "asc" ? "מהקטן לגדול" : "מהגדול לקטן"})
            </span>
          </button>
        </div>
        <div className="flex flex-col items-start">
          <label className="mb-1 text-sm font-medium text-gray-700">קריטריון התרעה:</label>
          <select
            value={alertCriterion}
            onChange={(e) => setAlertCriterion(e.target.value as AlertCriterion)}
            className="border border-gray-300 rounded-xl bg-white px-4 py-2 pr-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          >
            <option value="noRecentInteraction">אין אינטראקציה אחרונה</option>
            <option value="statusIsNew">סטטוס חדש</option>
            <option value="oldLead">ליד ישן (לפני 6 חודשים)</option>
          </select>
        </div>
        <Button
          onClick={() => navigate("newLead")}
          variant="primary"
          size="sm"
        >
          הוספת מתעניין חדש
        </Button>
        <Button
          onClick={() => navigate("/leadAndCustomer/leads/UploadLeadsFile")}
          variant="primary"
          size="sm"
        >
          יבוא לידים מקובץ אקסל
        </Button>
      </div>
      {sortedLeads.map((lead) => (
        <LeadCard
          key={lead.id}
          lead={lead}
          isSelected={selectedLead?.id === lead.id}
          isAlert={isAlert(lead)}
          onClick={() => {
            if (selectedLead?.id === lead.id) resetSelectedLead();
            else handleSelectLead(lead.id!);
          }}
          onDelete={() => deleteCurrentLead(lead.id!)}
          onRegister={() => handleRegistration(lead)}
          children={
            selectedLead?.id === lead.id && <LeadInteractionDetails />
          }
        />
      ))}
      <Button
        onClick={() => navigate("/leadAndCustomer/leads/LeadSourcesPieChart")}
        variant="primary"
        size="sm"
        style={{
          backgroundColor: "orange",
          color: "white",
          border: "none",
          borderRadius: "8px",
          padding: "10px 20px",
          fontSize: "1em",
          cursor: "pointer",
          display: "block",
          margin: "0 auto",
        }}
      >
        הצג את מקורות הלידים
      </Button>
    </div>
  );
};
// LeadCard Component (עיצוב בלבד)
const LeadCard = ({
  lead,
  isSelected,
  isAlert,
  onClick,
  onDelete,
  onRegister,
  children,
}: {
  lead: Lead;
  isSelected: boolean;
  isAlert: boolean;
  onClick: () => void;
  onDelete: () => void;
  onRegister: () => void;
  children?: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const initials = lead.name?.charAt(0).toUpperCase() || "?";
  return (
    <div
      className={`rounded-xl border shadow p-5 mb-4 bg-white transition-all duration-300 cursor-pointer ${isSelected ? "bg-blue-100 border-blue-300" : isAlert ? "border-red-500 bg-red-50" : ""
        }`}
      onClick={() => {
        setOpen(!open);
        onClick();
      }}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 flex items-center justify-center rounded-full font-bold bg-blue-200 text-blue-800">
            {initials}
          </div>
          <div className="text-xl font-bold text-gray-900">{lead.name}</div>
          <div className="text-sm text-gray-500">{lead.status}</div>
        </div>
        {open ? <ChevronUp /> : <ChevronDown />}
      </div>
      {open && (
        <div className="mt-4 space-y-2 text-sm text-gray-700">
          <div className="flex gap-2 items-center"><Phone size={16} /> {lead.phone}</div>
          <div className="flex gap-2 items-center"><Mail size={16} /> {lead.email}</div>
          <div className="flex gap-2 items-center"><Building2 size={16} /> מקור: {lead.source}</div>
          <div className="flex gap-2 items-center"><Calendar size={16} /> נוצר ב: {new Date(lead.createdAt || 0).toLocaleDateString()}</div>
          <div className="flex gap-2 items-center"><FileText size={16} /> סטטוס: {lead.status}</div>
          <div className="flex gap-2 items-center"><ScrollText size={16} /> מזהה: {lead.id}</div>
          <div className="flex gap-4 mt-2">
            <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); onRegister(); }}>
              לטופס רישום
            </Button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              <FontAwesomeIcon icon={faTrash} className="mr-1" />
              מחק
            </button>
          </div>
          {children}
        </div>
      )}
    </div>
  );
};
