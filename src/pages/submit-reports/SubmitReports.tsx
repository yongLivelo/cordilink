import Camera from "@/pages/submit-reports/components/Camera";
import { Button, NativeSelect, Stack, Textarea } from "@mantine/core";

export default function SubmitReports() {
  return (
    <Stack>
      <Camera />
      <Textarea
        label="Description"
        description="Description of incident"
        placeholder="Input Description"
      ></Textarea>
      <NativeSelect label={"Type of incident"} data={["Road", "Others"]} />
      <Button>Submit</Button>
    </Stack>
  );
}
