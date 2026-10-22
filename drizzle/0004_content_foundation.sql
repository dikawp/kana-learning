CREATE TABLE "learning"."active_release" (
	"slot" text PRIMARY KEY DEFAULT 'public' NOT NULL,
	"release_id" uuid NOT NULL,
	CONSTRAINT "active_release_slot" CHECK ("learning"."active_release"."slot"='public')
);
--> statement-breakpoint
CREATE TABLE "learning"."content_releases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"publisher" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "content_releases_slug_unique" UNIQUE("slug"),
	CONSTRAINT "release_status" CHECK (("learning"."content_releases"."status"='draft' and "learning"."content_releases"."published_at" is null and "learning"."content_releases"."publisher" is null) or ("learning"."content_releases"."status"='published' and "learning"."content_releases"."published_at" is not null and length(trim("learning"."content_releases"."publisher"))>0 and "learning"."content_releases"."publisher" is not null)),
	CONSTRAINT "release_slug" CHECK (length("learning"."content_releases"."slug") between 1 and 120)
);
--> statement-breakpoint
CREATE TABLE "learning"."content_reviews" (
	"revision_id" uuid PRIMARY KEY NOT NULL,
	"reviewer" text NOT NULL,
	"notes" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_identity" CHECK (length(trim("learning"."content_reviews"."reviewer"))>0 and length(trim("learning"."content_reviews"."notes"))>0)
);
--> statement-breakpoint
CREATE TABLE "learning"."content_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"license" text NOT NULL,
	"license_url" text NOT NULL,
	"attribution" text NOT NULL,
	"reuse_status" text DEFAULT 'pending' NOT NULL,
	"rights_evidence" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_reuse_status" CHECK ("learning"."content_sources"."reuse_status" in ('pending','verified')),
	CONSTRAINT "source_rights_evidence" CHECK ("learning"."content_sources"."reuse_status" <> 'verified' or length("learning"."content_sources"."rights_evidence") > 0 and "learning"."content_sources"."rights_evidence" is not null),
	CONSTRAINT "source_urls" CHECK ("learning"."content_sources"."url" like 'https://%' and "learning"."content_sources"."license_url" like 'https://%')
);
--> statement-breakpoint
CREATE TABLE "learning"."import_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"adapter_version" text NOT NULL,
	"status" text NOT NULL,
	"cursor" integer DEFAULT 0 NOT NULL,
	"processed" integer DEFAULT 0 NOT NULL,
	"rejected" integer DEFAULT 0 NOT NULL,
	"error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	CONSTRAINT "import_status" CHECK ("learning"."import_runs"."status" in ('running','completed','failed')),
	CONSTRAINT "import_counts" CHECK ("learning"."import_runs"."cursor" >= 0 and "learning"."import_runs"."processed" >= 0 and "learning"."import_runs"."rejected" >= 0),
	CONSTRAINT "import_finished" CHECK (("learning"."import_runs"."status"='running' and "learning"."import_runs"."finished_at" is null) or ("learning"."import_runs"."status"<>'running' and "learning"."import_runs"."finished_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "learning"."kanji" (
	"material_id" uuid PRIMARY KEY NOT NULL,
	"kind" text DEFAULT 'kanji' NOT NULL,
	"character" text NOT NULL,
	"stroke_count" integer,
	"grade" integer,
	"legacy_jlpt" integer,
	CONSTRAINT "kanji_character_unique" UNIQUE("character"),
	CONSTRAINT "kanji_kind" CHECK ("learning"."kanji"."kind"='kanji'),
	CONSTRAINT "kanji_character" CHECK (char_length("learning"."kanji"."character")=1),
	CONSTRAINT "kanji_strokes" CHECK ("learning"."kanji"."stroke_count" is null or "learning"."kanji"."stroke_count" between 1 and 100),
	CONSTRAINT "kanji_legacy_level" CHECK ("learning"."kanji"."legacy_jlpt" is null or "learning"."kanji"."legacy_jlpt" between 1 and 4)
);
--> statement-breakpoint
CREATE TABLE "learning"."kanji_meanings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" uuid NOT NULL,
	"meaning" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "kanji_meaning_position" UNIQUE("material_id","position"),
	CONSTRAINT "kanji_meaning_text" CHECK (length("learning"."kanji_meanings"."meaning")>0 and "learning"."kanji_meanings"."position">=0)
);
--> statement-breakpoint
CREATE TABLE "learning"."kanji_readings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"raw" text NOT NULL,
	"kana" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "kanji_reading_position" UNIQUE("material_id","position"),
	CONSTRAINT "kanji_reading_kind" CHECK ("learning"."kanji_readings"."kind" in ('on','kun','nanori')),
	CONSTRAINT "kanji_reading_text" CHECK (length("learning"."kanji_readings"."raw")>0 and length("learning"."kanji_readings"."kana")>0 and "learning"."kanji_readings"."position">=0)
);
--> statement-breakpoint
CREATE TABLE "learning"."level_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" uuid NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"scheme" text NOT NULL,
	"level" integer NOT NULL,
	"evidence_url" text NOT NULL,
	CONSTRAINT "level_source_material" UNIQUE("material_id","snapshot_id","scheme"),
	CONSTRAINT "level_scheme" CHECK (("learning"."level_assignments"."scheme"='jlpt-current-approx' and "learning"."level_assignments"."level" between 1 and 5) or ("learning"."level_assignments"."scheme"='jlpt-pre2010' and "learning"."level_assignments"."level" between 1 and 4)),
	CONSTRAINT "level_evidence" CHECK ("learning"."level_assignments"."evidence_url" like 'https://%')
);
--> statement-breakpoint
CREATE TABLE "learning"."material_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" uuid NOT NULL,
	"checksum" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "revision_material_identity" UNIQUE("id","material_id"),
	CONSTRAINT "revision_material_checksum" UNIQUE("material_id","checksum"),
	CONSTRAINT "revision_hash" CHECK ("learning"."material_revisions"."checksum" ~ '^[a-f0-9]{64}$')
);
--> statement-breakpoint
CREATE TABLE "learning"."materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stable_key" text NOT NULL,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"retired_at" timestamp with time zone,
	CONSTRAINT "materials_stable_key_unique" UNIQUE("stable_key"),
	CONSTRAINT "material_kind_identity" UNIQUE("id","kind"),
	CONSTRAINT "material_kind" CHECK ("learning"."materials"."kind" in ('kanji','vocabulary')),
	CONSTRAINT "material_key" CHECK (length("learning"."materials"."stable_key") between 1 and 120)
);
--> statement-breakpoint
CREATE TABLE "learning"."reading_forms" (
	"material_id" uuid NOT NULL,
	"reading_id" uuid NOT NULL,
	"form_id" uuid NOT NULL,
	CONSTRAINT "reading_forms_reading_id_form_id_pk" PRIMARY KEY("reading_id","form_id")
);
--> statement-breakpoint
CREATE TABLE "learning"."release_items" (
	"release_id" uuid NOT NULL,
	"material_id" uuid NOT NULL,
	"revision_id" uuid NOT NULL,
	CONSTRAINT "release_items_release_id_material_id_pk" PRIMARY KEY("release_id","material_id")
);
--> statement-breakpoint
CREATE TABLE "learning"."revision_sources" (
	"revision_id" uuid NOT NULL,
	"snapshot_id" uuid NOT NULL,
	CONSTRAINT "revision_sources_revision_id_snapshot_id_pk" PRIMARY KEY("revision_id","snapshot_id")
);
--> statement-breakpoint
CREATE TABLE "learning"."sense_forms" (
	"material_id" uuid NOT NULL,
	"sense_id" uuid NOT NULL,
	"form_id" uuid NOT NULL,
	CONSTRAINT "sense_forms_sense_id_form_id_pk" PRIMARY KEY("sense_id","form_id")
);
--> statement-breakpoint
CREATE TABLE "learning"."sense_readings" (
	"material_id" uuid NOT NULL,
	"sense_id" uuid NOT NULL,
	"reading_id" uuid NOT NULL,
	CONSTRAINT "sense_readings_sense_id_reading_id_pk" PRIMARY KEY("sense_id","reading_id")
);
--> statement-breakpoint
CREATE TABLE "learning"."source_records" (
	"source_id" text NOT NULL,
	"external_id" text NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"material_id" uuid NOT NULL,
	"raw_hash" text NOT NULL,
	CONSTRAINT "source_records_source_id_external_id_pk" PRIMARY KEY("source_id","external_id"),
	CONSTRAINT "record_hash" CHECK ("learning"."source_records"."raw_hash" ~ '^[a-f0-9]{64}$')
);
--> statement-breakpoint
CREATE TABLE "learning"."source_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" text NOT NULL,
	"version" text NOT NULL,
	"schema_version" text NOT NULL,
	"checksum" text NOT NULL,
	"source_date" text NOT NULL,
	"transport_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "snapshot_source_checksum" UNIQUE("source_id","checksum"),
	CONSTRAINT "snapshot_source_identity" UNIQUE("id","source_id"),
	CONSTRAINT "snapshot_checksum" CHECK ("learning"."source_snapshots"."checksum" ~ '^[a-f0-9]{64}$')
);
--> statement-breakpoint
CREATE TABLE "learning"."vocabulary" (
	"material_id" uuid PRIMARY KEY NOT NULL,
	"kind" text DEFAULT 'vocabulary' NOT NULL,
	CONSTRAINT "vocabulary_kind" CHECK ("learning"."vocabulary"."kind"='vocabulary')
);
--> statement-breakpoint
CREATE TABLE "learning"."vocabulary_forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" uuid NOT NULL,
	"text" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "form_entry_identity" UNIQUE("id","material_id"),
	CONSTRAINT "form_entry_text" UNIQUE("material_id","text"),
	CONSTRAINT "form_entry_position" UNIQUE("material_id","position"),
	CONSTRAINT "form_text" CHECK (length("learning"."vocabulary_forms"."text")>0 and "learning"."vocabulary_forms"."position">=0)
);
--> statement-breakpoint
CREATE TABLE "learning"."vocabulary_kanji" (
	"form_id" uuid NOT NULL,
	"kanji_id" uuid NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "vocabulary_kanji_form_id_position_pk" PRIMARY KEY("form_id","position"),
	CONSTRAINT "word_kanji_position" CHECK ("learning"."vocabulary_kanji"."position">=0)
);
--> statement-breakpoint
CREATE TABLE "learning"."vocabulary_readings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" uuid NOT NULL,
	"kana" text NOT NULL,
	"form_scope" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "reading_entry_identity" UNIQUE("id","material_id"),
	CONSTRAINT "reading_entry_text" UNIQUE("material_id","kana"),
	CONSTRAINT "reading_entry_position" UNIQUE("material_id","position"),
	CONSTRAINT "reading_scope" CHECK ("learning"."vocabulary_readings"."form_scope" in ('all','restricted','kana-only')),
	CONSTRAINT "reading_text" CHECK (length("learning"."vocabulary_readings"."kana")>0 and "learning"."vocabulary_readings"."position">=0)
);
--> statement-breakpoint
CREATE TABLE "learning"."vocabulary_senses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"english" jsonb NOT NULL,
	"parts_of_speech" jsonb NOT NULL,
	"form_scope" text NOT NULL,
	"reading_scope" text NOT NULL,
	CONSTRAINT "sense_entry_identity" UNIQUE("id","material_id"),
	CONSTRAINT "sense_entry_position" UNIQUE("material_id","position"),
	CONSTRAINT "sense_scopes" CHECK ("learning"."vocabulary_senses"."form_scope" in ('all','restricted') and "learning"."vocabulary_senses"."reading_scope" in ('all','restricted')),
	CONSTRAINT "sense_glosses" CHECK (jsonb_typeof("learning"."vocabulary_senses"."english")='array' and jsonb_array_length("learning"."vocabulary_senses"."english")>0 and jsonb_typeof("learning"."vocabulary_senses"."parts_of_speech")='array' and "learning"."vocabulary_senses"."position">=0)
);
--> statement-breakpoint
ALTER TABLE "learning"."active_release" ADD CONSTRAINT "active_release_release_id_content_releases_id_fk" FOREIGN KEY ("release_id") REFERENCES "learning"."content_releases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."content_reviews" ADD CONSTRAINT "content_reviews_revision_id_material_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "learning"."material_revisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."import_runs" ADD CONSTRAINT "import_runs_snapshot_id_source_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "learning"."source_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."kanji" ADD CONSTRAINT "kanji_material_id_kind_materials_id_kind_fk" FOREIGN KEY ("material_id","kind") REFERENCES "learning"."materials"("id","kind") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."kanji_meanings" ADD CONSTRAINT "kanji_meanings_material_id_kanji_material_id_fk" FOREIGN KEY ("material_id") REFERENCES "learning"."kanji"("material_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."kanji_readings" ADD CONSTRAINT "kanji_readings_material_id_kanji_material_id_fk" FOREIGN KEY ("material_id") REFERENCES "learning"."kanji"("material_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."level_assignments" ADD CONSTRAINT "level_assignments_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "learning"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."level_assignments" ADD CONSTRAINT "level_assignments_snapshot_id_source_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "learning"."source_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."material_revisions" ADD CONSTRAINT "material_revisions_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "learning"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."reading_forms" ADD CONSTRAINT "reading_forms_reading_id_material_id_vocabulary_readings_id_material_id_fk" FOREIGN KEY ("reading_id","material_id") REFERENCES "learning"."vocabulary_readings"("id","material_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."reading_forms" ADD CONSTRAINT "reading_forms_form_id_material_id_vocabulary_forms_id_material_id_fk" FOREIGN KEY ("form_id","material_id") REFERENCES "learning"."vocabulary_forms"("id","material_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."release_items" ADD CONSTRAINT "release_items_release_id_content_releases_id_fk" FOREIGN KEY ("release_id") REFERENCES "learning"."content_releases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."release_items" ADD CONSTRAINT "release_items_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "learning"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."release_items" ADD CONSTRAINT "release_items_revision_id_material_id_material_revisions_id_material_id_fk" FOREIGN KEY ("revision_id","material_id") REFERENCES "learning"."material_revisions"("id","material_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."revision_sources" ADD CONSTRAINT "revision_sources_revision_id_material_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "learning"."material_revisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."revision_sources" ADD CONSTRAINT "revision_sources_snapshot_id_source_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "learning"."source_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."sense_forms" ADD CONSTRAINT "sense_forms_sense_id_material_id_vocabulary_senses_id_material_id_fk" FOREIGN KEY ("sense_id","material_id") REFERENCES "learning"."vocabulary_senses"("id","material_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."sense_forms" ADD CONSTRAINT "sense_forms_form_id_material_id_vocabulary_forms_id_material_id_fk" FOREIGN KEY ("form_id","material_id") REFERENCES "learning"."vocabulary_forms"("id","material_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."sense_readings" ADD CONSTRAINT "sense_readings_sense_id_material_id_vocabulary_senses_id_material_id_fk" FOREIGN KEY ("sense_id","material_id") REFERENCES "learning"."vocabulary_senses"("id","material_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."sense_readings" ADD CONSTRAINT "sense_readings_reading_id_material_id_vocabulary_readings_id_material_id_fk" FOREIGN KEY ("reading_id","material_id") REFERENCES "learning"."vocabulary_readings"("id","material_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."source_records" ADD CONSTRAINT "source_records_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "learning"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."source_records" ADD CONSTRAINT "source_records_snapshot_id_source_id_source_snapshots_id_source_id_fk" FOREIGN KEY ("snapshot_id","source_id") REFERENCES "learning"."source_snapshots"("id","source_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."source_snapshots" ADD CONSTRAINT "source_snapshots_source_id_content_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "learning"."content_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."vocabulary" ADD CONSTRAINT "vocabulary_material_id_kind_materials_id_kind_fk" FOREIGN KEY ("material_id","kind") REFERENCES "learning"."materials"("id","kind") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."vocabulary_forms" ADD CONSTRAINT "vocabulary_forms_material_id_vocabulary_material_id_fk" FOREIGN KEY ("material_id") REFERENCES "learning"."vocabulary"("material_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."vocabulary_kanji" ADD CONSTRAINT "vocabulary_kanji_form_id_vocabulary_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "learning"."vocabulary_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."vocabulary_kanji" ADD CONSTRAINT "vocabulary_kanji_kanji_id_kanji_material_id_fk" FOREIGN KEY ("kanji_id") REFERENCES "learning"."kanji"("material_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."vocabulary_readings" ADD CONSTRAINT "vocabulary_readings_material_id_vocabulary_material_id_fk" FOREIGN KEY ("material_id") REFERENCES "learning"."vocabulary"("material_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning"."vocabulary_senses" ADD CONSTRAINT "vocabulary_senses_material_id_vocabulary_material_id_fk" FOREIGN KEY ("material_id") REFERENCES "learning"."vocabulary"("material_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "import_snapshot_status" ON "learning"."import_runs" USING btree ("snapshot_id","status");--> statement-breakpoint
CREATE INDEX "level_material_filter" ON "learning"."level_assignments" USING btree ("scheme","level","material_id");--> statement-breakpoint
CREATE INDEX "material_kind_key" ON "learning"."materials" USING btree ("kind","stable_key");--> statement-breakpoint
CREATE INDEX "release_revision" ON "learning"."release_items" USING btree ("revision_id");--> statement-breakpoint
CREATE INDEX "record_material" ON "learning"."source_records" USING btree ("material_id");