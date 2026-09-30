import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/types/role";
import { Loader } from "@mantine/core";
import { Navigate, Outlet } from "react-router";
type ProtectedRouteProps = {
  allowedRoles?: Role[];
};
export default function ProctedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { role, session, loading } = useAuth();

  if (loading) {
    return <Loader color="blue" />;
  }
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }
  return session ? <Outlet /> : <Navigate to="/login" />;
}
