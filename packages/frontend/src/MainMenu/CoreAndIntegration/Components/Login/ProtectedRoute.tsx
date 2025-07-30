import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../../../Stores/CoreAndIntegration/useAuthStore";
import { ReactElement } from "react";

interface ProtectedRouteProps {
  children: ReactElement;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuthStore();


//אם הוא לא רשום עובר להירשם 
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  //אם הכל בסדר מביא לי את כל הקומפוננטות 
  return children;
};
