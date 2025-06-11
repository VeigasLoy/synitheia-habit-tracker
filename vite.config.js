    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';
    import tailwindcss from '@tailwindcss/vite'; // This is the correct plugin for Vite
    import { VitePWA } from 'vite-plugin-pwa';

    // No need to import autoprefixer or @tailwindcss/postcss directly here anymore
    // as @tailwindcss/vite handles their integration internally in v4's simplified setup.

    // https://vitejs.dev/config/
    export default defineConfig({
      plugins: [
        react(),
        tailwindcss(), // This now correctly refers to the @tailwindcss/vite plugin
        VitePWA({
          registerType: 'autoUpdate',
          injectRegister: 'auto',
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          },
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.png', 'icons/*'],
          manifest: {
            name: 'Synitheia Habit Tracker',
            short_name: 'Synitheia',
            description: 'Track your habits and build streaks',
            theme_color: '#2563eb',
            background_color: '#ffffff',
            display: 'standalone',
            icons: [
              {
                src: 'icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png'
              },
              {
                src: 'icons/icon-512x512.maskable.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }
            ]
          }
        })
      ],
      // REMOVE THE CSS BLOCK THAT WAS HERE PREVIOUSLY:
      // css: {
      //   postcss: {
      //     plugins: [
      //       tailwindcssPlugin(),
      //       autoprefixer(),
      //     ],
      //   },
      // },
    });
    