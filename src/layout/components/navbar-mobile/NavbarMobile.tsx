import { useAuth } from "@/context/AuthContext";
import { Paper, Group, UnstyledButton, Text } from "@mantine/core";
import { Link, useLocation } from "react-router";

export default function BottomNav() {
    const location = useLocation();
    const { role } = useAuth();
    const BRAND_ORANGE = "#FF3B00"; // CORDILINK Brand Color[span_5](start_span)[span_5](end_span)

    // Map route paths to display names & icons[span_6](start_span)[span_6](end_span)
    const navItems = [
        { label: "Home", path: "/", icon: "🏠" },
        { label: "Community", path: "/community-reports", icon: "📋" },
        { label: "Submit", path: "/submit-reports", icon: "➕", isPrimary: true },
        { label: "My Reports", path: "/my-reports", icon: "💬" },
    ];

    return (
        <Paper
            hiddenFrom="sm" // Only visible on mobile 📱
            shadow="md"
            p="xs"
            style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                borderTop: "1px solid #eee",
            }}
        >
            <Group justify="space-around" align="center">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;

                    // 🟠 Elevated center button for Submit Report[span_7](start_span)[span_7](end_span)
                    if (item.isPrimary) {
                        return (
                            <UnstyledButton
                                key={item.path}
                                component={Link}
                                to={item.path}
                                style={{
                                    backgroundColor: BRAND_ORANGE,
                                    borderRadius: "50%",
                                    width: 52,
                                    height: 52,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginTop: -24, // Elevates the button[span_8](start_span)[span_8](end_span)
                                    boxShadow: "0 4px 10px rgba(255, 59, 0, 0.35)",
                                    color: "#fff",
                                }}
                            >
                                <span style={{ fontSize: 24 }}>{item.icon}</span>
                            </UnstyledButton>
                        );
                    }

                    return (
                        <UnstyledButton
                            key={item.path}
                            component={Link}
                            to={item.path}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                color: isActive ? BRAND_ORANGE : "#888", // Active state color[span_9](start_span)[span_9](end_span)[span_10](start_span)[span_10](end_span)
                            }}
                        >
                            <span style={{ fontSize: 20 }}>{item.icon}</span>
                            <Text size="xs" fw={isActive ? 700 : 500}>
                                {item.label}
                            </Text>
                        </UnstyledButton>
                    );
                })}
            </Group>
        </Paper>
    );
}