import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import { BrowserRouter } from 'react-router-dom';
import { Routing } from './routing';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './Common/Components/themeConfig';
import { LangContext } from './Common/Service/langContext';
import { AuthProvider } from './MainMenu/CoreAndIntegration/Components/Login/AuthProvider';

function Root() {
  const [lang, setLang] = useState<"HE" | "EN">("HE");

  return (
    <React.StrictMode>
      <ThemeProvider>
        <LangContext.Provider value={lang=== "HE" ? "he" : "en"}>
          <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID!}>
            <BrowserRouter>
              <AuthProvider>

                <div className="p-4 gap-4 items-start">
                  {/* כפתורי שפה מעוצבים */}
                  <div className="fixed bottom-20 right-4 z-5">
                      <button
                       className="px-4 py-1 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 bg-gradient-to-b from-white to-gray-100 shadow-sm hover:shadow-md transition"
                        onClick={() => {
                          const nextLang = lang === "HE" ? "EN" : "HE";
                          setLang(nextLang);
                          console.log("Language switched to:", nextLang);
                        }}
                      >
                        {lang === "HE" ? "HE" : "EN"}
                      </button>
                  </div>
                  {/* הראוטינג עצמו */}
                  <Routing />
                </div>
              </AuthProvider>

            </BrowserRouter>
          </GoogleOAuthProvider>
        </LangContext.Provider>
      </ThemeProvider>
    </React.StrictMode>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<Root />);