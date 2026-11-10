import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative paths so the build works on GitHub Pages under /<repo-name>/.
  base: "./",
});
