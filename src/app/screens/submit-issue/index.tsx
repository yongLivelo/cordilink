import { CameraView, useCameraPermissions } from "expo-camera";
import { View } from "react-native";
import { Surface, Text, Button, TextInput } from "react-native-paper";

export default function Index() {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Surface style={{ flex: 1 }}>
        <Text>We need your permission to show the camera</Text>
        <Button onPress={requestPermission}>Grant permission</Button>
      </Surface>
    );
  }

  return (
    <Surface style={{ flex: 1, gap: 12, padding: 12 }}>
      <View
        style={{
          width: 360,
          height: 580,
          alignSelf: "center",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <CameraView style={{ flex: 1 }} />
      </View>
      <View>
        <TextInput label="Description" multiline numberOfLines={5} />
      </View>

      <View>
        <Button mode="contained">Submit</Button>
      </View>
    </Surface>
  );
}
