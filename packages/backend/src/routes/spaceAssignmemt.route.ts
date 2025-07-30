import { Router } from "express";
import { SpaceAssignmentController } from "../controllers/spaceAssignmentsystem.controller";

const spaceController = new SpaceAssignmentController();
const spaceRouter = Router();

spaceRouter.get("/getAllSpaces", spaceController.getAllSpaces.bind(spaceController));
spaceRouter.get("/getSpaceById/:id", spaceController.getSpaceById.bind(spaceController));
spaceRouter.post("/createSpace", spaceController.createSpace.bind(spaceController));
spaceRouter.put("/updateSpace/:id", spaceController.updateSpace.bind(spaceController));
spaceRouter.delete("/deleteSpace/:id", spaceController.deleteSpace.bind(spaceController));
spaceRouter.post("/checkConflicts", spaceController.checkConflicts.bind(spaceController));
spaceRouter.get('/getHistory/:date',spaceController.getHistory.bind(spaceController));
export default spaceRouter;