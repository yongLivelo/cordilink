export type Report = {
  report: string;
  image: string;
  description: string;
  category: string;
  location: string;
  status: "pending" | "in-progress" | "resolved";
};

export type MyReport = {
  type: "my-report";
  report: Report;
  connectedTo?: string;
};

export type CommunityReport = {
  type: "community-report";
  report: Report;
  connectedTo?: string;
  vote: "up" | "down" | "none";
};
