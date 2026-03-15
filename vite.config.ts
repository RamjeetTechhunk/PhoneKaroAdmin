import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["admin.phonekar.com"],
  },
  preview: {
    allowedHosts: ["admin.phonekar.com"],
  },
});
