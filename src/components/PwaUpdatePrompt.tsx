import { Button, Group, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRegisterSW } from "virtual:pwa-register/react";

/**
 * PWA lifecycle handler.
 *
 * With `registerType: "autoUpdate"` the new service worker activates itself
 * automatically. Instead of the plugin's default hard `location.reload()`,
 * `onNeedReload` lets us show a Mantine prompt so the user decides *when*
 * the app restarts — no surprise reloads mid-form.
 */
export default function PwaUpdatePrompt() {
  useRegisterSW({
    // A new version has been activated and is waiting to take over the page
    onNeedReload: () => {
      notifications.show({
        id: "pwa-update",
        color: "teal",
        title: "Update available",
        withCloseButton: false,
        autoClose: false,
        message: (
          <Group justify="space-between" gap="xs" wrap="nowrap">
            <Text size="sm" style={{ flex: 1 }}>
              A new version of CordiLink is ready.
            </Text>
            <Button
              size="compact-xs"
              radius="md"
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </Group>
        ),
      });
    },
    // First install finished — the app now works without a connection
    onOfflineReady: () => {
      notifications.show({
        id: "pwa-offline",
        title: "Ready to use offline",
        message: "CordiLink can now be opened without an internet connection.",
        autoClose: 4000,
      });
    },
  });

  return null;
}
