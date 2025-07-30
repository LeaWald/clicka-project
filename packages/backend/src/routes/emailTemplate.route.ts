import { Router } from 'express';
import { EmailTemplateController } from '../controllers/emailTemplate.controller';

const emailTemplateController = new EmailTemplateController();
const emailTemplateRouter = Router();

emailTemplateRouter.get('/', emailTemplateController.getTemplates.bind(emailTemplateController));
emailTemplateRouter.get('/:id', emailTemplateController.getTemplateById.bind(emailTemplateController));
emailTemplateRouter.get('/:name/name', emailTemplateController.getTemplateByName.bind(emailTemplateController));
emailTemplateRouter.post('/', emailTemplateController.createTemplate.bind(emailTemplateController));
emailTemplateRouter.put('/:id', emailTemplateController.updateTemplate.bind(emailTemplateController));
emailTemplateRouter.delete('/:id', emailTemplateController.deleteTemplate.bind(emailTemplateController));
emailTemplateRouter.post('/:id/preview', emailTemplateController.previewTemplate.bind(emailTemplateController));

export default emailTemplateRouter;
