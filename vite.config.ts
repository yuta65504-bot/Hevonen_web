import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // GitHub Pages は https://<user>.github.io/<repo>/ で配信されるため
  // アセットのベースパスをリポジトリ名に合わせる
  base: "/Hevonen_web/",
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
  },
});
