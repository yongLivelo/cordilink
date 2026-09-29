import { supabase } from "@/lib/supabaseClient";
import { Button, NavLink, Stack, Modal, Group, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { Link, useLocation } from "react-router";

export default function Navbar({
  closeOnMobile,
}: {
  closeOnMobile: () => void;
}) {
  const location = useLocation();
  const [loading, setLoading] = useState<boolean>(false);
  const [opened, { open, close }] = useDisclosure(false);
  const links = ["submit-reports", "my-reports", "community-reports"];

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    close();
  };

  return (
    <>
      <Modal opened={opened} onClose={close} title="Confirm Logout" centered>
        <Text mb="md">Are you sure you want to log out?</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={close}>
            Cancel
          </Button>
          <Button color="red" onClick={handleLogout} loading={loading}>
            Yes, Logout
          </Button>
        </Group>
      </Modal>

      <Stack justify="space-around">
        <Group>
          <NavLink
            component={Link}
            onClick={closeOnMobile}
            to="/"
            label="Home"
            active={location.pathname === "/"}
          />
          {links.map((link, index) => {
            return (
              <NavLink
                key={index}
                component={Link}
                onClick={closeOnMobile}
                to={`/${link}`}
                label={link
                  .split("-")
                  .map((text) => text.charAt(0).toUpperCase() + text.slice(1))
                  .join(" ")}
                active={location.pathname === `/${link}`}
              />
            );
          })}
        </Group>

        <Group px="md" mt="auto">
          <Button onClick={open} color="red" variant="light" radius="md">
            Logout
          </Button>
        </Group>
      </Stack>
    </>
  );
}
