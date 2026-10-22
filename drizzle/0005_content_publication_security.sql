-- Private editorial data; runtime reads only the active published security-barrier view.
DO $$ DECLARE item text; BEGIN
  FOREACH item IN ARRAY ARRAY['active_release','content_releases','content_reviews','content_sources','import_runs','kanji','kanji_meanings','kanji_readings','level_assignments','material_revisions','materials','reading_forms','release_items','revision_sources','sense_forms','sense_readings','source_records','source_snapshots','vocabulary','vocabulary_forms','vocabulary_kanji','vocabulary_readings','vocabulary_senses'] LOOP
    EXECUTE format('ALTER TABLE learning.%I ENABLE ROW LEVEL SECURITY', item);
    EXECUTE format('REVOKE ALL ON learning.%I FROM PUBLIC, learning_runtime', item);
    IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN EXECUTE format('REVOKE ALL ON learning.%I FROM anon', item); END IF;
    IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN EXECUTE format('REVOKE ALL ON learning.%I FROM authenticated', item); END IF;
  END LOOP;
END $$;
--> statement-breakpoint
CREATE FUNCTION learning.reject_immutable_change() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN RAISE EXCEPTION 'Immutable content record; create a new revision' USING ERRCODE='55000'; END $$;
--> statement-breakpoint
CREATE TRIGGER immutable_snapshot BEFORE UPDATE OR DELETE ON learning.source_snapshots FOR EACH ROW EXECUTE FUNCTION learning.reject_immutable_change();
--> statement-breakpoint
CREATE TRIGGER immutable_revision BEFORE UPDATE OR DELETE ON learning.material_revisions FOR EACH ROW EXECUTE FUNCTION learning.reject_immutable_change();
--> statement-breakpoint
CREATE TRIGGER immutable_review BEFORE UPDATE OR DELETE ON learning.content_reviews FOR EACH ROW EXECUTE FUNCTION learning.reject_immutable_change();
--> statement-breakpoint
CREATE FUNCTION learning.guard_material_identity() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.kind IS DISTINCT FROM OLD.kind OR NEW.stable_key IS DISTINCT FROM OLD.stable_key THEN
    RAISE EXCEPTION 'Material identity is immutable' USING ERRCODE='55000';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER material_identity BEFORE UPDATE ON learning.materials FOR EACH ROW EXECUTE FUNCTION learning.guard_material_identity();
--> statement-breakpoint
CREATE FUNCTION learning.guard_published_release() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
  IF OLD.status='published' THEN RAISE EXCEPTION 'Published release is immutable' USING ERRCODE='55000'; END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER published_release BEFORE UPDATE OR DELETE ON learning.content_releases FOR EACH ROW EXECUTE FUNCTION learning.guard_published_release();
--> statement-breakpoint
CREATE FUNCTION learning.guard_release_item() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE state text;
BEGIN
  -- Lock the parent release: publication and draft-manifest changes cannot race.
  IF TG_OP IN ('UPDATE','DELETE') THEN
    SELECT status INTO state FROM learning.content_releases WHERE id=OLD.release_id FOR UPDATE;
    IF state='published' THEN RAISE EXCEPTION 'Published manifest is immutable' USING ERRCODE='55000'; END IF;
  END IF;
  IF TG_OP IN ('INSERT','UPDATE') THEN
    SELECT status INTO state FROM learning.content_releases WHERE id=NEW.release_id FOR UPDATE;
    IF state='published' THEN RAISE EXCEPTION 'Published manifest is immutable' USING ERRCODE='55000'; END IF;
    RETURN NEW;
  END IF;
  RETURN OLD;
END $$;
--> statement-breakpoint
CREATE TRIGGER release_manifest BEFORE INSERT OR UPDATE OR DELETE ON learning.release_items FOR EACH ROW EXECUTE FUNCTION learning.guard_release_item();
--> statement-breakpoint
CREATE FUNCTION learning.guard_active_release() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE state text;
BEGIN
  SELECT status INTO state FROM learning.content_releases WHERE id=NEW.release_id FOR SHARE;
  IF state IS DISTINCT FROM 'published' THEN RAISE EXCEPTION 'Only a published release can be active' USING ERRCODE='55000'; END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER active_publication BEFORE INSERT OR UPDATE ON learning.active_release FOR EACH ROW EXECUTE FUNCTION learning.guard_active_release();
--> statement-breakpoint
CREATE INDEX revision_payload_search ON learning.material_revisions USING gin(payload jsonb_path_ops);
--> statement-breakpoint
-- View owner can read base rows; runtime cannot. Filter only immutable active publication.
CREATE VIEW learning.published_materials WITH (security_barrier=true) AS
SELECT m.id,m.stable_key,m.kind,a.release_id,r.id AS revision_id,r.checksum,r.payload
FROM learning.active_release a
JOIN learning.content_releases c ON c.id=a.release_id AND c.status='published'
JOIN learning.release_items i ON i.release_id=c.id
JOIN learning.material_revisions r ON r.id=i.revision_id AND r.material_id=i.material_id
JOIN learning.materials m ON m.id=i.material_id
WHERE a.slot='public';
--> statement-breakpoint
REVOKE ALL ON learning.published_materials FROM PUBLIC;
--> statement-breakpoint
GRANT SELECT ON learning.published_materials TO learning_runtime;
