import { Navigate, Outlet, useLocation } from "react-router-dom"
import { getRoleHome, useAuth } from "../context/AuthContext.jsx"

export function ProtectedRoute({ allowedRoles }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleHome(user.role)} replace />
  }

  return <Outlet />
}
