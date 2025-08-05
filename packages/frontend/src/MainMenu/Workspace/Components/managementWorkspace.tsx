import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useWorkSpaceStore } from "../../../Stores/Workspace/workspaceStore";
import { Space, SpaceStatus, WorkspaceType } from "shared-types";
import { Table as StyledTable, TableColumn } from "../../../Common/Components/BaseComponents/Table";
import { Button } from "../../../Common/Components/BaseComponents/Button";
import { Modal } from "../../../Common/Components/BaseComponents/Modal";
import { InputField } from "../../../Common/Components/BaseComponents/Input";
import { SelectField } from "../../../Common/Components/BaseComponents/Select";
import { showAlert } from "../../../Common/Components/BaseComponents/ShowAlert";
export const ManagementWorkspace = () => {
  const { workSpaces, maps, getAllWorkspace, createWorkspace, updateWorkspace, deleteWorkspace, getAllWorkspaceMap } = useWorkSpaceStore();
  const [open, setOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const methods = useForm<Space>({
    defaultValues: {
      name: '',
      description: '',
      type: WorkspaceType.PRIVATE_ROOM1,
      status: SpaceStatus.AVAILABLE,
      positionX: 0,
      positionY: 0,
      width: 0,
      height: 0,
      workspaceMapId: '',
      location: '',
    }
  });
  useEffect(() => {
    getAllWorkspace();
    getAllWorkspaceMap();
  }, [getAllWorkspace, getAllWorkspaceMap]);
  const handleAddSpace = () => {
    setEditingSpace(null);
    methods.reset({
      name: '',
      description: '',
      type: WorkspaceType.PRIVATE_ROOM1,
      status: SpaceStatus.AVAILABLE,
      positionX: 0,
      positionY: 0,
      width: 0,
      height: 0,
      workspaceMapId: '',
      location: '',
    });
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setEditingSpace(null);
    methods.reset();
  };
  const handleSave = async (data: Space) => {
    if (!data.workspaceMapId) {
      await showAlert({
        title: 'שגיאה!',
        text: 'יש לבחור מפה לחלל!',
        icon: 'error',
      });
      return;
    }
    try {
      const formatDate = (date: Date) => {
        return date.toLocaleString("he-IL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).replace(",", "");
      };
      const spaceWithDates = {
        ...data,
        updatedAt: formatDate(new Date()),
      };
      if (editingSpace?.id) {
        await updateWorkspace(spaceWithDates, editingSpace.id);
      } else {
        const newSpaceData = {
          ...spaceWithDates,
          createdAt: formatDate(new Date()),
        };
        await createWorkspace(newSpaceData);
      }
      setOpen(false);
      await showAlert({
        title: 'הצלחה!',
        text: editingSpace ? 'החלל עודכן בהצלחה' : 'החלל נוצר בהצלחה',
        icon: 'success',
      });
    } catch (error) {
      console.error("Error saving space:", error);
      await showAlert({
        title: 'שגיאה!',
        text: 'אירעה שגיאה בשמירת החלל',
        icon: 'error',
      });
    }
  };
  const handleEdit = (workspace: Space) => {
    setEditingSpace(workspace);
    methods.reset({
      ...workspace,
      workspaceMapId: workspace.workspaceMapId || '',
    });
    setOpen(true);
  };
  const handleDelete = async (workspace: Space) => {
    const result = await showAlert({
      title: '',
      text: `האם אתה בטוח שברצונך למחוק את החלל "${workspace.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'מחק',
      cancelButtonText: 'ביטול',
      reverseButtons: false,
    });
    if (result.isConfirmed) {
      try {
        await deleteWorkspace(workspace.id || "");
        await showAlert({
          title: 'נמחק בהצלחה!',
          text: 'החלל נמחק מהמערכת',
          icon: 'success',
        });
      } catch (error) {
        await showAlert({
          title: 'שגיאה!',
          text: 'אירעה שגיאה במחיקת החלל',
          icon: 'error',
        });
      }
    }
  };
  const columns: TableColumn<Space & { mapName?: string; locationName?: string }>[] = [
    { header: 'שם חלל', accessor: 'name' },
    { header: 'סוג', accessor: 'type' },
    { header: 'סטטוס', accessor: 'status' },
    { header: 'מיקום X', accessor: 'positionX' },
    { header: 'מיקום Y', accessor: 'positionY' },
    { header: 'רוחב', accessor: 'width' },
    { header: 'אורך', accessor: 'height' },
    { header: 'תיאור', accessor: 'description' },
    { header: 'קוד לקוח', accessor: 'currentCustomerId' },
    { header: 'שם לקוח', accessor: 'currentCustomerName' },
    { header: 'שם המפה', accessor: 'mapName' },
    { header: 'מיקום העמדה', accessor: 'locationName' },
    { header: 'נוצר ב', accessor: 'createdAt' },
    { header: 'עודכן ב', accessor: 'updatedAt' },
  ];
  const enrichedWorkspaces = workSpaces.map((space) => {
    const map = maps.find((m) => String(m.id) === String(space.workspaceMapId));
    const locationSpace = workSpaces.find((s) => String(s.id) === String(space.location));
    return {
      ...space,
      mapName: map ? map.name : '*************',
      locationName: locationSpace ? locationSpace.name : 'לא הוגדר',
    };
  });
  // אפשרויות לרכיבי הבחירה
  const mapOptions = maps.map(map => ({
    value: map.id,
    label: map.name
  }));
  const typeOptions = Object.values(WorkspaceType).map(type => ({
    value: type,
    label: type
  }));
  const statusOptions = Object.values(SpaceStatus).map(status => ({
    value: status,
    label: status
  }));
  const locationOptions = workSpaces
    .filter(space =>
      space.type === WorkspaceType.OPEN_SPACE ||
      space.type === WorkspaceType.PRIVATE_ROOM1
    )
    .map(space => ({
      value: space.id || '',
      label: space.name
    }));
  // ווטש על שינויים בסוג החלל כדי להציג/להסתיר שדה מיקום
  const watchedType = methods.watch('type');
  return (
    <div style={{ padding: "20px" }}>
      <h1>ניהול חללים</h1>
      <div style={{ marginBottom: "20px" }}>
        <Button variant="primary" onClick={handleAddSpace}>
          הוספת חלל חדש
        </Button>
      </div>
      {/* <h2>רשימת החללים:</h2> */}
      {workSpaces.length === 0 ? (
        <p>אין חללים להצגה.</p>
      ) : (
        <StyledTable<Space & { mapName?: string; locationName?: string }>
          columns={columns}
          data={enrichedWorkspaces}
          onUpdate={handleEdit}
          onDelete={handleDelete}
          className="shadow-lg"
        />
      )}
      <Modal
        open={open}
        onClose={handleClose}
        title={editingSpace ? "עריכת חלל" : "הוספת חלל חדש"}
      >
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(handleSave)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                name="name"
                label="שם חלל"
                required
                placeholder="הכנס שם החלל"
              />
              <SelectField
                name="type"
                label="סוג חלל"
                options={typeOptions}
                required
              />
              <SelectField
                name="status"
                label="סטטוס"
                options={statusOptions}
                required
              />
              <SelectField
                name="workspaceMapId"
                label="בחר מפה"
                options={mapOptions}
                required
              />
            </div>
            <InputField
              name="description"
              label="תיאור"
              placeholder="תיאור החלל (אופציונלי)"
            />
            {/* מיקום העמדה - רק לסוגים מתאימים */}
            {(watchedType === WorkspaceType.DESK_IN_ROOM || watchedType === WorkspaceType.COMPUTER_STAND) && (
              <SelectField
                name="location"
                label="מיקום העמדה"
                options={locationOptions}
              />
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InputField
                name="positionX"
                label="מיקום X"
                type="number"
                defaultValue={0}
              />
              <InputField
                name="positionY"
                label="מיקום Y"
                type="number"
                defaultValue={0}
              />
              <InputField
                name="width"
                label="רוחב"
                type="number"
                required
                defaultValue={0}
              />
              <InputField
                name="height"
                label="אורך"
                type="number"
                required
                defaultValue={0}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={handleClose}>
                ביטול
              </Button>
              <Button type="submit" variant="primary">
                שמור
              </Button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};