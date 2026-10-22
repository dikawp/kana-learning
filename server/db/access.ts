import { ApiError } from "../api/errors"

export const runtimeAccessSql = `select r.rolsuper, r.rolbypassrls,
  has_schema_privilege(current_user, 'learning', 'CREATE') as ddl,
  exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='learning' and c.relkind='r' and
      (has_table_privilege(current_user,c.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') or
       has_any_column_privilege(current_user,c.oid,'INSERT,UPDATE,REFERENCES') or
       (c.relname in ('profiles','kana_familiarity','quiz_sessions','quiz_questions','quiz_answers','mutation_receipts') and has_any_column_privilege(current_user,c.oid,'SELECT')))) as unsafe_grants
  from pg_roles r where r.rolname=current_user`

export function assertContentRole(rows: { rolsuper: boolean; rolbypassrls: boolean; ddl: boolean; unsafe_grants: boolean }[]) {
  if (rows.length !== 1 || rows[0].rolsuper || rows[0].rolbypassrls || rows[0].ddl || rows[0].unsafe_grants) {
    throw new ApiError(503, "DATABASE_ROLE_UNSAFE", "Learning material requires a restricted read-only runtime role.")
  }
}
