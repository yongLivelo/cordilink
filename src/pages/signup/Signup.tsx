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
import { Link } from "react-router";
import { z } from "zod/v4";

const schema = z.object({
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(1, { message: "You must enter your password" }),
});

export default function Signup() {
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [message, setMessage] = useState<string>("");

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
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setMessage("Check your email for the confirmation link!");
    }

    setIsLoading(false);
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" order={2}>
        Create an Account
      </Title>

      <Text c="dimmed" size="sm" ta="center" mt={5} mb={30}>
        Already have an account?{" "}
        <Anchor component={Link} to="/login" size="sm">
          Login
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
            {message && (
              <Text c="green" size="sm">
                {message}
              </Text>
            )}

            <Button type="submit" fullWidth mt="xl" loading={isLoading}>
              Signup
            </Button>
          </Stack>
        </form>
      </Card>
    </Container>
  );
}
