import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

// A simple plugin to copy the 'js' directory to 'dist/js'
function copyJsPlugin() {
  return {
    name: 'copy-js-plugin',
    closeBundle() {
      const srcDir = resolve(__dirname, 'js');
      const destDir = resolve(__dirname, 'dist/js');
      if (fs.existsSync(srcDir)) {
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        const files = fs.readdirSync(srcDir);
        for (const file of files) {
          fs.copyFileSync(resolve(srcDir, file), resolve(destDir, file));
        }
      }
    }
  };
}

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        game: resolve(__dirname, 'game.html'),
        rules: resolve(__dirname, 'rules.html'),
        leaderboard: resolve(__dirname, 'leaderboard.html'),
        settings: resolve(__dirname, 'settings.html'),
      },
    },
  },
  plugins: [copyJsPlugin()],
});
