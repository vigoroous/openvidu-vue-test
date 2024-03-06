import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import mkcert from 'vite-plugin-mkcert';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue(), mkcert()],
    resolve: {
        alias: {
            '@src': resolve(__dirname, 'src'),
        },
    },
    server: {
        host: true,
        port: 5000,
        proxy: {
            '^/openvidu/api/?.*': {
                target: 'https://' + 'volumetrik.ru' + ':' + 443,
                secure: false,
            },
            '/openvidu': {
                target: 'wss://' + 'volumetrik.ru' + ':' + 443,
                ws: true,
                secure: false,
            },
        },
    },
});
