import Navbar from "@/layout/components/navbar";
import { AppShell, Burger } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type { ReactElement } from "react";

export default function Layout({ children }: { children: ReactElement }) {
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
        <Burger opened={opened} onClick={toggle} size="sm" />
      </AppShell.Header>

      <AppShell.Navbar>
        <Navbar closeOnMobile={closeOnMobile} />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
