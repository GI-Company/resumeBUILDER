import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";

const eslintConfig = [
  js.configs.recommended,
  {
    name: "next/core-web-vitals",
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  {
    ignores: [
      ".next/**",
      "out/**",
      "dist/**",
      "node_modules/**",
      "*.js",
    ],
  },
];

export default eslintConfig;
