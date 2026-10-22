-- Custom SQL migration file, put your code below! --
-- Keep historical tables/data intact; runtime may only read public learning content.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA learning FROM learning_runtime;
--> statement-breakpoint
-- Table-level REVOKE does not remove earlier column-level UPDATE grants.
REVOKE UPDATE (id) ON learning.profiles FROM learning_runtime;
--> statement-breakpoint
REVOKE UPDATE (status, score, completed_at) ON learning.quiz_sessions FROM learning_runtime;
--> statement-breakpoint
REVOKE CREATE ON SCHEMA learning FROM learning_runtime;
--> statement-breakpoint
GRANT SELECT ON learning.kana TO learning_runtime;
