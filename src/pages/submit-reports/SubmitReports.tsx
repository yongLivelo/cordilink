import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Button, Group, Stack, Image, Text } from "@mantine/core";

export default function SubmitReports() {
  const webcamRef = useRef<Webcam>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const [cameraError, setCameraError] = useState<string | null>(null);

  // Capture the photo as a base64 string
  const capture = useCallback(() => {
    const image = webcamRef.current?.getScreenshot();
    if (image) {
      setImageSrc(image);
    }
  }, [webcamRef]);

  // Toggle between front and back camera
  const toggleCamera = () => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
  };

  return (
    <Stack align="center" gap="md">
      {!imageSrc ? (
        <>
          {cameraError ? (
            <Text c="red" fw={500}>
              {cameraError}
            </Text>
          ) : (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode }}
              style={{ width: "100%", maxWidth: "400px", borderRadius: "8px" }}
              // FIXED: Added error handler to catch permission/hardware issues
              onUserMediaError={(err: string | DOMException) => {
                console.error("Camera Error:", err);
                setCameraError(
                  "Cannot access camera. Please check your browser permissions.",
                );
              }}
            />
          )}
          <Group>
            <Button onClick={capture} color="blue" disabled={!!cameraError}>
              Take Photo
            </Button>
            <Button onClick={toggleCamera} variant="light">
              Switch Camera
            </Button>
          </Group>
        </>
      ) : (
        <>
          {/* Captured Image Preview */}
          <Text fw={500}>Photo Captured:</Text>
          <Image
            src={imageSrc}
            alt="Captured"
            style={{ width: "100%", maxWidth: "400px", borderRadius: "8px" }}
          />
          <Group>
            <Button onClick={() => setImageSrc(null)} color="red">
              Retake
            </Button>
            <Button color="green">Submit Report</Button>
          </Group>
        </>
      )}
    </Stack>
  );
}
