
import type { Config } from "tailwindcss";
import rootConfig from "../tailwind.config";

const config: Config = {
  ...rootConfig,
  content: [
    "./src/**/*.{ts,tsx}",
    "./index.html",
  ],
};

export default config;
