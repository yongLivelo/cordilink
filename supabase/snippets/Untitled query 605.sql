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
    -- Filter by the specific category
    category = query_category
    and
    -- Filter locations within the radius
    ST_DWithin(
      location,
      ST_SetSRID(ST_MakePoint(query_lng, query_lat), 4326)::geography,
      radius_meters
    )
  order by
    -- Order by nearest first using the distance operator
    location <-> ST_SetSRID(ST_MakePoint(query_lng, query_lat), 4326)::geography;