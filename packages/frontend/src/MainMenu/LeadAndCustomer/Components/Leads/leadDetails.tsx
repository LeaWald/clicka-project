import { Button } from "../../../../Common/Components/BaseComponents/Button";
import { useNavigate } from "react-router-dom";
import { Lead } from "shared-types";

// קומפוננטת בן – נפתחת בלחיצה
export const LeadDetails = ({ lead, onDelete }: { lead: Lead, onDelete: () => void }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-blue-50 mt-2 p-4 rounded-lg border border-blue-200">
      <div className="text-sm text-gray-700 mb-2">
        <div>טלפון: {lead.phone}</div>
        <div>אימייל: {lead.email}</div>
        <div>ת"ז: {lead.idNumber}</div>
        <div>תאריך יצירה: {new Date(lead.createdAt).toLocaleDateString()}</div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="accent"
          size="sm"
          onClick={() => alert("עדכון בעתיד")}
        >
          עדכון
        </Button>
        <Button
          variant="accent"
          size="sm"
          onClick={onDelete}
        >
          מחיקה
        </Button>
      </div>
    </div>
  );
};