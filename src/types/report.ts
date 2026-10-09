export type ReportStatus = "pending" | "in-progress" | "resolved";

export type Report = {
  id: number;
  user_id: string;
  description: string;
  image_url: string;
  location: string;
  incident_id: number;
  created_at: string;
  category: string;
  location_name: string;
};

export type Incident = {
  location_name: string;
  id: number;
  title: string;
  description: string;
  image_url: string;
  location: string;
  created_at: string;
  category: string;
  status: ReportStatus;
  is_community_report: boolean;
  distance_meters: number;
};
