import { useEffect } from 'react';
import TopNav from './TopNav/TopNav';
import { Outlet, useNavigate } from 'react-router-dom';
const shortcutMap: Record<string, string> = {
    '0': '/',
    '1': '/leadAndCustomer',
    '2': '/workspaceMap',
    '3': '/billing',
    '4': '/occupancyReports',
    '5': '/users',
    '6': '/emailTemplates',
};
const MainLayout = () => {
    const navigate = useNavigate();
    useEffect(() => {
        const handleKeydown = (e: KeyboardEvent) => {
            if (e.altKey && shortcutMap[e.key]) {
                e.preventDefault();
                navigate(shortcutMap[e.key]);
            }
        };
        window.addEventListener('keydown', handleKeydown);
        return () => {
            window.removeEventListener('keydown', handleKeydown);
        };
    }, [navigate]);
    return (
        <>
            <TopNav />
            <Outlet />
        </>
    );
};
export default MainLayout;
