import { AppShell, Burger } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type { ReactElement } from "react";

export default function Layout({ children }: { children: ReactElement }) {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      padding="md"
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
    >
      <AppShell.Navbar>
        <Navbar />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
