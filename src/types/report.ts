export type Report = {
  title: string;
  image_url: string;
  description: string;
  category: string;
  location: string;
  status: "pending" | "in-progress" | "resolved";
};

export type MyReport = {
  id: number;
  type: "my-report";
  report: Report;
  connectedTo?: string;
};

export type CommunityReport = {
  id: number;
  type: "community-report";
  report: Report;
  connectedTo?: string;
  vote: "up" | "down" | "none";
};
