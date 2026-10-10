import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import ProfileModal from "@/components/ProfileModal";
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
import { useState, useEffect } from "react";
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
  const [profileModalOpened, { open: openProfile, close: closeProfile }] = useDisclosure(false);
  const { session, role } = useAuth();

  const [customName, setCustomName] = useState<string>(() => {
    return (
      session?.user?.user_metadata?.full_name ||
      session?.user?.user_metadata?.name ||
      localStorage.getItem("cordilink_custom_name") ||
      ""
    );
  });

  useEffect(() => {
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ name: string }>;
      if (customEvent.detail?.name) {
        setCustomName(customEvent.detail.name);
      } else {
        const stored = localStorage.getItem("cordilink_custom_name");
        if (stored) setCustomName(stored);
      }
    };
    window.addEventListener("cordilink_profile_updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("cordilink_profile_updated", handleProfileUpdate);
    };
  }, []);

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
        </Stack>

        {/* BOTTOM SECTION: USER PROFILE & SESSION */}
        <Stack gap="xs" pt="md" style={{ borderTop: "1px solid #EEF2F4" }}>
          {/* User Info Tile (Clickable to personalize profile) */}
          <Group
            gap="sm"
            p={8}
            style={{
              borderRadius: "10px",
              backgroundColor: "#F8FAFB",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onClick={openProfile}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(2, 127, 141, 0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#F8FAFB";
            }}
            title="Click to personalize your profile name"
          >
            <Avatar
              radius="xl"
              color="teal"
              size="md"
              style={{ backgroundColor: BRAND.teal, color: "#fff", fontWeight: 700 }}
            >
              {(customName || session?.user.email || "U").slice(0, 2).toUpperCase()}
            </Avatar>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size="xs" fw={700} c={BRAND.navy} lineClamp={1}>
                {customName || session?.user.email || "Citizen"}
              </Text>
              <Badge size="xs" variant="outline" color={role === "admin" ? "blue" : "teal"}>
                {role === "admin" ? "Admin" : "Verified Citizen"}
              </Badge>
            </Box>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#A0AEC0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </Group>

          <Button onClick={openLogout} color="red" variant="light" size="xs" radius="md" fullWidth>
            Logout
          </Button>
        </Stack>
      </Box>

      {/* Citizen Profile & Personalization Modal */}
      <ProfileModal opened={profileModalOpened} onClose={closeProfile} />
    </>
  );
}
