import { Box, Button, Group, Image, Stack, Text } from "@mantine/core";
import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";

interface CameraProps {
  onCapture: (base64Image: string) => void;
  onRetake: () => void;
}
export default function Camera({ onCapture, onRetake }: CameraProps) {
  const webcamRef = useRef<Webcam>(null);
  const [imageSrc, setImageSrc] = useState<null | string>(null);
  const [cameraError, setCameraError] = useState<null | string>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const toggleCamera = () => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
  };

  const capture = useCallback(() => {
    const image = webcamRef.current?.getScreenshot();
    if (!image) return;
    setImageSrc(image);
    onCapture(image);
  }, []);

  return (
    <Stack align="center">
      {cameraError ? (
        <Text color="red" fw={500}>
          {cameraError}
        </Text>
      ) : (
        <Box
          w="100%"
          maw={400}
          style={{
            aspectRatio: "4/3",
            backgroundColor: "#2C2E33",
            borderRadius: "8px",
          }}
        >
          {!imageSrc ? (
            <Webcam
              audio={false}
              ref={webcamRef}
              videoConstraints={{ facingMode }}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.4}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "8px",
              }}
              onUserMediaError={(err: string | DOMException) => {
                console.error(`Camera error: ${err}`);
                setCameraError(
                  "Cannot access camera. Please check your browser permissions.",
                );
              }}
            />
          ) : (
            <Image
              src={imageSrc}
              alt="Captured"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
          )}
        </Box>
      )}

      {!cameraError && (
        <>
          {!imageSrc ? (
            <Group>
              <Button onClick={capture}>Take Photo</Button>
              <Button onClick={toggleCamera}>Flip Camera</Button>
            </Group>
          ) : (
            <Button
              onClick={() => {
                setImageSrc(null);
                onRetake();
              }}
              color="red"
            >
              Retake
            </Button>
          )}
        </>
      )}
    </Stack>
  );
}
