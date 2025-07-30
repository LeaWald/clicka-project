import { create } from "zustand";
import axiosInstance from "../../Service/Axios";
import { Room } from "shared-types";

interface MapItem {
  id: string;
  name: string;
}

interface RoomState {
  rooms: Room[];
  maps: MapItem[];             // הוספתי שדה למפות
  getAllRooms: () => Promise<void>;
  getAllMaps: () => Promise<MapItem[]>;  // פונקציה לשליפת המפות
  loading: boolean;
  error: string | null;
  createRoom: (room: Partial<Room>) => Promise<void>;
  updateRoom: (id: string, room: Partial<Room>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  maps: [],
  loading: false,
  error: null,

  getAllRooms: async () => {
    try {
      const response = await axiosInstance.get("rooms/getAllRooms");
      set({ rooms: response.data });
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  },

  getAllMaps: async () => {
    try {
      const response = await axiosInstance.get("/map/all");
      // ממפה רק id ושם
      const mapsData = response.data.map((map: any) => ({
        id: map.id,
        name: map.name,
      }));
      set({ maps: mapsData });
      return mapsData;
    } catch (error) {
      console.error("Error fetching maps:", error);
      set({ maps: [] });
      return [];
    }
  },

  createRoom: async (room) => {
    try {
      console.log("📤 שולח לשרת ליצירת חדר:", room);
      const response = await axiosInstance.post("/rooms/createRoom", room);
      set((state) => ({
        rooms: [...state.rooms, response.data],
      }));
    } catch (error) {
      console.error("Error creating room:", error);
    }
  },

  updateRoom: async (id, room) => {
    try {
      const response = await axiosInstance.put(`rooms/updateRoom/${id}`, room);
      set((state) => ({
        rooms: state.rooms.map((r) => (r.id === id ? response.data : r)),
      }));
    } catch (error) {
      console.error("Error updating room:", error);
    }
  },

  deleteRoom: async (id) => {
    try {
      await axiosInstance.delete(`rooms/deleteRoom/${id}`);
      set((state) => ({
        rooms: state.rooms.filter((r) => r.id !== id),
      }));
    } catch (error) {
      console.error("Error deleting room:", error);
    }
  },
}));