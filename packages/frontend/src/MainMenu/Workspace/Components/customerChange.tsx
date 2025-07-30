import React, { useEffect, useState } from 'react';
import { Button } from '../../../Common/Components/BaseComponents/Button';
import { useWorkSpaceStore } from '../../../Stores/Workspace/workspaceStore';
import { Space } from 'shared-types';
import { SpaceStatus } from 'shared-types';
import { useNavigate } from 'react-router-dom';

export const CustomerChange = () => {
  const [step, setStep] = useState<'question' | 'options' | 'selectRoom'>('question');
  const [mode, setMode] = useState<'swap' | 'move' | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const navigate = useNavigate();

  const { getAllWorkspace, updateWorkspace, workSpaces } = useWorkSpaceStore();

  useEffect(() => {
    if (step === 'selectRoom') {
      getAllWorkspace().then(() => {
        setSpaces(workSpaces.filter((s) => s));
      });
    }
  }, [step, getAllWorkspace, workSpaces]);

  const filteredSpaces = mode === 'swap'
    ? spaces.filter((s) => s.status === 'OCCUPIED'&& !!s.currentCustomerId)
    : spaces.filter((s) => s.status === 'AVAILABLE');

  const titleText = mode === 'swap'
    ? 'בחר חלל תפוס שמוכן להחלפה:'
    : 'בחר חלל זמין להקצאה:';

  const handleConfirm = async () => {
    if (!selectedRoomId) return;

    const selectedRoom = spaces.find((r) => r.id === selectedRoomId);
    if (!selectedRoom) return;

    try {
      if (mode === 'swap') {
        if (!selectedRoom.currentCustomerId) {
          setMessage('לא ניתן להחליף – החלל הנבחר אינו תפוס בפועל.');
          setMessageType('error');
          return;
        }

        await updateWorkspace({
          ...selectedRoom,
          status: SpaceStatus.OCCUPIED,
        }, selectedRoom.id!);

        setMessage(`ההחלפה בוצעה בהצלחה עם החדר: ${selectedRoom.name || selectedRoom.id}`);
        setMessageType('success');
      }

      else if (mode === 'move') {
        // נניח שאת מזהה את החדר הנוכחי לפי איזשהו חדר שתפוס
        const currentRoom = spaces.find((s) => s.status === SpaceStatus.OCCUPIED && s.currentCustomerId);
        if (!currentRoom) {
          setMessage('לא נמצא חדר נוכחי להעברה.');
          setMessageType('error');
          return;
        }

        // מחיקת ההקצאה הקודמת
        await updateWorkspace({
          ...currentRoom,
          currentCustomerId: '',
          currentCustomerName: '',
          status: SpaceStatus.AVAILABLE,
        }, currentRoom.id!);

        // הקצאה חדשה
        await updateWorkspace({
          ...selectedRoom,
          status: SpaceStatus.OCCUPIED,
        }, selectedRoom.id!);

        setMessage(`העברת הלקוח בוצעה לחדר: ${selectedRoom.name || selectedRoom.id}`);
        setMessageType('success');
      }

    } catch (error) {
      setMessage('אירעה שגיאה בעת ביצוע הפעולה.');
      setMessageType('error');
    }
  };

  const handleCancel = () => {
    setStep('question');
    setMode(null);
    setSelectedRoomId('');
    setMessage(null);
    setMessageType(null);
  };

  const handleSelectMode = (selectedMode: 'swap' | 'move') => {
    setMode(selectedMode);
    setStep('selectRoom');
    setSelectedRoomId('');
    setMessage(null);
    setMessageType(null);
  };

  return (
    <div className="p-4 rounded-md border border-gray-300 bg-white max-w-xl mx-auto">
      {message && (
        <div className={`p-2 mb-4 rounded text-sm ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      {step === 'question' && (
        <>
          <p className="text-lg font-semibold mb-4">
            החלל תפוס, אי אפשר להקצות אותו ללקוח נוסף.
            <br />
            האם אתה רוצה להעביר את הלקוח לחלל חדש?
          </p>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setStep('options')}>כן</Button>
            <Button variant="secondary" onClick={()=>{navigate(-1)}}>לא</Button>
          </div>
        </>
      )}

      {step === 'options' && (
        <>
          <p className="text-md font-semibold mb-2">בחר פעולה:</p>
          <div className="flex gap-4 mb-4">
            <Button onClick={() => handleSelectMode('swap')}>החלף עם לקוח אחר</Button>
            <Button onClick={() => handleSelectMode('move')}>הקצה חלל חדש פנוי</Button>
          </div>
          <Button variant="secondary" onClick={handleCancel}>ביטול</Button>
        </>
      )}

      {step === 'selectRoom' && (
        <>
          <p className="text-md font-semibold mb-2">{titleText}</p>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mb-4"
          >
            <option value="">בחר חלל</option>
            {filteredSpaces.map((space) => (space &&
              <option key={space.id} value={space.id}>
                {space.name || `חלל ${space.id}`}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={handleCancel}>ביטול</Button>
            <Button disabled={!selectedRoomId} onClick={handleConfirm}>אישור</Button>
          </div>
        </>
      )}
    </div>
  );
};