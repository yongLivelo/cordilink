import { useAuth } from "@/context/AuthContext";
import { Loader } from "@mantine/core";
import { Navigate, Outlet } from "react-router";

export default function ProctedRoute() {
  const { session, loading } = useAuth();

  if (loading) {
    return <Loader color="blue" />;
  }

  return session ? <Outlet /> : <Navigate to="/login" />;
}
