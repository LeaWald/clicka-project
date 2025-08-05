import { Router } from "express";
import { WorkspaceController } from "../controllers/workspace.controller";

const workspaceController = new WorkspaceController();
const workspaceRouter = Router();

workspaceRouter.get("/getAllWorkspace", workspaceController.getAllWorkspace.bind(workspaceController));
workspaceRouter.get("/getWorkspaceById/:id", workspaceController.getWorkspaceById.bind(workspaceController));
workspaceRouter.get("/getWorkspacesByCustomerId/:customerId", workspaceController.getWorkspacesByCustomerId.bind(workspaceController));
workspaceRouter.get("/getPricingTiersByWorkspaceType/:workspaceType", workspaceController.getPricingTiersByWorkspaceType.bind(workspaceController));
workspaceRouter.post("/createWorkspace", workspaceController.createWorkspace.bind(workspaceController));
workspaceRouter.put("/updateWorkspace/:id", workspaceController.updateWorkspace.bind(workspaceController));
workspaceRouter.delete("/deleteWorkspace/:id", workspaceController.deleteWorkspace.bind(workspaceController));
export default workspaceRouter;