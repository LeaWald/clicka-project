import { useNavigate, Outlet } from 'react-router-dom';
import { Button } from '../../../Common/Components/BaseComponents/Button';
import { Route, Routes } from 'react-router-dom';
import { FinancialReportsDashboard } from './FinancialReports/FinancialReportsDashboard';


export const Billing = () => {

    const navigate = useNavigate()

    return (
        <div className='billing' style={{ direction: 'rtl' }}>
            <h1>billing</h1>
            <Button variant="primary" size="md" onClick={() => navigate('createInvoice')}>יצירת חשבוניות</Button>
            <Button variant="accent" size="sm" onClick={() => navigate('')}>Back</Button>
            <Outlet />
            <Routes>
                <Route path="*" element={<FinancialReportsDashboard />} />
            </Routes>
        </div>

    );
}

