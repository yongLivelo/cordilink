import { Box, Button, Group, Image, Stack, Text } from "@mantine/core";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Webcam from "react-webcam";

interface CameraProps {
  onCapture: (base64Image: string) => void;
  onRetake: () => void;
  resetKey: number;
}
export default function Camera({ onCapture, onRetake, resetKey }: CameraProps) {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<null | string>(null);
  const [cameraError, setCameraError] = useState<null | string>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  useEffect(() => {
    setImageSrc(null);
  }, [resetKey]);

  const toggleCamera = () => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
  };

  // Upload from gallery: read the file as base64 and treat it exactly like a capture
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImageSrc(dataUrl);
      onCapture(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const uploadButton = (
    <Button
      onClick={() => fileInputRef.current?.click()}
      color="#003953"
      variant="light"
      radius="md"
      fw={700}
      leftSection={
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      }
    >
      Upload File
    </Button>
  );

  const hiddenFileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      onChange={handleFileSelect}
      style={{ display: "none" }}
    />
  );

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

      {hiddenFileInput}

      {cameraError ? (
        <Group justify="center" gap="sm">
          {uploadButton}
        </Group>
      ) : (
        <>
          {!imageSrc ? (
            <Group justify="center" gap="sm">
              <Button
                onClick={capture}
                color="#FF3900"
                radius="md"
                fw={700}
                leftSection={
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                }
              >
                Take Photo
              </Button>
              <Button
                onClick={toggleCamera}
                color="#027F8D"
                variant="light"
                radius="md"
                fw={700}
                leftSection={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                }
              >
                Flip Camera
              </Button>
              {uploadButton}
            </Group>
          ) : (
            <Button
              onClick={() => {
                setImageSrc(null);
                onRetake();
              }}
              color="red"
              variant="light"
              radius="md"
              fw={700}
              leftSection={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              }
            >
              Retake Photo
            </Button>
          )}
        </>
      )}
    </Stack>
  );
}
