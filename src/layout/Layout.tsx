import Navbar from "@/layout/components/navbar";
import { AppShell, Burger, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Outlet } from "react-router";

export default function Layout() {
  const [opened, { toggle }] = useDisclosure();
  const closeOnMobile = () => {
    if (window.innerWidth < 768) {
      toggle();
    }
  };
  return (
    <AppShell
      padding="md"
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !opened, desktop: !opened },
      }}
    >
      <AppShell.Header>
        <Group p="md" h={"100%"} align="center">
          <Burger opened={opened} onClick={toggle} size="sm" />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <Navbar closeOnMobile={closeOnMobile} />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
