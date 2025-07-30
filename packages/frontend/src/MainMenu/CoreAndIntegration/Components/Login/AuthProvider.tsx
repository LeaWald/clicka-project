import {  ReactNode, useCallback, useEffect } from "react";
import { useAuthStore } from "../../../../Stores/CoreAndIntegration/useAuthStore";
import axios from "axios";
import { axiosInstance } from "../../../../Service/Axios";
import { showAlert } from "../../../../Common/Components/BaseComponents/ShowAlert";


interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { setUser, clearUser, setLoading, setSessionId, user } = useAuthStore();
  const verifyFunction = useCallback(async () => {
    try {
      setLoading(true);
      let res = await axiosInstance.get("/auth/verify");
      if (res.status === 200) {
        console.log("Authenticated successfully");
        const data = res.data;
        console.log("User data in authProvider:", data);
        setUser(data.user.user);
        setSessionId(data.user.sessionId);
        return;
      }
      clearUser();
        // navigate("/auth");
    }
    catch (err: any) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        const data = err.response.data;
        if (data.error === 'TokenExpired') {
          console.log(" Token expired, trying to refresh...");
          try {
            const refreshRes = await axiosInstance.post("/auth/refresh");
            if (refreshRes.status === 200) {
              console.log("Refresh token success");
              const res = await axiosInstance.get("/auth/verify");
              if (res.status === 200) {
                const data = res.data;
                setUser(data.user.user);
                return;
              }
            }
          } catch (refreshErr) {
            console.warn(" Refresh token failed", refreshErr);
              //redirect al login y despues a la de clika 
          }
        }
      }
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        console.warn("Session ID mismatch - logging out.");
        showAlert("", "התחברת ממכשיר אחר , אנא התחבר שוב!", "error");
        clearUser();
          //redirect al login y despues a la de clika 
      }

        clearUser();
        // navigate("/auth");

    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading, clearUser, setSessionId]);

  useEffect(() => {
    const checkAuth = async () => {
      verifyFunction();
    };
    checkAuth();
  }, [verifyFunction]);
  //check session every 30 seconds to check if the session is still valid and same as the one in the store
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (user != null) {
      interval = setInterval(async () => {
        verifyFunction();
      }, 30000); // כל 30 שניות
    }
    return () => {
      if (interval) clearInterval(interval); // cleanup when component unmounts
    };
  }, [user, verifyFunction]);

  return <>
    {/* {user == null && <GoogleOneTap />} */}
    {children}</>

}