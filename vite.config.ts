import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        // This will transform your SVG to a React component
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  publicDir: "public",
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Mantener el nombre .htaccess sin hash
          if (assetInfo.names && assetInfo.names[0] === '.htaccess') {
            return '.htaccess';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
