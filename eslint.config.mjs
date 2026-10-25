import { defineConfig, globalIgnores } from "eslint/config"
import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import tseslint from "typescript-eslint"

export default defineConfig([
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "docs/analysis/**"]),
  {
    files: ["**/*.{js,mjs,ts,tsx,mts}"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat.recommended],
  },
])
