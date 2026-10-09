create or replace function get_nearby_incidents(
  query_lat double precision,
  query_lng double precision,
  query_category text,
  query_embedding vector(768),
  radius_meters double precision default 50,
  match_threshold double precision default 0.5,
  exclude_user_id uuid default null
)
returns table (
  id bigint, 
  title text,
  description text,
  category text,
  status text, -- Casted to text for the frontend
  image_url text,
  is_community_report boolean,
  distance_meters double precision,
  lat double precision,
  lng double precision,
  similarity double precision 
)
language plpgsql
as $$
begin
  return query
  select
    i.id,
    i.title,
    i.description,
    i.category,
    i.status::text, -- Cast the custom enum to standard text
    i.image_url,
    i.is_community_report,
    
    ST_Distance(
      i.location, 
      ST_SetSRID(ST_MakePoint(query_lng, query_lat), 4326)::geography
    ) as distance_meters,
    ST_Y(i.location::geometry) as lat,
    ST_X(i.location::geometry) as lng,
    1 - (i.embedding <=> query_embedding) as similarity
  from
    incident i
  where
    i.category = query_category
    and ST_DWithin(
      i.location,
      ST_SetSRID(ST_MakePoint(query_lng, query_lat), 4326)::geography,
      radius_meters
    )
    and (1 - (i.embedding <=> query_embedding)) >= match_threshold
  order by
    (i.embedding <=> query_embedding) asc,
    i.location <-> ST_SetSRID(ST_MakePoint(query_lng, query_lat), 4326)::geography asc
  limit 3;
end;
$$;

-- Force Supabase to reload its cache to recognize the new return table shape
NOTIFY pgrst, 'reload schema';