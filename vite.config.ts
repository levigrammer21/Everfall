import { defineConfig } from 'vite';
export default defineConfig({base:'./',server:{open:'/game.html'},build:{assetsDir:'',chunkSizeWarningLimit:1600,rollupOptions:{input:"game.html",output:{manualChunks(id){if(id.includes('/node_modules/phaser/')) return 'phaser';if(id.includes('/node_modules/firebase/')||id.includes('/node_modules/@firebase/'))return 'firebase';}}}}});
