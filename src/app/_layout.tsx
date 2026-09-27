import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme } from "react-native";
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from "react-native-paper";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? MD3DarkTheme : MD3LightTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <Drawer
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.onSurface,

            drawerStyle: {
              backgroundColor: theme.colors.surface,
            },
            drawerActiveTintColor: theme.colors.primary,
            drawerActiveBackgroundColor: theme.colors.primaryContainer,
            drawerInactiveTintColor: theme.colors.onSurfaceVariant,
          }}
        >
          <Drawer.Screen
            name="index"
            options={{ drawerLabel: "Home", title: "Overview" }}
          />
          <Drawer.Screen
            name="screens/community-board/index"
            options={{
              drawerLabel: "Community Board",
              title: "Community Board",
            }}
          />
          <Drawer.Screen
            name="screens/my-reports/index"
            options={{ drawerLabel: "My Reports", title: "My Reports" }}
          />
          <Drawer.Screen
            name="screens/submit-issue/index"
            options={{ drawerLabel: "Submit Issue", title: "Submit Issue" }}
          />
        </Drawer>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
