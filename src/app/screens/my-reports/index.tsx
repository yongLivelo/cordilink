import { ExternalPathString, Link } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { Button, Card, Surface, Text } from "react-native-paper";

interface ReportProps {
  image: string;
  title: string;
  description: string;
}

interface MyReportProps extends ReportProps {
  connectedTo?: ExternalPathString;
}

const MOCK_DATA: MyReportProps[] = [
  {
    title: "Large Pothole on Main St",
    description:
      "There is a massive pothole in the right lane that is causing traffic to swerve. It needs immediate patching before it damages tires.",
    image: "https://picsum.photos/seed/pothole/700/400",
    connectedTo: "https://picsum.photos/seed/pothole/700/400",
  },
  {
    title: "Broken Streetlight",
    description:
      "The streetlight at the corner of Elm and Maple has been out for 3 days. It is very dark and unsafe for pedestrians at night.",
    image: "https://picsum.photos/seed/light/700/400",
  },
  {
    title: "Fallen Tree Branch",
    description:
      "A recent storm knocked down a large branch blocking the sidewalk near the community park entrance.",
    image: "https://picsum.photos/seed/tree/700/400",
  },
];

export default function Index() {
  const [reports, setReports] = useState<MyReportProps[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      setTimeout(() => {
        setReports(MOCK_DATA);
      }, 1000);
    };

    fetchReports();
  }, []);

  return (
    <Surface style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 12, gap: 16 }}>
        {reports.map((report, index) => (
          <Report
            key={index}
            title={report.title}
            image={report.image}
            connectedTo={report.connectedTo}
            description={report.description}
          />
        ))}

        {reports.length === 0 && (
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            Loading reports...
          </Text>
        )}
      </ScrollView>
    </Surface>
  );
}

function Report({ image, title, description, connectedTo }: MyReportProps) {
  return (
    <Card elevation={3}>
      <Card.Title title={title} />

      <Card.Cover style={{ marginHorizontal: 12 }} source={{ uri: image }} />

      <Card.Content style={{ marginTop: 16, gap: 12 }}>
        <Text variant="bodyMedium">{description}</Text>
        {connectedTo && (
          <Text variant="labelSmall">
            connected to{" "}
            <Link
              href={connectedTo}
              style={{ color: "lightblue", textDecorationLine: "underline" }}
            >
              {connectedTo}
            </Link>
          </Text>
        )}
      </Card.Content>

      <Card.Actions>
        <Button>Edit</Button>
        <Button>Delete</Button>
      </Card.Actions>
    </Card>
  );
}
