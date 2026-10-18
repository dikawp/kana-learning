-- Business tables live outside the Supabase Data API's public schema.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'learning_runtime') THEN
    CREATE ROLE learning_runtime NOLOGIN NOSUPERUSER NOBYPASSRLS;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'learning_runtime' AND (rolsuper OR rolbypassrls)) THEN
    RAISE EXCEPTION 'learning_runtime must not bypass RLS';
  END IF;
END $$;
--> statement-breakpoint
REVOKE ALL ON SCHEMA learning FROM PUBLIC;
--> statement-breakpoint
GRANT USAGE ON SCHEMA learning TO learning_runtime;
--> statement-breakpoint
GRANT SELECT ON learning.kana TO learning_runtime;
--> statement-breakpoint
GRANT SELECT, INSERT ON learning.profiles, learning.quiz_sessions, learning.quiz_questions, learning.quiz_answers, learning.mutation_receipts TO learning_runtime;
--> statement-breakpoint
GRANT UPDATE (id) ON learning.profiles TO learning_runtime;
--> statement-breakpoint
GRANT UPDATE (status, score, completed_at) ON learning.quiz_sessions TO learning_runtime;
--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON learning.kana_familiarity TO learning_runtime;
--> statement-breakpoint
ALTER TABLE learning.kana ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE learning.kana FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY kana_reference_read ON learning.kana FOR SELECT TO learning_runtime USING (true);
--> statement-breakpoint
ALTER TABLE learning.profiles ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE learning.profiles FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY profile_owner ON learning.profiles TO learning_runtime USING (id::text = current_setting('app.profile_id', true)) WITH CHECK (id::text = current_setting('app.profile_id', true));
--> statement-breakpoint
ALTER TABLE learning.kana_familiarity ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE learning.kana_familiarity FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY familiarity_owner ON learning.kana_familiarity TO learning_runtime USING (profile_id::text = current_setting('app.profile_id', true)) WITH CHECK (profile_id::text = current_setting('app.profile_id', true));
--> statement-breakpoint
ALTER TABLE learning.quiz_sessions ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE learning.quiz_sessions FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY session_owner ON learning.quiz_sessions TO learning_runtime USING (profile_id::text = current_setting('app.profile_id', true)) WITH CHECK (profile_id::text = current_setting('app.profile_id', true));
--> statement-breakpoint
ALTER TABLE learning.quiz_questions ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE learning.quiz_questions FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY question_owner ON learning.quiz_questions TO learning_runtime USING (profile_id::text = current_setting('app.profile_id', true)) WITH CHECK (profile_id::text = current_setting('app.profile_id', true));
--> statement-breakpoint
ALTER TABLE learning.quiz_answers ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE learning.quiz_answers FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY answer_owner ON learning.quiz_answers TO learning_runtime USING (profile_id::text = current_setting('app.profile_id', true)) WITH CHECK (profile_id::text = current_setting('app.profile_id', true));
--> statement-breakpoint
ALTER TABLE learning.mutation_receipts ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE learning.mutation_receipts FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY receipt_owner ON learning.mutation_receipts TO learning_runtime USING (profile_id::text = current_setting('app.profile_id', true)) WITH CHECK (profile_id::text = current_setting('app.profile_id', true));
--> statement-breakpoint
-- Revoke pre-existing platform role grants if this migration is applied on Supabase.
DO $$ DECLARE role_name text; BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      EXECUTE format('REVOKE ALL ON SCHEMA learning FROM %I', role_name);
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA learning FROM %I', role_name);
    END IF;
  END LOOP;
END $$;
