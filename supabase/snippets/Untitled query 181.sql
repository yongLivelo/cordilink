create or replace function get_nearby_incidents(
  query_lat float,
  query_lng float,
  radius_meters float
)
returns table (
  id int8,
  title text,
  category text,
  status report_status,
  distance_meters float,
  lat float,
  lng float
)
language sql
as $$
  select
    id,
    title,
    category,
    status,
    -- Calculate distance in meters
    ST_Distance(
      location, 
      ST_SetSRID(ST_MakePoint(query_lng, query_lat), 4326)::geography
    ) as distance_meters,
    -- Extract lat/lng to return to the frontend
    ST_Y(location::geometry) as lat,
    ST_X(location::geometry) as lng
  from
    incident
  where
    -- Filter locations within the radius
    ST_DWithin(
      location,
      ST_SetSRID(ST_MakePoint(query_lng, query_lat), 4326)::geography,
      radius_meters
    )
  order by
    -- Order by nearest first using the distance operator
    location <-> ST_SetSRID(ST_MakePoint(query_lng, query_lat), 4326)::geography;
$$;