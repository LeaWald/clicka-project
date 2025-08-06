import { create } from "zustand";
import { axiosInstance } from "../../Service/Axios";
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
    setWorkSpaces: (spaces: Space[]) => void;

}
//מימוש הפונקציות
export const useWorkSpaceStore = create<WorkSpaceState>((set, get) => ({
    workSpaces: [],
    maps: [],
    setWorkSpaces: (spaces) => set({ workSpaces: spaces }),
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
        const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
        console.log('Sending date to API:', formattedDate);

        const response = await axiosInstance.get(`/space/getHistory/${formattedDate}`);
        const assignments: any[] = response.data;

        const { workSpaces: localSpaces } = get();

        // סוגי חללים שתמיד יקבלו סטטוס NONE
        const alwaysNoneTypes = [
            'BASE', 'DOOR', 'PASSAGE', 'KITCHEN', 'TOILET', 'LOUNGE', 'MEETING_ROOM'
        ];

        const mergedSpaces: Space[] = localSpaces.map(space => {
            // אם זה חלל בסיס או אחד מהסוגים המיוחדים - תמיד סטטוס NONE
            if (alwaysNoneTypes.includes(space.type)) {
                return {
                    ...space,
                    currentCustomerId: '',
                    currentCustomerName: '',
                    status: SpaceStatus.NONE,
                    assignedDate: '',
                    unassignedDate: '',
                };
            }

            const assignment = assignments.find((a: any) => a.workspaceId === space.id);
            if (assignment) {
                return {
                    ...space,
                    currentCustomerId: assignment.customerId,
                    currentCustomerName: assignment.customerName || '',
                    status: SpaceStatus.OCCUPIED,
                    assignedDate: assignment.assignedDate,
                    unassignedDate: assignment.unassignedDate,
                };
            } else {
                return {
                    ...space,
                    currentCustomerId: '',
                    currentCustomerName: '',
                    status: SpaceStatus.AVAILABLE,
                    assignedDate: '',
                    unassignedDate: '',
                };
            }
        });

        console.log('mergedSpaces', mergedSpaces);

        set({ workSpaces: mergedSpaces });

    } catch (error) {
        console.error('Error fetching work spaces:', error);
        set({ workSpaces: [] });    }
        }
    ,

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