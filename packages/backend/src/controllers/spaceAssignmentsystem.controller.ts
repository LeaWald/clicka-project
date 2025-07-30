import { SpaceAssignmentModel } from "../models/spaceAssignment.model";
import { SpaceAssignmentService } from "../services/spaceAssignmentsystem.service";
import { Request, Response } from "express";

export class SpaceAssignmentController {
    spaceAssignmentService = new SpaceAssignmentService();
    
    async createSpace(req: Request, res: Response) {
    console.log('Received request to create space:', req.body);
    const spaceData = req.body;
    
    // הוספת created_at ו-updated_at
const currentTime = new Date();
const spaceDataWithTimestamps = {
  ...spaceData,
  createdAt: currentTime,
  updatedAt: currentTime
};
    
    console.log('Prepared space data:', JSON.stringify(spaceDataWithTimestamps, null, 2));
    const space = new SpaceAssignmentModel(spaceDataWithTimestamps);
    
    try {
        const result = await this.spaceAssignmentService.createSpace(space);
        if (result) {
            res.status(201).json(result);
        } else {
            res.status(500).json({ error: "Failed to create assignment" });
        }
    } catch (error) {
        console.error('Error creating space assignment:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ 
            error: "Failed to create assignment", 
            details: errorMessage 
        });
    }
}

    async getAllSpaces(req: Request, res: Response) {
        try {
            const result = await this.spaceAssignmentService.getAllSpaces();
            if (result) {
                res.status(200).json(result);
            } else {
                res.status(500).json({ error: "Failed to fetch assignments" });
            }
        } catch (error) {
            console.error('Error fetching assignments:', error);
            res.status(500).json({ error: "Failed to fetch assignments" });
        }
    }

    async updateSpace(req: Request, res: Response) {
        try {
            const spaceData = req.body;
            // הוספת updated_at לעדכון
            const spaceDataWithTimestamp = {
                ...spaceData,
                updated_at: new Date().toISOString()
            };
            const space = new SpaceAssignmentModel(spaceDataWithTimestamp);
            const updateSpace = await this.spaceAssignmentService.updateSpace(req.params.id, space);
            res.json(updateSpace);
        } catch (err) {
            console.error('Error updating space:', err);
            res.status(500).json({ message: 'Error updating assignment' });
        }
    }

    async getSpaceById(req: Request, res: Response) {
        try {
            const getAssignment = await this.spaceAssignmentService.getSpaceById(req.params.id);
            res.json(getAssignment);
        } catch (err) {
            console.error('Error fetching assignment by ID:', err);
            res.status(500).json({ message: 'Error fetching assignment' });
        }
    }

    async deleteSpace(req: Request, res: Response) {
        try {
            const deleteSpace = await this.spaceAssignmentService.deleteSpace(req.params.id);
            res.json(deleteSpace);
        } catch (err) {
            console.error('Error deleting assignment:', err);
            res.status(500).json({ message: 'Error deleting assignment' });
        }
    }

    async checkConflicts(req: Request, res: Response) {
        try {
            const { workspaceId, assignedDate, unassignedDate, excludeId, daysOfWeek } = req.body;
            
            console.log('Checking conflicts for:', { workspaceId, assignedDate, unassignedDate, excludeId , daysOfWeek});
            
            const conflicts = await this.spaceAssignmentService.checkConflicts(
                workspaceId, 
                assignedDate, 
                unassignedDate, 
                excludeId,
                daysOfWeek
            );
            
            res.status(200).json({
                hasConflicts: conflicts.length > 0,
                conflicts: conflicts,
                message: conflicts.length > 0 
                    ? `נמצאו ${conflicts.length} קונפליקטים` 
                    : 'אין קונפליקטים'
            });
        } catch (error) {
            console.error('Error checking conflicts:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ 
                error: "Failed to check conflicts", 
                details: errorMessage 
            });
        }
    }
      async getHistory(req: Request, res: Response) {
      try {
        const { date: dateParam } = req.params; 
        if (!dateParam) {
          return res.status(400).json({ error: 'Date parameter is required' });
        }
        const date = new Date(dateParam);
        if (isNaN(date.getTime())) {
          return res.status(400).json({ error: 'Invalid date format' });
        }
        const result = await this.spaceAssignmentService.getHistory(date);
        res.status(200).json(result);
      } catch (err) {
        console.error('Error in controller:', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
}