import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import {
  Modal,
  Stack,
  Group,
  TextInput,
  Button,
  Avatar,
  Text,
  Badge,
  Box,
  Divider,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";

// Brand Color Palette
const BRAND = {
  orange: "#FF3900",
  navy: "#003953",
  teal: "#027F8D",
};

interface ProfileModalProps {
  opened: boolean;
  onClose: () => void;
}

export default function ProfileModal({ opened, onClose }: ProfileModalProps) {
  const { session, role } = useAuth();

  const [displayName, setDisplayName] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Populate initial name from session metadata or localStorage cache
  useEffect(() => {
    if (opened) {
      const existingName =
        session?.user?.user_metadata?.name ||
        localStorage.getItem("cordilink_custom_name") ||
        (session?.user?.email ? session.user.email.split("@")[0] : "");

      setDisplayName(existingName);
      setError("");
    }
  }, [opened, session]);

  const handleSaveName = async () => {
    const trimmed = displayName.trim();
    if (trimmed.length > 50) {
      setError("Name cannot exceed 50 characters.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      // 1. Update Supabase Auth user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          name: trimmed,
        },
      });

      if (updateError) {
        console.warn("Supabase user update note:", updateError.message);
      }

      // 2. Cache in local storage for instant sync across tabs and reloads
      localStorage.setItem("cordilink_custom_name", trimmed);

      // 3. Dispatch window event for instant reactive UI updates
      window.dispatchEvent(
        new CustomEvent("cordilink_profile_updated", {
          detail: { name: trimmed },
        }),
      );

      // 4. Show success toast notification
      notifications.show({
        title: "Profile Updated",
        message: `Your personalized name is now set to "${trimmed}".`,
        color: "teal",
        autoClose: 3500,
      });

      onClose();
    } catch (err: any) {
      console.error("Error saving profile name:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
  };

  const email = session?.user?.email ?? "citizen@cordilink.gov.ph";
  const initials = displayName
    ? displayName.slice(0, 2).toUpperCase()
    : email.slice(0, 2).toUpperCase();

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs" align="center">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={BRAND.teal}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <Text fw={800} size="md" c={BRAND.navy}>
            Resident Profile & Settings
          </Text>
        </Group>
      }
      centered
      radius="lg"
      styles={{
        header: {
          borderBottom: "1px solid #EEF2F4",
          paddingBottom: "12px",
        },
      }}
    >
      <Stack gap="md" pt="xs">
        {/* Profile Card Header */}
        <Group
          p="md"
          style={{
            backgroundColor: "#F7FAFA",
            borderRadius: "14px",
            border: "1px solid #E2E8F0",
          }}
          gap="md"
          align="center"
        >
          <Avatar
            size="lg"
            radius="xl"
            style={{
              backgroundColor: BRAND.teal,
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "18px",
              boxShadow: "0 3px 10px rgba(2, 127, 141, 0.25)",
            }}
          >
            {initials}
          </Avatar>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text fw={800} size="sm" c={BRAND.navy} lineClamp={1}>
              {displayName || "Cordillera Resident"}
            </Text>
            <Text size="xs" c="dimmed" lineClamp={1}>
              {email}
            </Text>
            <Badge
              size="xs"
              color={role === "admin" ? "blue" : "teal"}
              variant="light"
              mt={4}
            >
              {role === "admin"
                ? "LGU Operations Admin"
                : "Verified Baguio Citizen"}
            </Badge>
          </Box>
        </Group>

        {/* Profile Personalization Section */}
        <Box>
          <Text fw={800} size="sm" c={BRAND.navy} mb={4}>
            Personalize Your Profile Name
          </Text>
          <Text size="xs" c="dimmed" mb="xs" lh={1.4}>
            Set your preferred name or handle. This name will appear on your
            CordiLink Home welcome greeting and civic updates.
          </Text>

          <TextInput
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.currentTarget.value);
              if (error) setError("");
            }}
            placeholder="e.g., Juan Dela Cruz or Resident Juan"
            radius="md"
            size="sm"
            error={error}
            leftSection={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={BRAND.teal}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
            styles={{
              input: {
                fontWeight: 600,
                color: BRAND.navy,
                borderColor: error ? undefined : "#CBD5E0",
                ":focus": {
                  borderColor: BRAND.teal,
                },
              },
            }}
          />

          <Button
            mt="sm"
            fullWidth
            radius="md"
            color="teal"
            style={{ backgroundColor: BRAND.teal }}
            fw={800}
            onClick={handleSaveName}
            loading={isSaving}
            leftSection={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
            }
          >
            Save Profile Name
          </Button>
        </Box>

        <Divider my="xs" />

        {/* Logout Button */}
        <Button
          color="red"
          variant="light"
          fullWidth
          radius="md"
          onClick={handleLogout}
          leftSection={
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          }
        >
          Log Out
        </Button>
      </Stack>
    </Modal>
  );
}
