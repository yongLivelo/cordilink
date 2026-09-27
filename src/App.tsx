import "@mantine/core/styles.css";

import { MantineProvider } from "@mantine/core";
import { BrowserRouter, Link, Route, Routes } from "react-router";
import Layout from "@/layout";
export default function App() {
  return (
    <MantineProvider>
      <Layout>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/submit-reports" element={<SubmitReports />} />
          </Routes>
        </BrowserRouter>
      </Layout>
    </MantineProvider>
  );
}
