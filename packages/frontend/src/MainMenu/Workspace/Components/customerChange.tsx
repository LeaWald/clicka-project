import  { useState } from 'react';
import { Button } from '../../../Common/Components/BaseComponents/Button';
import { useWorkSpaceStore } from '../../../Stores/Workspace/workspaceStore';
import { useAssignmentStore } from '../../../Stores/Workspace/assigmentStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { SpaceAssign } from 'shared-types/spaceAssignment';

export enum AssignmentStatus {
  ACTIVE = "ACTIVE",
  ENDED = "ENDED",
  SUSPENDED = "SUSPENDED",
  INACTIVE = "INACTIVE"
}


export const CustomerChange = () => {

  const [step, setStep] = useState<'question' | 'options' | 'selectRoom' | 'swap' | 'move'>('question');
  const [mode, setMode] = useState<'swap' | 'move' | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const { getAssignments, assignments, deleteAssignment, createAssignment } = useAssignmentStore();
  const { getAllWorkspace, workSpaces } = useWorkSpaceStore();

  const location = useLocation();
  const state = location.state || {};

  const customerId = state.customerId;
  const workspaceId = state.workspaceId;
  const displayDate = state.displayDate;

  interface nameAndId {
    name: string,
    id: string
  }

  let theCustomerAssignment: SpaceAssign[];
  let workspacesNameAndId: nameAndId[] = [];
  let assignmentIds: string[] = [];


  const navigate = useNavigate();
  const handleCancelchange = () => {
    navigate(-1);
  };
  const titleText = mode === 'swap'
    ? 'בחר חלל תפוס שמוכן להחלפה:'
    : 'בחר חלל זמין להקצאה:';


  const handleConfirm = ()=>{

    const newAssignment: SpaceAssign = {
      id: '',
      workspaceId: selectedRoomId,
      customerId: customerId,
      assignedDate: theCustomerAssignment[0].assignedDate,
      unassignedDate: theCustomerAssignment[0].unassignedDate,
      daysOfWeek: theCustomerAssignment[0].daysOfWeek,
      hours: theCustomerAssignment[0].hours,
      notes: theCustomerAssignment[0].notes,
      assignedBy: theCustomerAssignment[0].assignedBy,
      status: AssignmentStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    deleteAssignment(theCustomerAssignment[0].id || '');
    createAssignment(newAssignment);
    setStep('options');
}

    const handleCancel = () => {
      setMode(null);
      setSelectedRoomId('');
      setMessage(null);
      setMessageType(null);
    };

    // const handleSelectMode = (selectedMode: 'swap' | 'move') => {
    //   setMode(selectedMode);
    //   setStep('selectRoom');
    //   setSelectedRoomId('');
    //   setMessage(null);
    //   setMessageType(null);
    // };


    const chooseSpaces = () => {
  getAllWorkspace();
  getAssignments();

  theCustomerAssignment = assignments.filter(
    (s) =>
      s.workspaceId === workspaceId &&
      s.customerId === customerId &&
      s.assignedDate === displayDate
  );

  if (!theCustomerAssignment.length) {
    setMessage("לא נמצאה הקצאה תואמת ללקוח הזה בתאריך הזה.");
    setMessageType("error");
    return;
  }

  const baseAssignment = theCustomerAssignment[0];

  let assignmentInDate = assignments.filter(
    (s) => s.assignedDate > baseAssignment.assignedDate
  );

  assignmentInDate.forEach((a) => {
    assignmentIds.push(a.workspaceId);
  });

  workSpaces.forEach((w) => {
    if (
      !assignmentIds.includes(w.id || "") &&
      !["WALL", "DOOR_PASS", "RECEPTION_DESK", "BASE"].includes(w.name || "")
    ) {
      const ni: nameAndId = { name: w.name || "", id: w.id || "" };
      workspacesNameAndId.push(ni);
    }
  });
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
            <div className="button-group">
              <Button onClick={() => { chooseSpaces(); getAssignments(); }}>כן</Button>
              <Button variant="secondary" onClick={handleCancelchange}>לא</Button>
            </div>

          </>

        )}

        {step === 'options' && (

          <>
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
              {workspacesNameAndId.map((space) => (
                <option key={space.id} value={space.name}>
                  {space.name}
                </option>
              ))}
            </select>
            <div className="button-group">
              <Button variant="secondary" onClick={handleCancel}>ביטול</Button>
              <Button disabled={!selectedRoomId} onClick={handleConfirm}>אישור</Button>
            </div>

          </>
        )}
      </div>
    );
  };