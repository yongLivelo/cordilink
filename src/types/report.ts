export type Report = {
  image: string;
  description: string;
  category: string;
  location: string;
  status: "pending" | "in-progress" | "resolved";
};

export type MyReport = {
  report: Report;
  connectedTo?: string;
};

export type CommunityReport = {
  report: Report;
  vote: "up" | "down" | "none";
};
