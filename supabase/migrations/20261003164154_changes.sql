SET local check_function_bodies = off;

CREATE EXTENSION "postgis" SCHEMA "public";

ALTER TABLE "public"."incident"
  ALTER COLUMN "location" DROP DEFAULT;

ALTER TABLE "public"."incident"
  ALTER COLUMN "location" TYPE public.geography USING "location"::public.geography;

ALTER TABLE "public"."report"
  ALTER COLUMN "location" DROP DEFAULT;

ALTER TABLE "public"."report"
  ALTER COLUMN "location" TYPE public.geography USING "location"::public.geography;

CREATE OR REPLACE FUNCTION public.get_nearby_incidents (
  query_lat     double precision,
  query_lng     double precision,
  radius_meters double precision
)
  RETURNS TABLE (
    id              bigint,
    title           text,
    category        text,
    status          public.report_status,
    distance_meters double precision,
    lat             double precision,
    lng             double precision
  )
  LANGUAGE sql
  AS $function$
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
$function$;

CREATE TRIGGER summarize_incident_trigger
  AFTER INSERT ON public.report
  FOR EACH ROW
  EXECUTE FUNCTION
    supabase_functions.http_request('https://fssiruzvrclqneveicxm.supabase.co/functions/v1/summarize-incident', 'POST',
    '{"Content-type":"application/json", "Authorization":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzc2lydXp2cmNscW5ldmVpY3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NzM5OTAsImV4cCI6MjEwNjI0OTk5MH0.TcxuMY0HzPttXrTXzNrznc0MXYryMS-MTXMcy3_X580"}', '{}', '1000');

CREATE EVENT TRIGGER "ensure_rls"
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION "public"."rls_auto_enable"();

COMMENT ON EXTENSION "postgis" IS 'PostGIS geometry and geography spatial types and functions';

GRANT EXECUTE ON FUNCTION "public"."get_nearby_incidents"(double precision, double precision, double precision) TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."get_nearby_incidents"(double precision, double precision, double precision) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_nearby_incidents"(double precision, double precision, double precision) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_nearby_incidents"(double precision, double precision, double precision) TO "service_role";
