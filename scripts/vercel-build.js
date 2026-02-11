const { execSync } = require('child_process');
const path = require('path');

console.log('[CryptoEats] Building API with esbuild...');
try {
  execSync(
    'npx esbuild server/vercel-entry.ts --platform=node --packages=external --bundle --format=cjs --outfile=api/index.js',
    { stdio: 'inherit', cwd: path.resolve(__dirname, '..') }
  );
  console.log('[CryptoEats] API build complete.');
} catch (err) {
  console.error('[CryptoEats] Build failed:', err.message);
  process.exit(1);
}
