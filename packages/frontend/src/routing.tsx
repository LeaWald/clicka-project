import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import App from './App';
import { AuthenticationScreen } from './MainMenu/CoreAndIntegration/Components/Login/AuthenticationScreen';
import { ProtectedRoute } from './MainMenu/CoreAndIntegration/Components/Login/ProtectedRoute';
import { LeadAndCustomer } from './MainMenu/LeadAndCustomer/Components/leadAndCustomer';
import { LeadAndCustomerRouting } from './MainMenu/LeadAndCustomer/Components/LeadAndCustomerRouting';
import VendorsList from './MainMenu/Billing/Components/Vendor-management/VendorsList';
import { Vendor } from 'shared-types';
import { ExcelUpload } from './MainMenu/LeadAndCustomer/Components/Leads/ UploadLeadsFile';
import { ExcelCUpload } from './MainMenu/LeadAndCustomer/Components/Customers/UploadCustomersFile';
// import { BillingRouting } from './MainMenu/Billing/Components/billingRouting';
// import { ExpenseList } from './MainMenu/Billing/Components/expenseManagementSystem/expenseList';
import PaymentForm from './MainMenu/Billing/Components/invoice-generation-engine/PaymentForm';
import { PaymentList } from './MainMenu/Billing/Components/paymentList';
import { BookingCalendar } from './MainMenu/Workspace/Components/bookingCalendar';
import { ManagementWorkspace } from './MainMenu/Workspace/Components/managementWorkspace';
import { UserTable } from './MainMenu/CoreAndIntegration/Components/User/ShowAllUsers';
import { RoomReservations } from './MainMenu/Workspace/Components/RoomReservations';
import { SendEmail } from './MainMenu/CoreAndIntegration/Components/SendEmail/SendEmail';
import { EmailTemplateTable } from './MainMenu/CoreAndIntegration/Components/EmailTemplate/ShowAllEmailTemplates';
import AuditLogTable from './MainMenu/CoreAndIntegration/Components/User/AuditLogTable';
import PricingHomePage from './MainMenu/Billing/Components/Pricing/PricingHomePage';
import PricingSectionPage from './MainMenu/Billing/Components/Pricing/PricingSectionPage';
import { InvoiceManagement } from './MainMenu/Billing/Components/invoice-generation-engine/InvoiceManagement';
import { Collection } from './MainMenu/Billing/Components/invoice-generation-engine/collection';
import { RegisterUser } from './MainMenu/CoreAndIntegration/Components/Login/registerUser';
import { VendorForm } from './MainMenu/Billing/Components/Vendor-management/VendorForm';
import { ExpensesPage } from './MainMenu/Billing/Components/expenseManagementSystem/ExpensesPage';
import { BookingTable } from './MainMenu/Workspace/Components/bookingTable';
import { UpdateBooking } from './MainMenu/Workspace/Components/updateBooking';
import { Report } from './MainMenu/Workspace/Components/report';
import { AssigmentTable } from './MainMenu/Workspace/Components/assigenmentTable';
import { UpdateAssigenment } from './MainMenu/Workspace/Components/updateAssigenment';
import { AssignmentForm } from './MainMenu/Workspace/Components/assignmentForm';
import DocumentUpload from './MainMenu/CoreAndIntegration/Components/DocumentUpload';
import { RoomManager } from './MainMenu/Workspace/Components/RoomManager';
// import { CreateExpenseModal } from './MainMenu/Billing/Components/expenseManagementSystem/expenseForm';
import { WorkspaceMap } from './MainMenu/Workspace/Components/workspaceMap';
import { CustomerChange } from './MainMenu/Workspace/Components/customerChange';
import DocumentTemplate from './MainMenu/DocumentManagement/Components/DocumentTemplate';
import { UpdateDocumentTemplate } from './MainMenu/DocumentManagement/Components/UpdateDocumentTemplate';
import {ShowDocumentTemplate} from './MainMenu/DocumentManagement/Components/ShowDocumentTemplate';
import { PreviewDocumentTemplate } from './MainMenu/DocumentManagement/Components/PreviewDocumentTemplate';
import AddDocumentTemplate from './MainMenu/DocumentManagement/Components/AddDocumentTemplate';
import { ExpenseList } from './MainMenu/Billing/Components/expenseManagementSystem/expenseList';
import { DocumentTemplatePreviewPage } from './MainMenu/DocumentManagement/Components/DocumentTempExport';
import { BillingRouting } from './MainMenu/Billing/Components/BillingRouting';

export const Routing = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  return (
    <Routes>

      <Route path="/auth" element={<AuthenticationScreen />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        }
      >
        {/* Rutas hijas que se renderizan dentro de <Outlet /> en App */}
        <Route path="leadAndCustomer" element={<LeadAndCustomer />} />
        <Route path="leadAndCustomer/*" element={<LeadAndCustomerRouting />} />
        {/* <Route path="billing/*" element={<BillingRouting/>} /> */}
        <Route path="billing/*" element={<BillingRouting />} />
        {/* <Route path="expenses" element={<ExpenseList />} /> */}
        <Route path="expenses" element={<ExpensesPage/>} />
        <Route path="/leadAndCustomer/leads/UploadLeadsFile" element={<ExcelUpload />} />
        <Route path="/leadAndCustomer/Customers/UploadCustomersFile" element={<ExcelCUpload />} />
        {/* <Route path="expenses/expense-form" element={<CreateExpenseForm />} /> */}
        {/* <Route path="expenses/expense-form/:id" element={<CreateExpenseForm />} /> */}
        <Route path="/workspaceMap" element={<WorkspaceMap />} />
        <Route path="assignmentForm" element={<AssignmentForm/>} />
        <Route path="assignmentTable" element={<AssigmentTable/>} />
        <Route path="updateAssignment" element={<UpdateAssigenment/>} />
        <Route path="bookings" element={<BookingTable />} />
        <Route path="updateBooking" element={<UpdateBooking />} />
        <Route path="bookingCalendar" element={<BookingCalendar roomId={""} roomName={""} />} />
        <Route path="payments" element={<PaymentList />} />
        <Route path="payment-form" element={<PaymentForm />} />
        <Route path="vendor" element={<VendorsList vendors={vendors} setVendors={setVendors} />} />
        {/* <Route path="billing/*" element={<BillingRouting />} /> */}
        <Route path="expenses" element={<ExpenseList />} />
        {/* <Route path="expenses/expense-form" element={<CreateExpenseForm />} /> */}
        {/* <Route path="expenses/expense-form/:id" element={<CreateExpenseForm />} /> */}
        <Route path="/workspaceMap" element={<WorkspaceMap />} />
        <Route path="leadAndCustomer/*" element={<LeadAndCustomerRouting />} />
        <Route path="assignmentForm" element={<AssignmentForm />} />
        <Route path="bookingCalendar" element={<BookingCalendar roomId={""} roomName={""} />} />
        <Route path="payments" element={<DocumentTemplate />} />
        <Route path="/document-templates" element={<DocumentTemplate />} />
        <Route path="document-templates/edit/:id" element={<UpdateDocumentTemplate />} />
        <Route path="document-templates/view/:id" element={<ShowDocumentTemplate />} />
        <Route path="document-templates/preview/:id" element={<DocumentTemplatePreviewPage />} />
        <Route path="document-templates/add" element={<AddDocumentTemplate />} />
        {/* <Route path="document-templates/preview/:id" element={<DocumentTemplate />} /> */}
        <Route path="payment" element={<PaymentForm />} />
        <Route path="vendors" element={<VendorsList vendors={vendors} setVendors={setVendors} />} />
        <Route path="vendors/new" element={<VendorForm vendors={vendors} setVendors={setVendors} />} />
        <Route path="vendors/:id/edit" element={<VendorForm vendors={vendors} setVendors={setVendors} />} />
        {/* <Route path="vendors/:id" element={<VendorSummary vendors={vendors} setVendors={setVendors} />} /> */}
        {/* <Route path="expense-form" element={<CreateExpenseForm />} /> */}
        {/* <Route path="billing/*" element={<Billing />} /> */}
        <Route path="users" element={< UserTable />} />
        <Route path="meetingRooms" element={<RoomReservations />} />
        <Route path="UserActions" element={< AuditLogTable />} />
        <Route path="emailTemplate" element={< EmailTemplateTable />} />
        <Route path="sendEmails" element={< SendEmail />} />
        <Route path="/pricing" element={<PricingHomePage />} />
        <Route path="/pricing/workspace" element={<PricingSectionPage type="workspace" />} />
        <Route path="/pricing/meeting-room" element={<PricingSectionPage type="meeting-room" />} />
        <Route path="/pricing/lounge" element={<PricingSectionPage type="lounge" />} />
        <Route path="/managementWorkspace" element={<ManagementWorkspace />} />
        <Route path="/billing/invoiceManagement" element={< InvoiceManagement />} />
        <Route path="/occupancyReports" element={<Report />} />
        <Route path="/billing/collection" element={< Collection />} />
        <Route path="/rooms" element={<RoomManager />} />
        <Route path="/documentUpload" element={< DocumentUpload />} />
        <Route path="/registerUser" element={<RegisterUser />} />
        <Route path="/customerChange" element={<CustomerChange/>} />
      </Route>


      <Route path="*" element={<div>404 - page not found</div>} />
    </Routes>
  );
};