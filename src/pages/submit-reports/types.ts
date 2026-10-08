/**
 * Everything captured by the submit form, held while the user decides whether
 * the report belongs to a nearby incident or needs a brand new one.
 */
export type ReportDraft = {
  lat: number;
  lng: number;
  category: string;
  locationName?: string;
  imageUrl: string;
  description: string;
  locationPoint: string;
};

/** The row inserted into the `report` table once the incident is known. */
export type ReportPayload = {
  userId: string;
  description: string;
  imageUrl: string;
  category: string;
  incidentId: string | number;
  locationPoint: string;
  locationName?: string;
};
