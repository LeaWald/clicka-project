import express from 'express';
import * as contractControler from '../controllers/contract.controller'; 
import { UserRole } from 'shared-types';
import { authorizeUser } from '../middlewares/authorizeUserMiddleware';


const routerContract = express.Router();

//  (GET)
routerContract.get('/ending-soon', contractControler.getContractsEndingSoon); 

routerContract.get('/', contractControler.getAllContracts); 

routerContract.get('/customer/:customerId',contractControler.getAllContractsByCustomerId);

routerContract.get('/:contractId',  contractControler.getContractById);

// routerContract.get("/search", contractControler.searchContractsByText);


// (POST)
routerContract.post('/',  contractControler.postNewContract); 

routerContract.post('documents', contractControler.postContractDocument); 

//  (PATCH)
routerContract.patch('/:contractId', contractControler.updateContract);

routerContract.put('/:contractId/document', contractControler.updateContractDocument);

routerContract.post('/customer/:customerId/document', contractControler.createOrUpdateContractWithDocument);

//  (DELETE)
routerContract.delete('documents/:customerId',  contractControler.deleteContractDocument); 
routerContract.delete('/:contractId', contractControler.deleteContract); 

export default routerContract;