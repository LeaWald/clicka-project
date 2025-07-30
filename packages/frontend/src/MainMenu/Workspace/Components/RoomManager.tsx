import React, { useEffect, useState } from "react";
import {
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormHelperText,
  Box,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useRoomStore } from "../../../Stores/Workspace/roomStore";
import { Button } from "../../../Common/Components/BaseComponents/Button";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { showAlert } from "../../../Common/Components/BaseComponents/ShowAlert";
import Swal from "sweetalert2";
import { RoomStatus, RoomType } from "shared-types";
import { Room } from "shared-types/booking";
import { RoomModel } from "../../../../../backend/src/models/room.model";

type RoomForm = {
  name: string;
  type: RoomType;
  description: string;
  capacity: number;
  hourlyRate: number;
  discountedHourlyRate: number;
  status: RoomStatus;
  equipment: string;
  features: string;
  minimumBookingMinutes: number;
  maximumBookingMinutes: number;
  FreeHoursForKlikcaCard: number;
  RequiredApproval: boolean;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  workspaceMapId: string;
};

export function RoomManager() {
  const {
    rooms,
    maps,
    getAllRooms,
    getAllMaps,
    createRoom,
    updateRoom,
    deleteRoom,
  } = useRoomStore();

  const methods = useForm<RoomForm>({
    defaultValues: {
      name: "",
      type: RoomType.MEETING_ROOM,
      description: "",
      capacity: 1,
      hourlyRate: 0,
      discountedHourlyRate: 0,
      status: RoomStatus.AVAILABLE,
      equipment: "",
      features: "",
      minimumBookingMinutes: 30,
      maximumBookingMinutes: 120,
      FreeHoursForKlikcaCard: 0,
      RequiredApproval: false,
      positionX: 0,
      positionY: 0,
      width: 0,
      height: 0,
      workspaceMapId: "",
    },
  });

  const {
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { errors },
  } = methods;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  useEffect(() => {
    getAllRooms();
    getAllMaps();
  }, [getAllRooms, getAllMaps]);

  const onSubmit = async (data: RoomForm) => {
    const roomData: Partial<RoomModel> = {
      name: data.name,
      type: data.type,
      description: data.description,
      status: data.status,
      capacity: data.capacity,
      hourlyRate: data.hourlyRate,
      discountedHourlyRate: data.discountedHourlyRate,
      MinimumBookingMinutes: data.minimumBookingMinutes,
      MaximumBookingMinutes: data.maximumBookingMinutes,
      RequiredApproval: data.RequiredApproval,
      workspaceMapId: data.workspaceMapId,
      equipment: data.equipment.split(",").map((e) => e.trim()).filter(Boolean),
      features: data.features.split(",").map((f) => f.trim()).filter(Boolean),
      FreeHoursForKlikcaCard: data.FreeHoursForKlikcaCard,
      positionX: data.positionX,
      positionY: data.positionY,
      width: data.width,
      height: data.height,
    };

    try {
      if (editingId) {
        await updateRoom(editingId, roomData);
        showAlert("", "החדר עודכן בהצלחה", "success");
      } else {
        await createRoom(roomData);
        showAlert("", "החדר נוצר בהצלחה", "success");
      }
      reset();
      setEditingId(null);
      setIsFormVisible(false);
      getAllRooms();
    } catch (e: any) {
      const msg = e?.response?.data?.message || "שגיאה כללית בבקשה";
      showAlert("שגיאה", msg, "error");
    }
  };

  const handleEdit = (room: Room) => {
    reset({
      name: room.name,
      description: room.description ?? "",
      type: room.type,
      status: room.status,
      capacity: room.capacity,
      hourlyRate: room.hourlyRate ?? 0,
      discountedHourlyRate: room.discountedHourlyRate ?? 0,
      equipment: (room.equipment ?? []).join(", "),
      features: (room.features ?? []).join(", "),
      FreeHoursForKlikcaCard: room.FreeHoursForKlikcaCard ?? 0,
      RequiredApproval: room.RequiredApproval ?? false,
      positionX: room.positionX ?? 0,
      positionY: room.positionY ?? 0,
      width: room.width ?? 0,
      height: room.height ?? 0,
      minimumBookingMinutes: room.MinimumBookingMinutes ?? 30,
      maximumBookingMinutes: room.MaximumBookingMinutes ?? 120,
      workspaceMapId: room.workspaceMapId ?? "",
    });
    setEditingId(room.id ?? null);
    setIsFormVisible(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      text: "בטוח שברצונך למחוק את החדר?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085D6",
      confirmButtonText: "מחק",
      cancelButtonText: "ביטול",
    });
    if (result.isConfirmed) {
      await deleteRoom(id);
      showAlert("", "החדר נמחק", "success");
      getAllRooms();
    }
  };

  const handleAdd = () => {
    reset();
    setEditingId(null);
    setIsFormVisible(true);
  };

  const filteredRooms = rooms.filter((r) => r && r.name);

  return (
    <div style={{ padding: 20, maxWidth: "100%", margin: "auto", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <h1 style={{ textAlign: "center", marginBottom: 24 }}>ניהול חדרים</h1>

      {!isFormVisible ? (
        <>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <Button variant="primary" onClick={handleAdd}>הוסף חדר</Button>
          </div>
          <div style={{ flexGrow: 1, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", boxShadow: "0 0 8px rgba(0,0,0,0.1)", borderRadius: 8, overflow: "hidden" }}>
              <thead style={{ backgroundColor: "#f3f4f6", textAlign: "right", position: "sticky", top: 0, zIndex: 2 }}>
                <tr>
                  <th style={{ padding: 12, borderBottom: "1px solid #ddd" }}>שם</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #ddd" }}>סוג חדר</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #ddd" }}>סטטוס</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #ddd" }}>קיבולת</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #ddd" }}>מחיר לשעה</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #ddd" }}>מחיר מוזל</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #ddd" }}>ציוד</th>
                  {/* <th style={{ padding: 12, borderBottom: "1px solid #ddd" }}>מאפיינים</th> */}
                  <th style={{ padding: 12, borderBottom: "1px solid #ddd" }}>מינימום זמן הזמנה (בדקות)</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #ddd" }}>מקסימום זמן הזמנה (בדקות)</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #ddd" }}>נדרש אישור</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #ddd" }}>מיקום X</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #ddd" }}>מיקום Y</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #ddd" }}>רוחב</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #ddd" }}>גובה</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #ddd" }}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.length > 0 ? (
                  filteredRooms.map((room) => (
                    <tr
                      key={room.id}
                      style={{
                        backgroundColor: "#fff",
                        borderBottom: "1px solid #eee",
                        textAlign: "right",
                      }}
                    >
                      <td style={{ padding: 10 }}>{room.name}</td>
                      <td style={{ padding: 10 }}>{room.type}</td>
                      <td style={{ padding: 10 }}>{room.status}</td>
                      <td style={{ padding: 10 }}>{room.capacity}</td>
                      <td style={{ padding: 10 }}>{room.hourlyRate} ש"ח</td>
                      <td style={{ padding: 10 }}>{room.discountedHourlyRate} ש"ח</td>
                      <td style={{ padding: 10 }}>
                        {(room.equipment ?? []).join(", ")}
                      </td>
                      {/* <td style={{ padding: 10 }}>
                        {(room.features ?? []).join(", ")}
                      </td> */}
                      <td style={{ padding: 10 }}>{room.MinimumBookingMinutes}</td>
                      <td style={{ padding: 10 }}>{room.MaximumBookingMinutes}</td>
                      <td style={{ padding: 10 }}>
                        {room.RequiredApproval ? "כן" : "לא"}
                      </td>
                      <td style={{ padding: 10 }}>{room.positionX}</td>
                      <td style={{ padding: 10 }}>{room.positionY}</td>
                      <td style={{ padding: 10 }}>{room.width}</td>
                      <td style={{ padding: 10 }}>{room.height}</td>
                      <td
                        style={{
                          padding: 10,
                          display: "flex",
                          gap: 8,
                          justifyContent: "center",
                        }}
                      >
                        <Button
                          size="sm"
                          onClick={() => handleEdit(room)}
                          style={{
                            backgroundColor: "#F5A623",
                            color: "#fff",
                            minWidth: 40,
                            padding: "4px 6px",
                            borderRadius: 6,
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDelete(room.id ?? "")}
                          style={{
                            backgroundColor: "#5A6B80",
                            color: "#fff",
                            minWidth: 40,
                            padding: "4px 6px",
                            borderRadius: 6,
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={19} style={{ padding: 20, textAlign: "center" }}>
                      אין חדרים להצגה
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 600, mx: "auto", p: 2, border: "1px solid #ccc", borderRadius: 2 }} noValidate>
          <h2 style={{ textAlign: "center", marginBottom: 24 }}>
            {editingId ? "עריכת חדר" : "הוספת חדר חדש"}
          </h2>
          <FormProvider {...methods}>
            <TextField
              label="שם חדר"
              fullWidth margin="normal"
              {...methods.register("name", {
                required: "שדה חובה",
                maxLength: { value: 15, message: "מקסימום 15 תווים" },
              })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />

            <TextField
              label="תיאור"
              fullWidth margin="normal"
              {...methods.register("description", { required: "שדה חובה" })}
              error={!!errors.description}
              helperText={errors.description?.message}
            />

            <Controller name="type" control={control} render={({ field }) => (
              <FormControl fullWidth margin="normal">
                <InputLabel id="type-label">סוג חדר</InputLabel>
                <Select labelId="type-label" {...field}>
                  <MenuItem value={RoomType.MEETING_ROOM}>חדר ישיבות</MenuItem>
                  <MenuItem value={RoomType.LOUNGE}>לאונג’</MenuItem>
                </Select>
              </FormControl>
            )} />

            <Controller name="workspaceMapId" control={control} rules={{ required: "יש לבחור מפה" }} render={({ field }) => (
              <FormControl fullWidth margin="normal" error={!!errors.workspaceMapId}>
                <InputLabel id="workspaceMapId-label">מפה</InputLabel>
                <Select labelId="workspaceMapId-label" {...field}>
                  {maps.map((map) => (
                    <MenuItem key={map.id} value={map.id}>{map.name}</MenuItem>
                  ))}
                </Select>
                {errors.workspaceMapId && <FormHelperText>{errors.workspaceMapId.message}</FormHelperText>}
              </FormControl>
            )} />

            <TextField
              label="קיבולת"
              fullWidth margin="normal" type="number" inputProps={{ min: 1}}
              {...methods.register("capacity", {
                valueAsNumber: true,
                min: { value: 0, message: "לא ניתן לשים מספר קטן מ-1" },
                required: "שדה חובה",
              })}
              error={!!errors.capacity}
              helperText={errors.capacity?.message}
            />

            <TextField
              label="מחיר לשעה"
              fullWidth margin="normal" type="number" inputProps={{ min: 0 }}
              {...methods.register("hourlyRate", {
                valueAsNumber: true,
                min: { value: 0, message: "לא ניתן להזין ערך שלילי" },
                required: "שדה חובה",
              })}
              error={!!errors.hourlyRate}
              helperText={errors.hourlyRate?.message}
            />

            <TextField
              label="מחיר מוזל"
              fullWidth margin="normal" type="number" inputProps={{ min: 0 }}
              {...methods.register("discountedHourlyRate", {
                valueAsNumber: true,
                min: { value: 0, message: "לא ניתן להזין ערך שלילי" },
                required: "שדה חובה",
                validate: (v) => v <= watch("hourlyRate") || "המחיר המוזל לא יכול להיות גבוה ממחיר רגיל",
              })}
              error={!!errors.discountedHourlyRate}
              helperText={errors.discountedHourlyRate?.message}
            />

            <TextField
              label="ציוד (מופרד בפסיקים)"
              fullWidth margin="normal"
              // {...methods.register("equipment", { required: "שדה חובה" })}
              error={!!errors.equipment}
              helperText={errors.equipment?.message}
            />

            <TextField
              label="מאפיינים (UUIDs מופרדים בפסיקים)"
              fullWidth margin="normal"
              // {...methods.register("features", { required: "שדה חובה" })}
              error={!!errors.features}
              helperText={errors.features?.message}
            />

            <Controller name="status" control={control} render={({ field }) => (
              <FormControl fullWidth margin="normal">
                <InputLabel id="status-label">סטטוס</InputLabel>
                <Select labelId="status-label" {...field}>
                  <MenuItem value={RoomStatus.AVAILABLE}>זמין</MenuItem>
                  <MenuItem value={RoomStatus.MAINTENANCE}>תחזוקה</MenuItem>
                  <MenuItem value={RoomStatus.INACTIVE}>לא פעיל</MenuItem>
                </Select>
              </FormControl>
            )} />

            <TextField
              label="מינימום זמן הזמנה (בדקות)"
              fullWidth margin="normal" type="number" inputProps={{ min: 0 }}
              {...methods.register("minimumBookingMinutes", {
                valueAsNumber: true,
                min: { value: 1, message: "חייב להיות גדול מאפס" },
                required: "שדה חובה",
              })}
              error={!!errors.minimumBookingMinutes}
              helperText={errors.minimumBookingMinutes?.message}
            />

            <TextField
              label="מקסימום זמן הזמנה (בדקות)"
              fullWidth margin="normal" type="number" inputProps={{ min: 0 }}
              {...methods.register("maximumBookingMinutes", {
                valueAsNumber: true,
                min: { value: 1, message: "חייב להיות גדול מאפס" },
                required: "שדה חובה",
                validate: (v) =>
                  v >= watch("minimumBookingMinutes") || "מקסימום חייב להיות ≥ מינימום",
              })}
              error={!!errors.maximumBookingMinutes}
              helperText={errors.maximumBookingMinutes?.message}
            />

            <TextField
              label="שעות חינם לקליקה"
              fullWidth margin="normal" type="number" inputProps={{ min: 0 }}
              {...methods.register("FreeHoursForKlikcaCard", {
                valueAsNumber: true,
                min: { value: 0, message: "לא ניתן להזין ערך שלילי" },
                required: "שדה חובה",
              })}
              error={!!errors.FreeHoursForKlikcaCard}
              helperText={errors.FreeHoursForKlikcaCard?.message}
            />

            <TextField
              label="מיקום X"
              fullWidth margin="normal" type="number" inputProps={{ min: 0 }}
              {...methods.register("positionX", {
                valueAsNumber: true,
                min: { value: 0, message: "לא ניתן להזין ערך שלילי" },
                required: "שדה חובה",
              })}
              error={!!errors.positionX}
              helperText={errors.positionX?.message}
            />

            <TextField
              label="מיקום Y"
              fullWidth margin="normal" type="number" inputProps={{ min: 0 }}
              {...methods.register("positionY", {
                valueAsNumber: true,
                min: { value: 0, message: "לא ניתן להזין ערך שלילי" },
                required: "שדה חובה",
              })}
              error={!!errors.positionY}
              helperText={errors.positionY?.message}
            />

            <TextField
              label="רוחב"
              fullWidth margin="normal" type="number" inputProps={{ min: 0 }}
              {...methods.register("width", {
                valueAsNumber: true,
                min: { value: 0, message: "לא ניתן להזין ערך שלילי" },
                required: "שדה חובה",
              })}
              error={!!errors.width}
              helperText={errors.width?.message}
            />

            <TextField
              label="גובה"
              fullWidth margin="normal" type="number" inputProps={{ min: 0 }}
              {...methods.register("height", {
                valueAsNumber: true,
                min: { value: 0, message: "לא ניתן להזין ערך שלילי" },
                required: "שדה חובה",
              })}
              error={!!errors.height}
              helperText={errors.height?.message}
            />
<Box sx={{ mt: 2, mb: 3 }}>
  <label style={{ fontWeight: "bold", display: "block", marginBottom: 8 }}>
    האם נדרש אישור להזמנה?
  </label>
  <label style={{ marginRight: 16 }}>
    <input
      type="radio"
      checked={watch("RequiredApproval") === true}
      onChange={() => setValue("RequiredApproval", true)}
    />
    כן
  </label>
  <label>
    <input
      type="radio"
      checked={watch("RequiredApproval") === false}
      onChange={() => setValue("RequiredApproval", false)}
    />
    לא
  </label>
</Box>


            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
             
              
              <Button variant="secondary" onClick={() => { setIsFormVisible(false); setEditingId(null); }}>ביטול</Button>
            
              <Button type="submit" variant="primary">{editingId ? "עדכון חדר" : "יצירת חדר"} </Button>
            </Box>
          </FormProvider>
        </Box>
      )}
    </div>
  );
}