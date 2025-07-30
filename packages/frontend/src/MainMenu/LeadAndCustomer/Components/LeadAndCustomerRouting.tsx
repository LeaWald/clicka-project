import { Route, Routes, useNavigate } from "react-router-dom";
import { LeadAndCustomer } from "./leadAndCustomer";
import { ContractManagement } from "./Contracts/contractManagement";
import { ContractDetails } from "./Contracts/contractDetails";
import { CustomerDashboard } from "./Customers/customerDashboard";
import { InterestedCustomerRegistration } from "./Leads/interestedCustomerRegistration";
import { UpdateCustomer } from "./Customers/updateCustomer";
import { CustomerStatusChanged } from "./Customers/CustomerStatusChanged";
import { CustomersList } from "./Customers/customersList"
import { LeadInteractions } from "./Interactions/leadIntersection";
import { InteractionForm } from "./Interactions/interactionForm";
import { useLeadsStore } from "../../../Stores/LeadAndCustomer/leadsStore";
import { Lead } from "shared-types";
import { NewCustomerPage } from "./Customers/newCustomer";
import { EditContract } from "./Contracts/editContract";
import { AddContract } from "./Contracts/addContract";
import { LeadForm } from "./Leads/leadForm";
import ClientSearchAndSelect from "./upload";
import LeadSourcesPieChart from "./Leads/LeadSourcesPieChart";

export const LeadAndCustomerRouting = () => {
    const nav = useNavigate()
    const {
        handleCreateInteraction
    } = useLeadsStore();
    return (
        <Routes>
            <Route path="/" element={<LeadAndCustomer />} />
            <Route path="customers" element={<CustomersList />} />
            <Route path="customers/update" element={<UpdateCustomer />} />
            <Route path="customers/new" element={<NewCustomerPage />} />
            <Route path="leads/LeadSourcesPieChart" element={<LeadSourcesPieChart />} />
            {/* <Route path="customers/:customerId" element={<CustomerDetails />} /> */}
            <Route path="customers/updateStatus/:customerId" element={<CustomerStatusChanged />} />
            <Route path="customers/:customerId/contract" element={<ContractDetails />} />
            <Route path="customers/:customerId/dashboard" element={<CustomerDashboard />} />
            <Route path="contracts" element={<ContractManagement />} />
            <Route path="contracts/:customerId" element={<ContractDetails />} />
            <Route path="contracts/new" element={<AddContract />} />
            <Route path="leads" element={<LeadInteractions />} />
            <Route path="leads/newLead" element={<LeadForm/>} />
            <Route path="contracts/customer/:customerId" element={<ContractDetails />} />
            <Route path="contracts/addContract" element={<AddContract/>} />
            <Route path="contracts/edit/:contractId" element={<EditContract />} />
            {/* <Route path="leads/:leadId" element={<DetailsOfTheLead />} /> */}
            <Route path="customer/upload" element={<ClientSearchAndSelect />} />
            <Route path="leads/interestedCustomerRegistration" element={<InterestedCustomerRegistration />} />
            <Route path="leads/:leadId/addInteraction" element={<InteractionForm onSubmit={(lead: Lead) => handleCreateInteraction(lead)} onCancel={() => {
                nav('/leadAndCustomer/leads')
            }} />} />
        </Routes>
    );
};