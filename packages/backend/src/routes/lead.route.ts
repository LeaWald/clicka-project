import express from 'express';
import * as controllerLead from '../controllers/lead.controller';
import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() }); 

const routerLead = express.Router();

routerLead.get('/by-page',  controllerLead.getLeadsByPage);

routerLead.get("/search",  controllerLead.searchLeadsByText);

routerLead.get('/',  controllerLead.getAllLeads);

routerLead.get('/:id', controllerLead.getLeadById);

routerLead.post('/upload/excel', upload.single('file'), controllerLead.postLeadFromExcel);

routerLead.post('/', controllerLead.createLead);

routerLead.get('/sources/:id', controllerLead.getSourcesLeadById);

routerLead.patch('/:id', controllerLead.patchLead);

routerLead.post('/upload/csv', controllerLead.postLeadFromCSV);

routerLead.get('/reminders/open',  controllerLead.getLeadsToRemind);

routerLead.delete('/:id',  controllerLead.deleteLead);

routerLead.post('/:id/addInteraction',controllerLead.addInteractionToLead);

routerLead.delete('/:leadId/interactions/:interactionId', controllerLead.deleteInteraction);


export default routerLead;