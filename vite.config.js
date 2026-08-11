import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// على Vercel الموقع بيتنشر على الدومين نفسه، فـ base بيفضل "/"
export default defineConfig({
  plugins: [react()],
  base: "/",
});
