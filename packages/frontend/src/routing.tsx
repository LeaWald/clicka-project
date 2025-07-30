
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import App from './App';
import VendorsList from './MainMenu/Billing/Components/Vendor-management/VendorsList';
// import VendorSummary from './MainMenu/Billing/Components/Vendor-management/VendorSummary';
import { LeadAndCustomerRouting } from './MainMenu/LeadAndCustomer/Components/LeadAndCustomerRouting';
import { Vendor } from 'shared-types';
import { VendorForm } from './MainMenu/Billing/Components/Vendor-management/VendorForm';
import { CreateExpenseForm } from './MainMenu/Billing/Components/expenseManagementSystem/expenseForm';
import { BillingRouting } from './MainMenu/Billing/Components/BillingRouting';
import MainLayout from './layout/MainLayout';
import { ExpenseList } from './MainMenu/Billing/Components/expenseManagementSystem/expenseList';
// import { ExpenseDetails } from './MainMenu/Billing/Components/expenseManagementSystem/expenseDetails';
import PaymentForm from './MainMenu/Billing/Components/invoice-generation-engine/PaymentForm';
import { WorkspaceMap } from './MainMenu/Workspace/Components/workspaceMap';
import { BookingCalendar } from './MainMenu/Workspace/Components/bookingCalendar';
import { ManagementWorkspace } from './MainMenu/Workspace/Components/managementWorkspace';
import { Billing } from './MainMenu/Billing/Components/billing';
import { UserTable } from './MainMenu/CoreAndIntegration/Components/User/ShowAllUsers';
import { RoomReservations } from './MainMenu/Workspace/Components/RoomReservations';
import { EmailTemplateTable } from "./MainMenu/CoreAndIntegration/Components/EmailTemplate/ShowAllEmailTemplates";
import { SendEmail } from './MainMenu/CoreAndIntegration/Components/SendEmail/SendEmail';
// import EmailConfirmationPage from './MainMenu/LeadAndCustomer/Components/Leads/EmailConfirmationPage';
import AuditLogTable from './MainMenu/CoreAndIntegration/Components/User/AuditLogTable';
// import { ExpensesPage } from './MainMenu/Billing/Components/expenseManagementSystem/ExpensesPage';
import PricingHomePage from './MainMenu/Billing/Components/Pricing/PricingHomePage';
import PricingSectionPage from './MainMenu/Billing/Components/Pricing/PricingSectionPage';
import { InvoiceManagement } from './MainMenu/Billing/Components/invoice-generation-engine/InvoiceManagement';
import { Collection } from './MainMenu/Billing/Components/invoice-generation-engine/collection';
import PettyCashPage from './MainMenu/Billing/Components/expenseManagementSystem/PettyCashPage';
import { LeadAndCustomer } from './MainMenu/LeadAndCustomer/Components/leadAndCustomer';
import { BookingTable } from './MainMenu/Workspace/Components/bookingTable';
import { UpdateBooking } from './MainMenu/Workspace/Components/updateBooking';
import { Report } from './MainMenu/Workspace/Components/report';
import { AssigmentTable } from './MainMenu/Workspace/Components/assigenmentTable';
import { UpdateAssigenment } from './MainMenu/Workspace/Components/updateAssigenment';
import { AssignmentForm } from './MainMenu/Workspace/Components/assignmentForm';
export const Routing = () => {
    const [vendors, setVendors] = useState<Vendor[]>([]);
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<App />} />
        <Route path="leadAndCustomer" element={<LeadAndCustomer />} />
        <Route path="leadAndCustomer/*" element={<LeadAndCustomerRouting />} />
        <Route path="billing/*" element={<BillingRouting />} />
        <Route path="expenses" element={<ExpenseList />} />
        <Route path="expenses/expense-form" element={<CreateExpenseForm />} />
        <Route path="expenses/expense-form/:id" element={<CreateExpenseForm />} />
        <Route path="/workspaceMap" element={<WorkspaceMap />} />
        <Route path="leadAndCustomer/*" element={<LeadAndCustomerRouting />} />
        <Route path="assignmentForm" element={<AssignmentForm/>} />
        <Route path="assignmentTable" element={<AssigmentTable/>} />
        <Route path="updateAssignment" element={<UpdateAssigenment/>} />
        <Route path="bookings" element={<BookingTable />} />
        <Route path="updateBooking" element={<UpdateBooking />} />
        <Route path="bookingCalendar" element={<BookingCalendar roomId={""} roomName={""} />} />
        <Route path="payments" element={<PaymentForm />} />
        <Route path="vendor" element={<VendorsList vendors={vendors} setVendors={setVendors} />} />
        <Route path="vendors/new" element={<VendorForm vendors={vendors} setVendors={setVendors} />} />
        <Route path="vendors/:id/edit" element={<VendorForm vendors={vendors} setVendors={setVendors} />} />
        {/* <Route path="vendors/:id" element={<VendorSummary vendors={vendors} setVendors={setVendors} />} /> */}
        <Route path="expense-form" element={<CreateExpenseForm />} />
        <Route path="billing/*" element={<Billing />} />
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
        <Route path="/occupancyReports" element={<Report  />} />
        <Route path="/billing/collection" element={< Collection />} />
        <Route path="/petty-cash" element={<PettyCashPage />} />
      </Route>
    </Routes>
  );
};
