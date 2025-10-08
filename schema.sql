


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "unaccent" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."set_unique_member_slug"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 2;
BEGIN
  -- Generate base slug: "firstname_lastname"
  base_slug := slugify(NEW.firstname || '_' || NEW.lastname);
  new_slug := base_slug;
  -- Loop if the slug exists
  WHILE EXISTS (
    SELECT 1 FROM members WHERE slug = new_slug
  ) LOOP
    new_slug := base_slug || '_' || counter;
    counter := counter + 1;
  END LOOP;
  -- Assign final slug
  NEW.slug := new_slug;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_unique_member_slug"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_unique_slug_company"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 1;
BEGIN
  base_slug := slugify(NEW.name);
  new_slug := base_slug;

  WHILE EXISTS (SELECT 1 FROM companies WHERE slug = new_slug) LOOP
    new_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;

  NEW.slug := new_slug;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_unique_slug_company"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."slugify"("value" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE STRICT
    AS $_$
  WITH unaccented AS (
    SELECT unaccent(value) AS value
  ),
  lowercased AS (
    SELECT lower(value) AS value FROM unaccented
  ),
  underscored AS (
    SELECT regexp_replace(value, '[^a-z0-9]+', '_', 'gi') AS value FROM lowercased
  ),
  trimmed AS (
    SELECT regexp_replace(regexp_replace(value, '_+$', ''), '^_+', '') AS value FROM underscored
  )
  SELECT value FROM trimmed;
$_$;


ALTER FUNCTION "public"."slugify"("value" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."areas_master" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "area" "text" NOT NULL,
    "category" "text" NOT NULL,
    "slug" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."areas_master" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "ident" "text",
    "status" "text",
    "type" "text",
    "established" "text",
    "companysize" "text",
    "narrative" "text",
    "gradprog" "text",
    "prsaward" "text",
    "proforgs" "text",
    "accred" "text",
    "beacon_membership_id" "text",
    "beacon_membership_status" "text",
    "slug" "text"
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_accreditations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "accreditation" "text"
);


ALTER TABLE "public"."company_accreditations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_admin_info" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "adminemail" "text",
    "groupmem" "text",
    "vatrate" "text",
    "expiry" "text"
);


ALTER TABLE "public"."company_admin_info" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_aliases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "alias" "text"
);


ALTER TABLE "public"."company_aliases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_areas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "area" "text",
    "slug" "text" GENERATED ALWAYS AS ("lower"("regexp_replace"("area", '[^a-zA-Z0-9]+'::"text", '-'::"text", 'g'::"text"))) STORED,
    "category" "text"
);


ALTER TABLE "public"."company_areas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_contact_info" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "addr1" "text",
    "postcode" "text",
    "country" "text",
    "phone" "text",
    "email" "text",
    "mobile" "text",
    "website" "text",
    "linkedin" "text",
    "facebook" "text",
    "twitter" "text",
    "youtube" "text",
    "mapref" "text",
    "addr2" "text",
    "addr3" "text",
    "addr4" "text",
    "addr5" "text"
);


ALTER TABLE "public"."company_contact_info" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "type" "text",
    "url" "text"
);


ALTER TABLE "public"."company_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_prof_orgs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "org" "text"
);


ALTER TABLE "public"."company_prof_orgs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "legacy_member_id" "text" DEFAULT ''::"text",
    "firstname" "text",
    "lastname" "text",
    "jobtitle" "text",
    "organisation" "text",
    "country" "text",
    "joined" "text",
    "maintag" "text",
    "othertags" "text",
    "linkedin" "text",
    "flags" "text",
    "cttetitle" "text",
    "ctteareas" "text",
    "biognotes" "text",
    "timeline" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "slug" "text",
    "email" "text",
    "beacon_id" "text",
    "beacon_membership" "text",
    "beacon_membership_status" "text"
);


ALTER TABLE "public"."members" OWNER TO "postgres";


ALTER TABLE ONLY "public"."company_accreditations"
    ADD CONSTRAINT "accreditations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_admin_info"
    ADD CONSTRAINT "admin_info_company_id_key" UNIQUE ("company_id");



ALTER TABLE ONLY "public"."company_admin_info"
    ADD CONSTRAINT "admin_info_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_aliases"
    ADD CONSTRAINT "aliases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."areas_master"
    ADD CONSTRAINT "areas_master_area_key" UNIQUE ("area");



ALTER TABLE ONLY "public"."areas_master"
    ADD CONSTRAINT "areas_master_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_areas"
    ADD CONSTRAINT "areas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_ident_key" UNIQUE ("ident");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_contact_info"
    ADD CONSTRAINT "contact_info_company_id_key" UNIQUE ("company_id");



ALTER TABLE ONLY "public"."company_contact_info"
    ADD CONSTRAINT "contact_info_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_links"
    ADD CONSTRAINT "links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_member_id_key" UNIQUE ("legacy_member_id");



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."company_prof_orgs"
    ADD CONSTRAINT "prof_orgs_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_company_areas_category" ON "public"."company_areas" USING "btree" ("category");



CREATE OR REPLACE TRIGGER "set_company_slug_before_insert" BEFORE INSERT ON "public"."companies" FOR EACH ROW WHEN ((("new"."name" IS NOT NULL) AND ("new"."slug" IS NULL))) EXECUTE FUNCTION "public"."set_unique_slug_company"();



CREATE OR REPLACE TRIGGER "set_member_slug" BEFORE INSERT ON "public"."members" FOR EACH ROW WHEN (("new"."slug" IS NULL)) EXECUTE FUNCTION "public"."set_unique_member_slug"();



ALTER TABLE ONLY "public"."company_accreditations"
    ADD CONSTRAINT "accreditations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."company_admin_info"
    ADD CONSTRAINT "admin_info_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_aliases"
    ADD CONSTRAINT "aliases_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."company_areas"
    ADD CONSTRAINT "company_areas_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_contact_info"
    ADD CONSTRAINT "contact_info_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_links"
    ADD CONSTRAINT "links_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."company_prof_orgs"
    ADD CONSTRAINT "prof_orgs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON UPDATE CASCADE;



CREATE POLICY "allow_anon_select_areas_master" ON "public"."areas_master" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."areas_master" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "auth all" ON "public"."company_admin_info" TO "authenticated", "anon" USING (true) WITH CHECK (true);



CREATE POLICY "auth all" ON "public"."company_areas" TO "authenticated", "anon" USING (true) WITH CHECK (true);



CREATE POLICY "auth all" ON "public"."company_contact_info" TO "authenticated", "anon" USING (true) WITH CHECK (true);



CREATE POLICY "auth anon all" ON "public"."companies" TO "authenticated", "anon" USING (true) WITH CHECK (true);



CREATE POLICY "auth anon all" ON "public"."members" TO "authenticated", "anon" USING (true) WITH CHECK (true);



CREATE POLICY "auth delete" ON "public"."company_areas" FOR DELETE TO "authenticated" USING (true);



ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_accreditations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_admin_info" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_aliases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_areas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_contact_info" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_prof_orgs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "read anon" ON "public"."companies" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "read for anon and auth" ON "public"."company_areas" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "read for website" ON "public"."company_contact_info" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "website read" ON "public"."company_admin_info" FOR SELECT TO "authenticated", "anon" USING (true);





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";





































































































































































GRANT ALL ON FUNCTION "public"."set_unique_member_slug"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_unique_member_slug"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_unique_member_slug"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_unique_slug_company"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_unique_slug_company"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_unique_slug_company"() TO "service_role";



GRANT ALL ON FUNCTION "public"."slugify"("value" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."slugify"("value" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."slugify"("value" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."areas_master" TO "anon";
GRANT ALL ON TABLE "public"."areas_master" TO "authenticated";
GRANT ALL ON TABLE "public"."areas_master" TO "service_role";



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."company_accreditations" TO "anon";
GRANT ALL ON TABLE "public"."company_accreditations" TO "authenticated";
GRANT ALL ON TABLE "public"."company_accreditations" TO "service_role";



GRANT ALL ON TABLE "public"."company_admin_info" TO "anon";
GRANT ALL ON TABLE "public"."company_admin_info" TO "authenticated";
GRANT ALL ON TABLE "public"."company_admin_info" TO "service_role";



GRANT ALL ON TABLE "public"."company_aliases" TO "anon";
GRANT ALL ON TABLE "public"."company_aliases" TO "authenticated";
GRANT ALL ON TABLE "public"."company_aliases" TO "service_role";



GRANT ALL ON TABLE "public"."company_areas" TO "anon";
GRANT ALL ON TABLE "public"."company_areas" TO "authenticated";
GRANT ALL ON TABLE "public"."company_areas" TO "service_role";



GRANT ALL ON TABLE "public"."company_contact_info" TO "anon";
GRANT ALL ON TABLE "public"."company_contact_info" TO "authenticated";
GRANT ALL ON TABLE "public"."company_contact_info" TO "service_role";



GRANT ALL ON TABLE "public"."company_links" TO "anon";
GRANT ALL ON TABLE "public"."company_links" TO "authenticated";
GRANT ALL ON TABLE "public"."company_links" TO "service_role";



GRANT ALL ON TABLE "public"."company_prof_orgs" TO "anon";
GRANT ALL ON TABLE "public"."company_prof_orgs" TO "authenticated";
GRANT ALL ON TABLE "public"."company_prof_orgs" TO "service_role";



GRANT ALL ON TABLE "public"."members" TO "anon";
GRANT ALL ON TABLE "public"."members" TO "authenticated";
GRANT ALL ON TABLE "public"."members" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































RESET ALL;
