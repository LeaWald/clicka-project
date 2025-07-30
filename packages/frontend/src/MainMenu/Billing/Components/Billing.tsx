import { Route, Routes } from 'react-router-dom';
// import '../Css/Billing.css';
import { FinancialReportsDashboard } from './FinancialReports/FinancialReportsDashboard';

export const Billing = () => {

    // const navigate = useNavigate()

    return (
        <Routes>
            <Route path="*" element={<FinancialReportsDashboard />} />

        </Routes>
    )
    // <div className='billing'>
        /* <h1>Billing</h1>
        <Button variant="outlined" onClick={() => { navigate('/') }} sx={{ backgroundColor: 'black', color: 'white', borderColor: 'black', '&:hover': { borderColor: 'white' } }}>Back</Button>

  <FinancialReportsDashboard/> */
    // </div>
}