import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  base: "/Security_CBT/",
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "vendor", test: /node_modules/ },
            { name: "lesson-content", test: /src[\\/]content[\\/]lessons\.json$/ },
            { name: "case-content", test: /src[\\/]content[\\/]cases\.json$/ },
            { name: "question-content", test: /src[\\/]content[\\/]questions\.json$/ },
          ],
        },
      },
    },
  },
  server: { host: "127.0.0.1", port: 5175, strictPort: true },
  preview: { host: "127.0.0.1", port: 4175, strictPort: true },
});
