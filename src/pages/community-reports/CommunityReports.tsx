import { Stack, Loader, Center } from "@mantine/core";
import { useEffect, useState } from "react";
import type { CommunityReport } from "@/types/report";
import ReportCard from "@/components/ReportCard";

const MOCK_COMMUNITY_REPORTS: CommunityReport[] = [
  {
    id: 1,
    type: "community-report",
    report: {
      title: "Broken Streetlight on 5th",
      image_url: "https://placehold.co/400x300?text=Broken+Streetlight",
      description:
        "The streetlight has been flickering for three days, creating a hazard at night.",
      category: "Infrastructure",
      location: "5th Ave & Main St",
      status: "pending",
    },
    connectedTo: "ticket-8821",
    vote: "up",
  },
  {
    id: 1,
    type: "community-report",
    report: {
      title: "Large Pothole",
      image_url: "https://placehold.co/400x300?text=Pothole",
      description:
        "Large pothole in the right lane. Needs immediate filling before winter.",
      category: "Road Hazard",
      location: "Riverside Park",
      status: "in-progress",
    },
    vote: "none",
  },
  {
    id: 1,
    type: "community-report",
    report: {
      title: "Library Graffiti",
      image_url: "https://placehold.co/400x300?text=Graffiti",
      description: "Vandalism on the east wall of the library building.",
      category: "Vandalism",
      location: "Downtown Library",
      status: "resolved",
    },
    connectedTo: "ticket-8850",
    vote: "down",
  },
];

export default function CommunityReportPage() {
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setReports(MOCK_COMMUNITY_REPORTS);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  return (
    <Stack>
      {isLoading ? (
        <Center mt="xl">
          <Loader color="blue" />
        </Center>
      ) : (
        reports.map((reportItem, index) => (
          <ReportCard key={index} report={reportItem} />
        ))
      )}
    </Stack>
  );
}
