import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../../Stores/CoreAndIntegration/useAuthStore";
import { LoginWithGoogle } from "./LoginButton";
import { LogoutButton } from "./LogoutButton";
import { LoginWithPassword } from "./LoginWithPassword";

export const AuthenticationScreen = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="flex w-full max-w-4xl bg-white shadow-2xl rounded-2xl overflow-hidden">
    
        <div className="w-1/2 bg-gray-50 flex flex-col items-center justify-center p-10 border-r">
          <img src="/favicon.ico" alt="Logo" className="w-40 mb-6" />
          <p className="text-gray-600 text-center text-lg">
            ברוכים הבאים לקליקה
          </p>
        </div>

  
        <div className="w-1/2 flex flex-col justify-center items-center p-10">
          {isAuthenticated ? (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-6">
                שלום {user?.firstName} {user?.lastName}
              </h1>
              <LogoutButton />
            </div>
          ) : (
            <div className="w-full max-w-sm flex flex-col items-center">
              <h1 className="text-4xl font-extrabold text-gray-900 mb-6 text-center">
                ברוך הבא!
              </h1>
              <p className="text-gray-500 mb-10 text-lg text-center">
                אנא התחבר כדי להמשיך
              </p>

              <div className="flex flex-col gap-6 w-full">
                <LoginWithGoogle />

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">או</span>
                  </div>
                </div>

              
                <div className="w-full">
                  <LoginWithPassword />
                </div>
                
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}