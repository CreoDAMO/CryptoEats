const { execSync } = require('child_process');
const path = require('path');
const cwd = path.resolve(__dirname, '..');

console.log('[CryptoEats] Building API with esbuild...');
try {
  execSync(
    'npx esbuild server/vercel-entry.ts --platform=node --packages=external --bundle --format=cjs --outfile=api/index.js',
    { stdio: 'inherit', cwd }
  );
  console.log('[CryptoEats] API build complete.');
} catch (err) {
  console.error('[CryptoEats] Build failed:', err.message);
  process.exit(1);
}

if (process.env.DATABASE_URL) {
  console.log('[CryptoEats] Running database migrations...');
  try {
    execSync('npx drizzle-kit push --force', { stdio: 'inherit', cwd });
    console.log('[CryptoEats] Database migrations complete.');
  } catch (err) {
    console.warn('[CryptoEats] Database migration warning:', err.message);
    console.warn('[CryptoEats] Tables may need to be created manually. Run: npx drizzle-kit push');
  }
} else {
  console.log('[CryptoEats] No DATABASE_URL — skipping migrations.');
}
