import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
  const token = localStorage.getItem("token");

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {}

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (user?.szerepkor !== "admin") {
    return <Navigate to="/home" replace />;
  }

  return children;
}

export default AdminRoute;