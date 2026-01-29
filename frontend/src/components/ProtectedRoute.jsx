import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          authRequired: true,
          from: location.pathname,
        }}
      />
    );
  }

  return children;
}

export default ProtectedRoute;
