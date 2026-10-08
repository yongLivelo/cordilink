import Navbar from "@/layout/components/navbar";
import NavbarMobile from "@/layout/components/navbar-mobile/NavbarMobile";
import { AppShell, Box } from "@mantine/core";
import { Outlet } from "react-router";

export default function Layout() {
  return (
      <AppShell
          padding="md"
          navbar={{
            width: 280,
            breakpoint: "sm",
            collapsed: { mobile: true }, // 1. Hides sidebar on mobile 📱
          }}
      >
        {/* 💻 Desktop: Left Sidebar */}
        <AppShell.Navbar p="md">
          <Navbar closeOnMobile={() => {}} />
        </AppShell.Navbar>

        {/* 📄 Page Content */}
        <AppShell.Main pb={80}>
          <Outlet />
        </AppShell.Main>

        {/* 📱 Mobile: Bottom Navigation Bar */}
        <Box hiddenFrom="sm">
          <NavbarMobile />
        </Box>
      </AppShell>
  );
}