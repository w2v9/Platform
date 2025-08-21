import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/exhaustive-deps": "off",
    }
  },
  {
    files: [
      "**/lib/db_*.ts",
      "**/app/(quiz)/quiz/**/*.tsx",
      "**/app/(dashboard)/dashboard/me/results/**/*.tsx",
      "**/app/(dashboard)/dashboard/quizzes/**/*.tsx",
      "**/app/(dashboard)/dashboard/quizzes/edit/**/*.tsx",
    ],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
];

export default eslintConfig;