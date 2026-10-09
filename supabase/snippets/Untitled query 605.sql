create or replace function get_nearby_incidents(
  query_lat double precision,
  query_lng double precision,
  query_embedding vector(768),
  query_category text default null,
  query_is_community_report boolean default null, -- Added new optional parameter
  radius_meters double precision default 50,
  match_threshold double precision default null,
  exclude_user_id uuid default null
)
returns table (
  id bigint, 
  title text,
  description text,
  category text,
  status text, 
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
    i.status::text,
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
    -- 1. Optional Category filter
    (query_category is null or i.category = query_category)
    
    -- 2. Optional Community Report filter
    and (query_is_community_report is null or i.is_community_report = query_is_community_report)
    
    -- 3. Strict Radius filter
    and ST_DWithin(
      i.location,
      ST_SetSRID(ST_MakePoint(query_lng, query_lat), 4326)::geography,
      radius_meters
    )
    
    -- 4. Optional AI Similarity Threshold filter
    and (match_threshold is null or (1 - (i.embedding <=> query_embedding)) >= match_threshold)
    
  order by
    (i.embedding <=> query_embedding) asc,
    i.location <-> ST_SetSRID(ST_MakePoint(query_lng, query_lat), 4326)::geography asc
  limit 3;
end;
$$;

-- Force the API cache to update so your frontend recognizes the new parameter
NOTIFY pgrst, 'reload schema';