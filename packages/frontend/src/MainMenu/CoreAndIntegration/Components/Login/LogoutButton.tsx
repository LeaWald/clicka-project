import { useAuthStore } from '../../../../Stores/CoreAndIntegration/useAuthStore'; // ודאי שהנתיב נכון
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../../../../Service/Axios';
import { LogOut } from 'lucide-react';

export const LogoutButton = () => {
  const clearAuth = useAuthStore((state) => state.clearUser); // Function that clears the auth state
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/auth/logout'); // Adjust the endpoint as necessary
      console.log('Logout successful');
      clearAuth();
      navigate('/'); // // Or any other page
    } catch (error) {
      console.error('Logout failed:', error);
    }
    //vuelve a la pagina de login 
  };

  return <button onClick={handleLogout}
   style={{
              // backgroundColor: '#2f35e3ff',
              // color: 'white',
              border: 'none',
              padding: '4px 4px',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
            >
              <LogOut size={24} /></button>;
};