import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import vitePluginString from 'vite-plugin-string';
import fileServer from './plugins/file-server';

export default defineConfig({
    plugins: [
        vue(),
        vitePluginString(),
        fileServer('/saves'),
    ]
});
