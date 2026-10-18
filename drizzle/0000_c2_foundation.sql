CREATE SCHEMA IF NOT EXISTS "learning";
--> statement-breakpoint
CREATE TABLE "learning"."kana_familiarity" (
	"profile_id" uuid NOT NULL,
	"kana_id" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kana_familiarity_profile_id_kana_id_pk" PRIMARY KEY("profile_id","kana_id")
);
--> statement-breakpoint
CREATE TABLE "learning"."kana" (
	"id" text PRIMARY KEY NOT NULL,
	"character" text NOT NULL,
	"romaji" text NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "kana_script_glyph" UNIQUE("type","character"),
	CONSTRAINT "kana_position" UNIQUE("position"),
	CONSTRAINT "kana_script" CHECK ("learning"."kana"."type" in ('hiragana', 'katakana')),
	CONSTRAINT "kana_text" CHECK (length("learning"."kana"."character") > 0 and length("learning"."kana"."romaji") > 0 and "learning"."kana"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "learning"."mutation_receipts" (
	"profile_id" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"operation" text NOT NULL,
	"payload_hash" text NOT NULL,
	"result" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mutation_receipts_profile_id_request_id_pk" PRIMARY KEY("profile_id","request_id")
);
--> statement-breakpoint
CREATE TABLE "learning"."profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning"."quiz_answers" (
	"question_id" uuid PRIMARY KEY NOT NULL,
	"session_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"answer" text NOT NULL,
	"is_correct" boolean NOT NULL,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "answer_submission" UNIQUE("profile_id","submission_id"),
	CONSTRAINT "answer_length" CHECK (length("learning"."quiz_answers"."answer") between 1 and 64)
);
--> statement-breakpoint
CREATE TABLE "learning"."quiz_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"kana_id" text NOT NULL,
	"position" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"options" jsonb NOT NULL,
	"correct_answer" text NOT NULL,
	CONSTRAINT "question_session_owner" UNIQUE("id","session_id","profile_id"),
	CONSTRAINT "question_position" UNIQUE("session_id","position"),
	CONSTRAINT "question_kana" UNIQUE("session_id","kana_id"),
	CONSTRAINT "question_options" CHECK (jsonb_typeof("learning"."quiz_questions"."options") = 'array' and jsonb_array_length("learning"."quiz_questions"."options") between 1 and 4 and "learning"."quiz_questions"."options" ? "learning"."quiz_questions"."correct_answer"),
	CONSTRAINT "question_position_range" CHECK ("learning"."quiz_questions"."position" between 0 and 24)
);
--> statement-breakpoint
CREATE TABLE "learning"."quiz_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"config" jsonb NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"total" integer NOT NULL,
	"score" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "session_owner" UNIQUE("id","profile_id"),
	CONSTRAINT "session_total" CHECK ("learning"."quiz_sessions"."total" between 1 and 25),
	CONSTRAINT "session_state" CHECK (("learning"."quiz_sessions"."status" = 'active' and "learning"."quiz_sessions"."score" is null and "learning"."quiz_sessions"."completed_at" is null) or ("learning"."quiz_sessions"."status" = 'completed' and "learning"."quiz_sessions"."score" between 0 and "learning"."quiz_sessions"."total" and "learning"."quiz_sessions"."completed_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "learning"."kana_familiarity" ADD CONSTRAINT "kana_familiarity_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "learning"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."kana_familiarity" ADD CONSTRAINT "kana_familiarity_kana_id_kana_id_fk" FOREIGN KEY ("kana_id") REFERENCES "learning"."kana"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."mutation_receipts" ADD CONSTRAINT "mutation_receipts_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "learning"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."quiz_answers" ADD CONSTRAINT "quiz_answers_question_id_session_id_profile_id_quiz_questions_id_session_id_profile_id_fk" FOREIGN KEY ("question_id","session_id","profile_id") REFERENCES "learning"."quiz_questions"("id","session_id","profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."quiz_questions" ADD CONSTRAINT "quiz_questions_kana_id_kana_id_fk" FOREIGN KEY ("kana_id") REFERENCES "learning"."kana"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."quiz_questions" ADD CONSTRAINT "quiz_questions_session_id_profile_id_quiz_sessions_id_profile_id_fk" FOREIGN KEY ("session_id","profile_id") REFERENCES "learning"."quiz_sessions"("id","profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."quiz_sessions" ADD CONSTRAINT "quiz_sessions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "learning"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "answers_owner_session" ON "learning"."quiz_answers" USING btree ("profile_id","session_id");--> statement-breakpoint
CREATE INDEX "sessions_owner_history" ON "learning"."quiz_sessions" USING btree ("profile_id","created_at","id");
