import express from 'express';
import * as paymentController from '../controllers/payment.controller';

const routerPayment = express.Router();

// (GET) קבלת כל התשלומים
routerPayment.get('/', paymentController.getAllPayments);

routerPayment.get('/by-page', paymentController.getPaymentByPage);

// (GET) קבלת תשלום לפי מזהה
routerPayment.get('/id/:id', paymentController.getPaymentById);

// (GET) קבלת תשלומים לפי פילטרים
routerPayment.get("/search", paymentController.searchPaymentsByText);

// (POST) יצירת תשלום חדש
routerPayment.post('/', paymentController.createPayment);

// (PATCH) עדכון תשלום לפי ID
routerPayment.patch('/:id', paymentController.updatePayment);

// (DELETE) מחיקת תשלום לפי ID
routerPayment.delete('/:id', paymentController.deletePayment);

export default routerPayment;