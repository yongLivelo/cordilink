CREATE OR REPLACE FUNCTION get_nearby_incidents_by_category(
  query_lat double precision,
  query_lng double precision,
  radius_meters double precision,
  query_category text
)
RETURNS TABLE (
  id uuid, /* Change 'uuid' to 'bigint' if your incident ID is an integer */
  title text,
  category text,
  status text,
  distance_meters double precision,
  lat double precision,
  lng double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    incident.id,
    incident.title,
    incident.category,
    incident.status,
    -- Calculate distance in meters
    ST_Distance(
      incident.location, 
      ST_SetSRID(ST_MakePoint(query_lng, query_lat), 4326)::geography
    ) as distance_meters,
    -- Extract lat/lng to return to the frontend
    ST_Y(incident.location::geometry) as lat,
    ST_X(incident.location::geometry) as lng
  FROM
    incident
  WHERE
    -- Filter by the specific category
    incident.category = query_category 
    AND
    -- Filter locations within the radius
    ST_DWithin(
      incident.location,
      ST_SetSRID(ST_MakePoint(query_lng, query_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY
    -- Order by nearest first using the distance operator
    incident.location <-> ST_SetSRID(ST_MakePoint(query_lng, query_lat), 4326)::geography;
END;
$$;