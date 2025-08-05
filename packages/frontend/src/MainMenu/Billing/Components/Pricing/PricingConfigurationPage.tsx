import React, { useState } from 'react';
import { WorkspaceType } from 'shared-types';
import LoungePricingForm from './LoungePricingForm';
import MeetingRoomPricingForm from './MeetingRoomPricingForm';
import WorkspacePricingForm from './WorkspacePricingForm';

// רשימת סוגי סביבת עבודה כפי שמוגדרים ב-enum WorkspaceType
const workspaceTypes = [
  { value: WorkspaceType.PRIVATE_ROOM1, label: 'חדר פרטי 1' },
  { value: WorkspaceType.PRIVATE_ROOM2, label: 'חדר של 2' },
  { value: WorkspaceType.PRIVATE_ROOM3, label: 'חדר של 3' },
  { value: WorkspaceType.DESK_IN_ROOM, label: 'שולחן בחדר' },
  { value: WorkspaceType.OPEN_SPACE, label: 'אופן ספייס' },
  { value: WorkspaceType.KLIKAH_CARD, label: 'כרטיס קליקה' },

];

const PricingConfigurationPage = () => {
  // סטייט לניהול הטאב הנבחר - איזה סוג תמחור מוצג כעת
  const [tab, setTab] = useState<'lounge' | 'meeting' | 'workspace'>('lounge');

  // סטייט לניהול סוג סביבת עבודה שנבחר - רלוונטי רק לטאב workspace
  const [workspaceType, setWorkspaceType] = useState<WorkspaceType>(workspaceTypes[0].value);

  return (
    <div>
      {/* כפתורי הטאב לבחירת סוג תמחור */}
      <div className="flex space-x-2 mb-4 rtl:space-x-reverse">
        <button
          className={`px-4 py-2 rounded ${tab === 'lounge' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setTab('lounge')} // מעביר לטאב לאונג'
        >
          לאונג'
        </button>
        <button
          className={`px-4 py-2 rounded ${tab === 'meeting' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setTab('meeting')} // מעביר לטאב חדרי ישיבות
        >
          חדרי ישיבות
        </button>
        <button
          className={`px-4 py-2 rounded ${tab === 'workspace' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setTab('workspace')} // מעביר לטאב סביבת עבודה
        >
          סביבת עבודה
        </button>
      </div>

      {/* רק כשסביבת עבודה נבחרה - מציג בחירה לסוג סביבת עבודה */}
      {tab === 'workspace' && (
        <div className="mb-4 flex items-center gap-2">
          <label htmlFor="workspaceType" className="font-bold">סוג סביבת עבודה:</label>
          <select
            id="workspaceType"
            value={workspaceType}
            onChange={e => setWorkspaceType(e.target.value as WorkspaceType)} // מעדכן את סוג סביבת העבודה הנבחר
            className="border rounded px-2 py-1"
          >
            {/* יצירת אופציות לבחירה מתוך רשימת workspaceTypes */}
            {workspaceTypes.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* הצגת הפורם הרלוונטי לפי הטאב הנבחר */}
      <div>
        {tab === 'lounge' && <LoungePricingForm />}
        {tab === 'meeting' && <MeetingRoomPricingForm />}
        {tab === 'workspace' && <WorkspacePricingForm workspaceType={workspaceType} />}
      </div>
    </div>
  );
};

export default PricingConfigurationPage;