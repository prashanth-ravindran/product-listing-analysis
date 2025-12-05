import nextConfig from "eslint-config-next";

const config = [
  {
    ignores: ["node_modules/", ".next/", "dist/"]
  },
  ...nextConfig
];

export default config;
