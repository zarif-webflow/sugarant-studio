import eslint from "@eslint/js";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

export default tseslint.config(
  prettierRecommended,
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    name: "files-ignoring",
    ignores: ["**/dist/**", "bin/live-reload.js"],
  },
  {
    name: "imports-sorting",
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  {
    name: "custom-rules",
    rules: {
      "prettier/prettier": [
        "error",
        {
          endOfLine: "auto",
        },
      ],

      // disallow else after a return in an if
      "no-else-return": ["error", { allowElseIf: false }],

      // disallow use of assignment in return statement
      "no-return-assign": ["error", "always"],

      // disallow unnecessary constructor
      "no-useless-constructor": "error",

      // disallow use of console statements (except for console.error)
      "no-console": ["warn", { allow: ["error", "debug"] }],

      // disallow the unary operators ++ and --
      "no-plusplus": ["warn", { allowForLoopAfterthoughts: true }],

      // require the use of === and !==
      eqeqeq: ["error", "always", { null: "ignore" }],
    },
  }
);
