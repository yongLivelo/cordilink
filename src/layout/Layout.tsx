import Navbar from "@/layout/components/navbar";
import NavbarMobile from "@/layout/components/navbar-mobile/NavbarMobile";
import { AppShell, Box } from "@mantine/core";
import { Outlet, useLocation } from "react-router";

export default function Layout() {
  const location = useLocation();
  const isFullSpan = location.pathname === "/" || location.pathname === "/dashboard";

  return (
    <AppShell
      padding={0}
      navbar={{
        width: { sm: 260, md: 280 },
        breakpoint: "sm",
        collapsed: { mobile: true }, // Hides sidebar on mobile 📱
      }}
      styles={{
        main: {
          backgroundColor: "#F7FAFA",
          minHeight: "100vh",
        },
      }}
    >
      {/* 💻 Desktop: Left Sidebar */}
      <AppShell.Navbar p={0} style={{ borderRight: "1px solid #E5ECEE" }}>
        <Navbar closeOnMobile={() => {}} />
      </AppShell.Navbar>

      {/* 📄 Page Content */}
      <AppShell.Main pb={{ base: 80, sm: 30 }}>
        {isFullSpan ? (
          <Outlet />
        ) : (
          <Box p={{ base: "md", sm: "xl" }} maw={1280} mx="auto">
            <Outlet />
          </Box>
        )}
      </AppShell.Main>

      {/* 📱 Mobile: Bottom Navigation Bar */}
      <Box hiddenFrom="sm">
        <NavbarMobile />
      </Box>
    </AppShell>
  );
}