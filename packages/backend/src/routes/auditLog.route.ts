import { Router } from "express";
import { AuditLogController } from "../controllers/auditLog.controller";

// יצירת מופע של הקונטרולר
const auditLogController = new AuditLogController();
const auditLogRouter = Router();

// שליפת יומני פעילות לפי פילטרים
auditLogRouter.get("/AuditLogController", auditLogController.getAuditLogs.bind(auditLogController));

export default auditLogRouter;