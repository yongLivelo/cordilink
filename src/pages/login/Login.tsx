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
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { z } from "zod/v4";

// Fixed Zod syntax to match the working Signup schema
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
    <Container size={420} my={40}>
      <Title ta="center" order={2}>
        Welcome Back
      </Title>

      <Text c="dimmed" size="sm" ta="center" mt={5} mb={30}>
        Need an account?{" "}
        <Anchor component={Link} to="/signup" size="sm">
          Sign Up
        </Anchor>
      </Text>

      <Card withBorder shadow="md" p={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="you@email.com"
              withAsterisk
              key={form.key("email")}
              {...form.getInputProps("email")}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              withAsterisk
              key={form.key("password")}
              {...form.getInputProps("password")}
            />

            {errorMessage && (
              <Text c="red" size="sm">
                {errorMessage}
              </Text>
            )}

            <Button type="submit" fullWidth mt="xl" loading={isLoading}>
              Login
            </Button>
          </Stack>
        </form>
      </Card>
    </Container>
  );
}
