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

export default function App() {
  return (
    <AuthProvider>
      <MantineProvider defaultColorScheme="dark">
        <Suspense>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* 1. Auth check runs first */}
              <Route element={<ProctedRoute />}>
                {/* 2. Layout is applied to all children of this route */}
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/submit-reports" element={<SubmitReport />} />
                  <Route path="/my-reports" element={<MyReports />} />
                  <Route
                    path="/community-reports"
                    element={<CommunityReports />}
                  />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </Suspense>
      </MantineProvider>
    </AuthProvider>
  );
}
