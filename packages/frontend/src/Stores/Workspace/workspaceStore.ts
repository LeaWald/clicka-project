import { create } from "zustand";
import axiosInstance from "../../Service/Axios";
import { ID, Space, SpaceStatus } from "shared-types";

interface WorkSpaceState {
    workSpaces: Space[];
    maps: any[];
    getAllWorkspace: () => Promise<void>;
    getWorkspaceById: (id: ID) => Promise<void>;
    updateWorkspace: (workspace: Space, id: ID) => Promise<void>;
    createWorkspace: (workspace: Space) => Promise<void>;
    deleteWorkspace: (id: ID) => Promise<void>;
    getWorkspaceHistory: (date: Date) => Promise<void>;
    getAllWorkspaceMap: () => Promise<any[]>;
}
//מימוש הפונקציות
export const useWorkSpaceStore = create<WorkSpaceState>((set, get) => ({
    workSpaces: [],
    maps: [],
    //get all spaces
    getAllWorkspace: async () => {
        try {
            const response = await axiosInstance.get('/workspace/getAllWorkspace');
            set({ workSpaces: response.data });
        } catch (error) {
            console.error('Error fetching work spaces:', error);
        }
    },
    //get by id
    getWorkspaceById: async (id) => {
        try {
            const response = await axiosInstance.get(`/workspace/getWorkspaceById/${id}`);
            set({ workSpaces: response.data });
        } catch (error) {
            console.error('Error fetching work spaces:', error);
        }
    },
    //update space
    updateWorkspace: async (workspace, id) => {
        try {
            const response = await axiosInstance.put(`/workspace/updateWorkspace/${id}`, workspace);
            set((state) => ({
                workSpaces: state.workSpaces.map((ws) =>
                    ws.id === id ? response.data : ws
                )
            }));
        } catch (error) {
            console.error('Error updating workspace:', error);
        }
    },

    //add space
    createWorkspace: async (workspace) => {
        try {
            const response = await axiosInstance.post('/workspace/createWorkspace', workspace);
            set((state) => ({
                workSpaces: [...state.workSpaces, response.data]
            }));
        } catch (error) {
            console.error('Error creating workspace:', error);
        }
    },
    //delete space
    deleteWorkspace: async (id) => {
        try {
            await axiosInstance.delete(`/workspace/deleteWorkspace/${id}`);
            set((state) => ({
                workSpaces: state.workSpaces.filter((ws) => ws.id !== id)
            }));
        } catch (error) {
            console.error('Error deleting workspace:', error);
        }
    },
    getWorkspaceHistory: async (date: Date) => {
        try {
            const formattedDate = date.toISOString().split('T')[0];
            console.log('Sending date to API:', formattedDate);

            const response = await axiosInstance.get<Space[]>(`/space/getHistory/${formattedDate}`);
            const serverData = response.data;

            const { workSpaces: localData } = get();

            const mergedData: Space[] = [...serverData];

            localData.forEach(localItem => {
                const exists = serverData.some(serverItem => serverItem.id === localItem.id);
                if (!exists) {
                    const { currentCustomerId, currentCustomerName, ...rest } = localItem;
                    mergedData.push({
                        ...rest,
                        currentCustomerId: '',
                        currentCustomerName: '',
                        status: rest.type === 'BASE' ? SpaceStatus.NONE : SpaceStatus.AVAILABLE,
                    });
                }
            });
            set({ workSpaces: mergedData });
        } catch (error) {
            console.error('Error fetching work spaces:', error);
            set({ workSpaces: [] });
        }
    },

    // get all workspace maps
    getAllWorkspaceMap: async () => {
        try {
            const response = await axiosInstance.get(`/map/all`);
            set({ maps: response.data });  // שים את המפות בסטור
            return response.data; // החזר את המערך
        } catch (error) {
            console.error("Error fetching workspace maps:", error);
            return [];
        }
    },
}));
