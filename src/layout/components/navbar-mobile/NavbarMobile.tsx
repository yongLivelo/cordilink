import { useAuth } from "@/context/AuthContext";
import { Paper, Group, UnstyledButton, Text } from "@mantine/core";
import { Link, useLocation } from "react-router";

export default function BottomNav() {
  const location = useLocation();
  const { role } = useAuth();
  const BRAND_ORANGE = "#FF3900";

  // For Admin accounts: only the Dashboard is displayed on screen — no citizen tabs
  if (role === "admin") {
    return null;
  }

  return (
    <Paper
      hiddenFrom="sm" // Only visible on mobile 📱
      shadow="lg"
      p="xs"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderTop: "1px solid #EDEDED",
        backgroundColor: "#ffffff",
      }}
    >
      <Group justify="space-around" align="center">
        {/* 1. HOME */}
        <UnstyledButton
          component={Link}
          to="/"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            color: location.pathname === "/" ? BRAND_ORANGE : "#888",
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill={location.pathname === "/" ? BRAND_ORANGE : "none"}
            stroke={location.pathname === "/" ? BRAND_ORANGE : "#888"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <Text size="xs" fw={location.pathname === "/" ? 700 : 500} mt={2}>
            Home
          </Text>
        </UnstyledButton>

        {/* 2. COMMUNITY */}
        <UnstyledButton
          component={Link}
          to="/community-reports"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            color: location.pathname === "/community-reports" ? BRAND_ORANGE : "#888",
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke={location.pathname === "/community-reports" ? BRAND_ORANGE : "#888"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <Text size="xs" fw={location.pathname === "/community-reports" ? 700 : 500} mt={2}>
            Community
          </Text>
        </UnstyledButton>

        {/* 3. CENTER SUBMIT BUTTON */}
        <UnstyledButton
          component={Link}
          to="/submit-reports"
          aria-label="Submit a Report"
          style={{
            backgroundColor: BRAND_ORANGE,
            borderRadius: "50%",
            width: 54,
            height: 54,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: -26,
            boxShadow: "0 6px 16px rgba(255, 57, 0, 0.45)",
            color: "#fff",
            border: "4px solid #fff",
          }}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </UnstyledButton>

        {/* 4. MY REPORTS */}
        <UnstyledButton
          component={Link}
          to="/my-reports"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            color: location.pathname === "/my-reports" ? BRAND_ORANGE : "#888",
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke={location.pathname === "/my-reports" ? BRAND_ORANGE : "#888"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <line x1="12" y1="8" x2="12" y2="14" />
            <line x1="9" y1="11" x2="15" y2="11" />
          </svg>
          <Text size="xs" fw={location.pathname === "/my-reports" ? 700 : 500} mt={2}>
            My Reports
          </Text>
        </UnstyledButton>
      </Group>
    </Paper>
  );
}