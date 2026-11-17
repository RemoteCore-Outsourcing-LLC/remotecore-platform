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
    // Public pages use plain links on purpose: each page load mounts the scroll engine fresh.
    // Plain <img> is used for small local images that are already sized and compressed.
    rules: { "@next/next/no-html-link-for-pages": "off", "@next/next/no-img-element": "off", "@next/next/no-css-tags": "off" },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
