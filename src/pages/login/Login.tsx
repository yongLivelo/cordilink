import { supabase } from "@/lib/supabaseClient";
import {
  Button,
  Stack,
  Text,
  TextInput,
  PasswordInput,
  Container,
  Card,
  Title,
  Anchor,
  Image,
  Box,
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { z } from "zod/v4";

// CordiLink Branding Palette
const BRAND = {
  orange: "#FF3900", // Call-to-action buttons
  navy: "#003953", // Headings and high-contrast text
  teal: "#027F8D", // Links, highlights, and secondary accents
};

const schema = z.object({
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(1, { message: "You must enter your password" }),
});

export default function Login() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      email: "",
      password: "",
    },
    validate: schemaResolver(schema, { sync: true }),
  });

  const handleSubmit = async (values: typeof form.values) => {
    setIsLoading(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
    } else {
      navigate("/");
    }
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F4F7F6",
      }}
      px={{ base: "md", sm: "lg" }}
      py="xl"
    >
      <Container size={420} w="100%" p={0}>
        {/* BRANDING HEADER: Logo + Brand Identity */}
        <Stack align="center" gap="xs" mb="lg">
          <Image
            src="/Cordilink_logo.svg"
            alt="CordiLink Logo"
            w={{ base: 64, sm: 80 }}
            fit="contain"
          />
          <Title order={1} size="h2" fw={900} c={BRAND.navy} ta="center">
            CordiLink
          </Title>
          <Text size="sm" c="dimmed" ta="center">
            Empowering residents to reach proper authorities instantly.
          </Text>
        </Stack>

        {/* LOGIN CARD */}
        <Card withBorder shadow="sm" radius="lg" p={{ base: "md", sm: "xl" }}>
          <Title order={3} size="h3" fw={700} c={BRAND.navy} mb="xs">
            Welcome Back
          </Title>

          <Text size="sm" c="dimmed" mb="lg">
            Need an account?{" "}
            <Anchor
              component={Link}
              to="/signup"
              size="sm"
              fw={600}
              c={BRAND.teal}
            >
              Sign Up
            </Anchor>
          </Text>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput
                label="Email"
                placeholder="you@email.com"
                withAsterisk
                radius="md"
                size="md"
                key={form.key("email")}
                {...form.getInputProps("email")}
              />

              <PasswordInput
                label="Password"
                placeholder="Your password"
                withAsterisk
                radius="md"
                size="md"
                key={form.key("password")}
                {...form.getInputProps("password")}
              />

              {errorMessage && (
                <Text c="red" size="sm">
                  {errorMessage}
                </Text>
              )}

              <Button
                type="submit"
                fullWidth
                size="md"
                radius="md"
                mt="md"
                loading={isLoading}
                color={BRAND.orange}
              >
                Log In
              </Button>
            </Stack>
          </form>
        </Card>
      </Container>
    </Box>
  );
}
