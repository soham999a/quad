import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';

// ─── Build identity ──────────────────────────────────────────────────────────
// Every error report and analytics event carries the release it came from, so a
// regression can be tied to the deploy that introduced it. On Vercel the commit
// sha is available at build time; locally the release is the package version.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const release = process.env.VERCEL_GIT_COMMIT_SHA
  ? `v${pkg.version}+${process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)}`
  : `v${pkg.version}-dev`;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(release),
  },
  build: {
    rollupOptions: {
      output: {
        // Firebase and the charting library are large, versioned and rarely
        // change between deploys. Isolating them lets a code change invalidate
        // only the app chunk, so repeat visitors keep the vendor bytes.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('firebase') || id.includes('@firebase')) return 'firebase';
          if (id.includes('recharts') || id.includes('d3-')) return 'charts';
          if (id.includes('react-router')) return 'router';
          if (id.includes('i18next')) return 'i18n';
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react';
          return undefined;
        },
      },
    },
  },
});
