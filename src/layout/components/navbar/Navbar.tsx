import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import {
  Button,
  Stack,
  Modal,
  Group,
  Text,
  Avatar,
  Box,
  Image,
  Badge,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { Link, useLocation } from "react-router";

// Brand Color Palette
const BRAND = {
  orange: "#FF3900",
  navy: "#003953",
  teal: "#027F8D",
};

export default function Navbar({
  closeOnMobile,
}: {
  closeOnMobile: () => void;
}) {
  const location = useLocation();
  const [loading, setLoading] = useState<boolean>(false);
  const [logoutModalOpened, { open: openLogout, close: closeLogout }] = useDisclosure(false);
  const [emergencyModalOpened, { open: openEmergency, close: closeEmergency }] = useDisclosure(false);
  const { session, role } = useAuth();

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    closeLogout();
  };

  // For Admin accounts: only the Dashboard is visible in the navigation!
  const navLinks = role === "admin"
    ? [
        {
          label: "Incident Dashboard",
          path: "/dashboard",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
          ),
        },
      ]
    : [
        {
          label: "Home",
          path: "/",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          ),
        },
        {
          label: "Submit Report",
          path: "/submit-reports",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          ),
          highlight: true,
        },
        {
          label: "My Reports",
          path: "/my-reports",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <line x1="12" y1="8" x2="12" y2="14" />
              <line x1="9" y1="11" x2="15" y2="11" />
            </svg>
          ),
        },
        {
          label: "Community Reports",
          path: "/community-reports",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ),
        },
      ];

  return (
    <>
      {/* 1. LOGOUT CONFIRMATION MODAL */}
      <Modal opened={logoutModalOpened} onClose={closeLogout} title="Confirm Logout" centered radius="md">
        <Text size="sm" mb="lg">
          Are you sure you want to log out of CordiLink?
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeLogout} radius="md">
            Cancel
          </Button>
          <Button color="red" onClick={handleLogout} loading={loading} radius="md">
            Yes, Logout
          </Button>
        </Group>
      </Modal>

      {/* 2. EMERGENCY 911 CONFIRMATION MODAL */}
      <Modal
        opened={emergencyModalOpened}
        onClose={closeEmergency}
        title={
          <Group gap="xs">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <Text fw={800} c="#D32F2F">Emergency Services Confirmation</Text>
          </Group>
        }
        centered
        radius="md"
      >
        <Text size="sm" mb="md" lh={1.5}>
          You are about to dial <strong>911 Emergency Services</strong> for Baguio City.
        </Text>
        <Text size="xs" c="dimmed" mb="lg">
          Please confirm that this is an urgent life-threatening emergency (medical, fire, or crime). CordiLink reports are strictly for non-emergency civic hazards.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeEmergency} radius="md">
            Cancel
          </Button>
          <Button
            component="a"
            href="tel:911"
            color="red"
            radius="md"
            onClick={closeEmergency}
            leftSection={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            }
          >
            Confirm & Call 911
          </Button>
        </Group>
      </Modal>

      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          backgroundColor: "#ffffff",
          justifyContent: "space-between",
          padding: "20px 16px",
        }}
      >
        {/* TOP SECTION: BRAND HEADER & NAVIGATION */}
        <Stack gap="xl">
          {/* Brand Header */}
          <Group gap="xs" align="center" px={8}>
            <Image
              src="/Cordilink_logo.svg"
              alt="CordiLink Logo"
              w={36}
              fit="contain"
            />
            <Box>
              <Text fw={900} size="lg" c={BRAND.navy} lh={1.1}>
                CordiLink
              </Text>
              <Text size="10px" fw={700} c={BRAND.teal} tt="uppercase" style={{ letterSpacing: "1px" }}>
                CIVIC RESILIENCE
              </Text>
            </Box>
          </Group>

          {/* Navigation Links */}
          <Stack gap={6}>
            <Text size="11px" fw={800} c="dimmed" tt="uppercase" px={10} style={{ letterSpacing: "0.5px" }}>
              Main Navigation
            </Text>
            {navLinks.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <UnstyledButton
                  key={item.path}
                  component={Link}
                  to={item.path}
                  onClick={closeOnMobile}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: "14px",
                    color: isActive ? BRAND.teal : "#4A5568",
                    backgroundColor: isActive ? "rgba(2, 127, 141, 0.08)" : "transparent",
                    borderLeft: isActive ? `3px solid ${BRAND.teal}` : "3px solid transparent",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "rgba(0, 57, 83, 0.04)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <Box style={{ color: isActive ? BRAND.teal : "#718096", display: "flex", alignItems: "center" }}>
                    {item.icon}
                  </Box>
                  <Text size="sm" fw={isActive ? 700 : 500} style={{ flex: 1 }}>
                    {item.label}
                  </Text>
                  {item.highlight && (
                    <Badge size="xs" color="orange" variant="light">
                      NEW
                    </Badge>
                  )}
                </UnstyledButton>
              );
            })}
          </Stack>

          {/* Quick Emergency 911 Call Card with Confirmation */}
          <Box
            p="md"
            style={{
              backgroundColor: "#FFF4F3",
              border: "1px solid #FFD8D4",
              borderRadius: "12px",
            }}
          >
            <Group justify="space-between" align="center" mb={6}>
              <Text size="xs" fw={800} c={BRAND.orange} tt="uppercase">
                Emergency Hotline
              </Text>
              <Badge size="xs" color="red" variant="filled">
                911
              </Badge>
            </Group>
            <Text size="xs" c="dimmed" mb="xs">
              Immediate medical, fire, or police support.
            </Text>
            <Button
              onClick={openEmergency}
              fullWidth
              size="xs"
              color={BRAND.orange}
              radius="md"
              fw={700}
              leftSection={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              }
            >
              Call 911
            </Button>
          </Box>
        </Stack>

        {/* BOTTOM SECTION: USER PROFILE & SESSION */}
        <Stack gap="xs" pt="md" style={{ borderTop: "1px solid #EEF2F4" }}>
          {/* User Info Tile */}
          <Group gap="sm" p={8} style={{ borderRadius: "8px", backgroundColor: "#F8FAFB" }}>
            <Avatar
              radius="xl"
              color="teal"
              size="md"
              style={{ backgroundColor: BRAND.teal, color: "#fff", fontWeight: 700 }}
            >
              {session?.user.email?.slice(0, 2).toUpperCase() ?? "U"}
            </Avatar>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size="xs" fw={700} c={BRAND.navy} lineClamp={1}>
                {session?.user.email ?? "Citizen"}
              </Text>
              <Badge size="xs" variant="outline" color={role === "admin" ? "blue" : "teal"}>
                {role === "admin" ? "Admin" : "Verified Citizen"}
              </Badge>
            </Box>
          </Group>

          <Button onClick={openLogout} color="red" variant="light" size="xs" radius="md" fullWidth>
            Logout
          </Button>
        </Stack>
      </Box>
    </>
  );
}
