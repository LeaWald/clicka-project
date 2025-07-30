import { useNavigate } from 'react-router-dom';
import { Button } from '../../../Common/Components/BaseComponents/Button';
// import '../Css/leadAndCustomer.css'

//!!אין צורך בעמוד הזה

export const LeadAndCustomer = () => {

    const navigate = useNavigate()

    return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8 rounded-lg shadow-lg gap-6">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Lead & Customer</h1>
        <Button variant="primary" size="md" onClick={() => navigate('leads')}>מתעניינים</Button>
        <Button variant="primary" size="md" onClick={() => navigate('customers')}>לקוחות</Button>
        <Button variant="secondary" size="md" onClick={() => navigate('/customerHistory/customers')}>היסטוריית לקוחות</Button>
        <Button variant="primary" size="md" onClick={() => navigate('contractManagement')}>חוזים</Button>
        {/* <Button variant="accent" size="sm" onClick={() => navigate('/')}>Back</Button> */}
    </div>
}