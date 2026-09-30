SET local check_function_bodies = off;

CREATE TABLE "public"."profiles" (
  "id" uuid NOT NULL,
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."community_reports"
  ALTER COLUMN "created_at" SET NOT NULL;

ALTER TABLE "public"."community_reports"
  ALTER COLUMN "status" SET NOT NULL;

ALTER TABLE "public"."reports"
  ALTER COLUMN "created_at" SET NOT NULL;

ALTER TABLE "public"."reports"
  ALTER COLUMN "status" SET NOT NULL;

ALTER TABLE "public"."votes"
  ALTER COLUMN "community_report_id" SET NOT NULL;

ALTER TABLE "public"."votes"
  ALTER COLUMN "created_at" SET NOT NULL;

CREATE TYPE "public"."role_type" AS ENUM (
  'user',
  'admin'
);

ALTER TABLE "public"."profiles"
  ADD COLUMN "role" public.role_type NOT NULL DEFAULT 'user'::public.role_type;


ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id);

CREATE POLICY "Users can read own profile" ON "public"."profiles"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "anon", "authenticated", "postgres", "service_role";

GRANT USAGE ON TYPE "public"."role_type" TO "postgres";

