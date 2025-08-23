import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const expiry = localStorage.getItem("token_expiry");
  const isValid = token && expiry && Date.now() < Number(expiry);

  if (!isValid) {
    localStorage.removeItem("token");
    localStorage.removeItem("token_expiry");
    return <Navigate to="/" />;
  }
  return children;
}

export default ProtectedRoute;