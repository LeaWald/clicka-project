import { Request, Response } from 'express';
import { WorkspaceService } from '../services/workspace.service';
import { WorkspaceModel } from '../models/workspace.model';

export class WorkspaceController {
  private workspaceService = new WorkspaceService();

  async createWorkspace(req: Request, res: Response) {
    console.log('Received request to create workspace:', req.body);
    try {
      const workspaceData = req.body;

      const workspace = new WorkspaceModel(workspaceData);
      console.log('workspace object created:', JSON.stringify(workspace, null, 2));

      const result = await this.workspaceService.createWorkspace(workspace);

      if (result) {
        res.status(200).json(result);
      } else {
        res.status(500).json({ error: "Failed to create room" });
      }
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }


  async getAllWorkspace(req: Request, res: Response) {
    const result = await this.workspaceService.getAllWorkspace();
    if (result) {
      res.status(200).json(result);
    } else {
      res.status(500).json({ error: "Failed to fetch workspace" });
    }
  }


  async updateWorkspace(req: Request, res: Response) {
    try {
      const workspaceData = req.body;
      const workspace = new WorkspaceModel(workspaceData);
      const updateRoom = await this.workspaceService.updateWorkspace(req.params.id, workspace);
      res.json(updateRoom);
    }
    catch (err: any) {
      res.status(500).json({ massage: err.message });
    }
  }

  async getWorkspaceById(req: Request, res: Response) {
    try {
      const getworkspce = await this.workspaceService.getworkspaceById(req.params.id);
      res.json(getworkspce);
    }
    catch (err: any) {
      res.status(500).json({ massage: err.massage });
    }
  }

  async getWorkspacesByCustomerId(req: Request, res: Response) {
    try {
      const customerId = req.params.id;
      const workspaces = await this.workspaceService.getWorkspacesByCustomerId(customerId);

      if (workspaces) {
        res.status(200).json(workspaces);
      } else {
        res.status(404).json({ error: "No workspaces found for this customer" });
      }
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getPricingTiersByWorkspaceType(req: Request, res: Response) {
    try {
      const workspaceType = req.params.workspaceType; // קבלת סוג העבודה מהפרמטרים של הבקשה
      const pricingTiers = await this.workspaceService.getPricingTiersByWorkspaceType(workspaceType);

      if (pricingTiers) {
        res.status(200).json(pricingTiers);
      } else {
        res.status(404).json({ error: "No pricing tiers found for this workspace type" });
      }
    } catch (error) {
      console.error("Error fetching pricing tiers:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }


  async deleteWorkspace(req: Request, res: Response) {
    try {
      const deleteWorkspace = await this.workspaceService.deleteWorkspace(req.params.id);
      res.json(deleteWorkspace);
    }
    catch (err) {
      res.status(500).json({ massage: 'err.massage' });
    }
  }
}



