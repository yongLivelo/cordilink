SET local check_function_bodies = off;

CREATE EXTENSION "pg_net" SCHEMA "extensions";

CREATE EXTENSION "postgis" SCHEMA "public";

ALTER TABLE "public"."incident"
  ADD COLUMN "location_name" text NOT NULL;

ALTER TABLE "public"."report"
  ADD COLUMN "location_name" text NOT NULL;

ALTER TABLE "public"."incident"
  ALTER COLUMN "is_community_report" SET NOT NULL;

ALTER TABLE "public"."incident"
  ALTER COLUMN "location" DROP DEFAULT;

ALTER TABLE "public"."incident"
  ALTER COLUMN "location" TYPE public.geography USING "location"::public.geography;

ALTER TABLE "public"."incident"
  ALTER COLUMN "title" DROP NOT NULL;

ALTER TABLE "public"."report"
  ALTER COLUMN "location" DROP DEFAULT;

ALTER TABLE "public"."report"
  ALTER COLUMN "location" TYPE public.geography USING "location"::public.geography;

CREATE OR REPLACE FUNCTION public.get_nearby_incidents (
  query_lat       double precision,
  query_lng       double precision,
  radius_meters   double precision,
  query_category  text,
  exclude_user_id uuid             DEFAULT NULL::uuid
)
  RETURNS TABLE (
    id              bigint,
    title           text,
    category        text,
    status          public.report_status,
    location        public.geography,
    location_name   text,
    description     text,
    image_url       text,
    created_at      timestamp with time zone,
    distance_meters double precision,
    lat             double precision,
    lng             double precision
  )
  LANGUAGE sql
  AS $function$
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
$function$;

CREATE TRIGGER delete_incident_trigger
  AFTER DELETE ON public.report
  FOR EACH ROW
  EXECUTE FUNCTION
    supabase_functions.http_request('https://fssiruzvrclqneveicxm.supabase.co/functions/v1/summarize-incident', 'POST',
    '{"Content-type":"application/json", "Authorization":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzc2lydXp2cmNscW5ldmVpY3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NzM5OTAsImV4cCI6MjEwNjI0OTk5MH0.TcxuMY0HzPttXrTXzNrznc0MXYryMS-MTXMcy3_X580"}', '{}', '1000');

CREATE TRIGGER summarize_incident_trigger
  AFTER INSERT ON public.report
  FOR EACH ROW
  EXECUTE FUNCTION
    supabase_functions.http_request('https://fssiruzvrclqneveicxm.supabase.co/functions/v1/summarize-incident', 'POST',
    '{"Content-type":"application/json", "Authorization":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzc2lydXp2cmNscW5ldmVpY3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NzM5OTAsImV4cCI6MjEwNjI0OTk5MH0.TcxuMY0HzPttXrTXzNrznc0MXYryMS-MTXMcy3_X580"}', '{}', '1000');

ALTER POLICY "allow authenticated crud 1i04aub_0" ON "storage"."objects" TO PUBLIC;

ALTER POLICY "allow authenticated crud 1i04aub_1" ON "storage"."objects" TO PUBLIC;

ALTER POLICY "allow authenticated crud 1i04aub_2" ON "storage"."objects" TO PUBLIC;

ALTER POLICY "allow authenticated crud 1i04aub_3" ON "storage"."objects" TO PUBLIC;

CREATE EVENT TRIGGER "ensure_rls"
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION "public"."rls_auto_enable"();

COMMENT ON EXTENSION "pg_net" IS 'Async HTTP';

COMMENT ON EXTENSION "postgis" IS 'PostGIS geometry and geography spatial types and functions';

GRANT EXECUTE ON FUNCTION "public"."get_nearby_incidents"(double precision, double precision, double precision, text, uuid) TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."get_nearby_incidents"(double precision, double precision, double precision, text, uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_nearby_incidents"(double precision, double precision, double precision, text, uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_nearby_incidents"(double precision, double precision, double precision, text, uuid) TO "service_role";
