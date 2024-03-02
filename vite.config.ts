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
    port: 5000,
    // proxy: {
    //   "^/openvidu/api/?.*": {
    //     target: "https://" + "volumetric" + ":" + 443,
    //     secure: false,
    //   },
    //   "/openvidu": {
    //     target: "wss://" + "volumetric" + ":" + 443,
    //     ws: true,
    //     secure: false,
    //   },
    // },
  },
});
