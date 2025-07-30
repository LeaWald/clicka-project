import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import './scripts/daily-contract-expiry'
import routerCustomer from './routes/customer.route';
import routerContract from './routes/contract.route';
import routerLead from './routes/lead.route';
import routerPricing from './routes/pricing.route';
import expenseRouter from './routes/expense.route';
import routerPayment from './routes/payment.route';
import interactionRouter from './routes/leadInteraction.route';
import routerAuth from './routes/auth';
import bookRouter from './routes/booking.route';
import workspaceRouter from './routes/workspace.route';
import featureRouter from './routes/roomFaeature.route';
import spaceRouter from './routes/spaceAssignmemt.route';
import roomRouter from './routes/room.route';
import occupancyrouter from './routes/occupancyTrend.route';
import routerMap from './routes/workspaceMap.route';
import { setupSwagger } from './docs/swagger';
import routerReport from './routes/Reports.route';
import vendorRouter from './routes/vendor.router';
import router from './routes';
import documentRouter from './routes/document.routes';
import invoiceRouter from './routes/invoice.route';
import paymentRoutes from './routes/payment.route';
import emailTemplateRouter from './routes/emailTemplate.route';
import driveRoutes from './routes/drive-route';
import translationRouter from './routes/translation.route';
import userRouter from './routes/user.route';
import auditLogRouter from './routes/auditLog.route';
import syncRouter from './routes/googleCalendarBookingIntegration.route';

import calendarSyncRouter from './routes/googleCalendarBookingIntegration.route';

import { globalAuditMiddleware } from './middlewares/globalAudit.middleware';
import { file } from 'googleapis/build/src/apis/file';

dotenv.config();

const app = express();
setupSwagger(app);

app.use(cookieParser());
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || process.env.REACT_APP_API_URL_FE, // Adjust as needed
  credentials: true, // Allow cookies to be sent with requests
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(globalAuditMiddleware);

app.use('/api/customers', routerCustomer);
app.use('/api/users', userRouter);
app.use('/api/rooms', roomRouter);
app.use('/api/space', spaceRouter);
app.use('/api/features', featureRouter);
app.use('/api/map', routerMap);
app.use('/api/workspace', workspaceRouter);
app.use('/api/occupancy', occupancyrouter);
app.use('/api/leads', routerLead);
app.use('/api/contract', routerContract);
app.use('/api/pricing', routerPricing);
app.use('/api/emailTemplate', emailTemplateRouter);
app.use('api/google-calendar', syncRouter);
app.use('/api/calendar-sync', calendarSyncRouter);
app.use('/api/book', bookRouter);
app.use('/api/vendor', (req, res, next) => {
  console.log('Vendor route hit:', req.method, req.originalUrl);
  next();
}, vendorRouter);
app.use('/api/auth', routerAuth);
app.use('/api/expenses', expenseRouter);
app.use('/api/reports', routerReport);
app.use('/api/interaction', interactionRouter);
app.use('/api/payment', routerPayment);
app.use('/api/document', documentRouter);
app.use('/api/invoices', invoiceRouter);
app.use('/api/drive', driveRoutes);
app.use('/api/translate', translationRouter);


app.use('/api', router);
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error occurred:', {
    message: err.message || 'Unknown error',
    status: err.status || 500,
    code: err.code || 'INTERNAL_SERVER_ERROR'
  });
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    }
  });
});
// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error occurred:', {
    message: err.message || 'Unknown error',
    status: err.status || 500,
    code: err.code || 'INTERNAL_SERVER_ERROR'
  });
  console.log(req);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    }
  });
});


 
export default app;