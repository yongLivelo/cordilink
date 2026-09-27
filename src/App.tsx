import "@mantine/core/styles.css";

import { MantineProvider } from "@mantine/core";
import { BrowserRouter, Route, Routes } from "react-router";
import Layout from "@/layout";
import Home from "@/pages/home";
import SubmitReport from "@/pages/submit-reports";
import MyReports from "@/pages/my-reports";
import CommunityReports from "@/pages/community-reports";
import { Suspense } from "react";

export default function App() {
  return (
    <MantineProvider>
      <Suspense>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/submit-reports" element={<SubmitReport />} />
              <Route path="/my-reports" element={<MyReports />} />
              <Route path="/community-reports" element={<CommunityReports />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </Suspense>
    </MantineProvider>
  );
}
