// Migration-generation only: dormant tables remain in applied history; never import into runtime.
import { sql } from "drizzle-orm"
import { pgSchema, uuid, text, timestamp, integer, boolean, jsonb, primaryKey, unique, index, check, foreignKey } from "drizzle-orm/pg-core"
import type { KanaCharacter, QuizSetup } from "../types/kana"
import { kana } from "../server/db/schema"

const learning = pgSchema("learning")
// Supabase manages this existing table; application migrations never create/alter it.
const authUsers = pgSchema("auth").table("users", { id: uuid("id").primaryKey() })
export const profiles = learning.table("profiles", {
  id: uuid("id").primaryKey().references(() => authUsers.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
export const familiarity = learning.table("kana_familiarity", {
  profileId: uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  kanaId: text("kana_id").notNull().references(() => kana.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.profileId, t.kanaId] })])
export const quizSessions = learning.table("quiz_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  config: jsonb("config").$type<QuizSetup>().notNull(),
  status: text("status").$type<"active" | "completed">().notNull().default("active"),
  total: integer("total").notNull(),
  score: integer("score"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (t) => [
  unique("session_owner").on(t.id, t.profileId),
  index("sessions_owner_history").on(t.profileId, t.createdAt, t.id),
  check("session_total", sql`${t.total} between 1 and 25`),
  check("session_state", sql`(${t.status} = 'active' and ${t.score} is null and ${t.completedAt} is null) or (${t.status} = 'completed' and ${t.score} is not null and ${t.score} between 0 and ${t.total} and ${t.completedAt} is not null)`),
])
export const quizQuestions = learning.table("quiz_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull(),
  profileId: uuid("profile_id").notNull(),
  kanaId: text("kana_id").notNull().references(() => kana.id),
  position: integer("position").notNull(),
  snapshot: jsonb("snapshot").$type<KanaCharacter>().notNull(),
  options: jsonb("options").$type<string[]>().notNull(),
  correctAnswer: text("correct_answer").notNull(),
}, (t) => [
  foreignKey({ columns: [t.sessionId, t.profileId], foreignColumns: [quizSessions.id, quizSessions.profileId] }).onDelete("cascade"),
  unique("question_session_owner").on(t.id, t.sessionId, t.profileId),
  unique("question_position").on(t.sessionId, t.position),
  unique("question_kana").on(t.sessionId, t.kanaId),
  check("question_options", sql`jsonb_typeof(${t.options}) = 'array' and jsonb_array_length(${t.options}) between 1 and 4 and ${t.options} ? ${t.correctAnswer}`),
  check("question_position_range", sql`${t.position} between 0 and 24`),
])
export const quizAnswers = learning.table("quiz_answers", {
  questionId: uuid("question_id").primaryKey(),
  sessionId: uuid("session_id").notNull(),
  profileId: uuid("profile_id").notNull(),
  submissionId: uuid("submission_id").notNull(),
  answer: text("answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  answeredAt: timestamp("answered_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ columns: [t.questionId, t.sessionId, t.profileId], foreignColumns: [quizQuestions.id, quizQuestions.sessionId, quizQuestions.profileId] }).onDelete("cascade"),
  unique("answer_submission").on(t.profileId, t.submissionId),
  index("answers_owner_session").on(t.profileId, t.sessionId),
  check("answer_length", sql`length(${t.answer}) between 1 and 64`),
])
export const mutationReceipts = learning.table("mutation_receipts", {
  profileId: uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  requestId: uuid("request_id").notNull(),
  operation: text("operation").notNull(),
  payloadHash: text("payload_hash").notNull(),
  result: jsonb("result").$type<unknown>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.profileId, t.requestId] })])
