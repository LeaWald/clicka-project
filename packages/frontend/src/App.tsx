import React, { useEffect, useState } from 'react';
import './App.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import { Accesibility } from './Common/Components/BaseComponents/Accesibility';
import MainLayout from './layout/MainLayout';
import { useAuthStore } from './Stores/CoreAndIntegration/useAuthStore';
import { VoiceCommand } from './VoiceAssistant';

function App() {
  const [, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const lang = localStorage.getItem('language') || 'he';
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  }, []);

  useEffect(() => {
    const lang = localStorage.getItem('language') || 'he';
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  }, []);
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/health`)
      .then((response) => {
        if (!response.ok) throw new Error('API server not responding');
        return response.json();
      })
      .then((data) => {
        setHealthStatus(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching API health:', err);
        // setError('Could not connect to API server. Make sure it is running.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!isAuthenticated && location.pathname !== '/auth') {
      navigate('/auth', { replace: true });
    } else if (isAuthenticated && location.pathname === '/auth') {
      navigate('/', { replace: true });
    }
  },[isAuthenticated, navigate, location.pathname]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const showLandingHeader = location.pathname === "/";
  // כדי שיראה לי את דף הבית רק בהתחלה ואז מתי שאני נכנסת למקום כלשהו שימחק 

  return (
    <div className="App">
      <MainLayout /> 
      
      {showLandingHeader && (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="container mx-auto px-6 py-16">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <div className="mb-8">
                <h1 className="text-5xl font-bold text-gray-800 mb-4">Clicka</h1>
                <p className="text-xl text-gray-600 mb-2">מערכת ניהול משרדים משותפים</p>
                <p className="text-lg text-gray-500">פתרון מקיף לניהול חללי עבודה משותפים</p>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              <a href="/leadAndCustomer/customers" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">ניהול לקוחות</h3>
                <p className="text-gray-600 text-sm">מעקב אחר לקוחות, חוזים והיסטוריית פעילות</p>
              </a>

              <a href="/workspaceMap" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">ניהול חללים</h3>
                <p className="text-gray-600 text-sm">הקצאת חללי עבודה ומעקב תפוסה</p>
              </a>

              <a href="/billing" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">חיוב ותשלומים</h3>
                <p className="text-gray-600 text-sm">ניהול חשבוניות, תשלומים ודוחות כספיים</p>
              </a>

              <a href="/occupancyReports" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">דוחות וניתוח</h3>
                <p className="text-gray-600 text-sm">דוחות מפורטים וניתוח נתונים עסקיים</p>
              </a>
            </div>

            {/* Stats Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-gray-800 mb-2">100%</div>
                  <div className="text-gray-600">ניהול דיגיטלי</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-800 mb-2">24/7</div>
                  <div className="text-gray-600">זמינות המערכת</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-800 mb-2">∞</div>
                  <div className="text-gray-600">אפשרויות התאמה</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <VoiceCommand />
      <Accesibility />
      </div>
  );
}

export default App;