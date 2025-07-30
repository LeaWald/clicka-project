import express from 'express';
import * as customerController from '../controllers/customer.controller';
import multer from 'multer';

const routerCustomer = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// (GET)
// routerCustomer.get('/by-page', customerController.getCustomersByPage);

routerCustomer.get('/confirm-email/:id/:email', customerController.confirmEmail);

routerCustomer.get('/sendEmailWithContract/:link', customerController.sendContractEmail)

routerCustomer.get('/page', customerController.getCustomersByPage); 

routerCustomer.get('/', customerController.getAllCustomers); 

routerCustomer.get('/status/all', customerController.getAllCustomerStatus);

routerCustomer.get('/notify/:id',  customerController.getCustomersToNotify); 

routerCustomer.get('/search',  customerController.searchCustomersByText);

routerCustomer.get('/:id', customerController.getCustomerById); 

routerCustomer.get('/:id/payment-methods',  customerController.getCustomerPaymentMethods);

//(POST)
routerCustomer.post('/upload/excel', upload.single('file'), customerController.postCustomersFromExcel);

routerCustomer.post('/:id/exit-notice',  customerController.postExitNotice); 

routerCustomer.post('/post-customer',  customerController.postCustomer); 

routerCustomer.post('/:id/status-change', customerController.changeCustomerStatus)

//PATCH/PUT)

routerCustomer.patch('/:id',  customerController.patchCustomer); 

routerCustomer.delete('/:id', customerController.deleteCustomer);

export default routerCustomer;

