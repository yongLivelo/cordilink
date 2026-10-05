create function get_nearby_incidents(
  query_lat float,
  query_lng float,
  radius_meters float,
  query_category text,
  exclude_user_id uuid default null
)
returns table (
  id int8,
  title text,
  category text,
  status report_status,
  location geography,
  location_name text,
  description text,
  image_url text,
  created_at timestamptz,
  distance_meters float,
  lat float,
  lng float
)
language sql
as $$
  select
    incident.id,
    incident.title,
    incident.category,
    incident.status,
    incident.location,
    incident.location_name,
    incident.description,
    incident.image_url,
    incident.created_at,
    ST_Distance(
      incident.location, 
      ST_SetSRID(ST_MakePoint(query_lng, query_lat), 4326)::geography
    ) as distance_meters,
    ST_Y(incident.location::geometry) as lat,
    ST_X(incident.location::geometry) as lng
  from
    incident
  where
    incident.category = query_category
    and (exclude_user_id is null or incident.id not in (
      select incident_id from report where user_id = exclude_user_id
    ))
    and ST_DWithin(
      incident.location,
      ST_SetSRID(ST_MakePoint(query_lng, query_lat), 4326)::geography,
      radius_meters
    )
  order by
    incident.location <-> ST_SetSRID(ST_MakePoint(query_lng, query_lat), 4326)::geography;
$$;