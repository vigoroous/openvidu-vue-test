import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import mkcert from "vite-plugin-mkcert";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(), 
    mkcert()
  ],
  server: {
    host: true,
    port: 443,
    proxy: {
      "^/api/?.*": {
        target: "http://" + "localhost" + ":" + 4443,
        changeOrigin: true,
        autoRewrite: true,
        // ws: true,
        xfwd: true,
        followRedirects: true,
        secure: false,
      },
      "/openvidu": {
        target: "ws://" + "localhost" + ":" + 4443,
        ws: true,
      },
    },
  },
});
