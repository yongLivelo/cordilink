import "@mantine/core/styles.css";

import { MantineProvider } from "@mantine/core";
import { BrowserRouter, Route, Routes } from "react-router";
import Layout from "@/layout";
import Home from "@/pages/home";
import SubmitReport from "@/pages/submit-reports";
import MyReports from "@/pages/my-reports";
import CommunityReports from "@/pages/community-reports";
import { Suspense } from "react";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ProctedRoute from "@/components/ProctedRoute";
import AuthProvider from "@/context/AuthContext";
import Dashboard from "@/pages/dashboard";
export default function App() {
  return (
    <AuthProvider>
      <MantineProvider defaultColorScheme="dark">
        <Suspense>
          <BrowserRouter>
            <Routes>
              <Route index path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              <Route
                element={<ProctedRoute allowedRoles={["user", "admin"]} />}
              >
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                </Route>
              </Route>

              <Route element={<ProctedRoute allowedRoles={["user"]} />}>
                <Route element={<Layout />}>
                  <Route path="/submit-reports" element={<SubmitReport />} />
                  <Route path="/my-reports" element={<MyReports />} />
                  <Route
                    path="/community-reports"
                    element={<CommunityReports />}
                  />
                </Route>
              </Route>

              <Route element={<ProctedRoute allowedRoles={["admin"]} />}>
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </Suspense>
      </MantineProvider>
    </AuthProvider>
  );
}
