const { execSync } = require('child_process');
const path = require('path');
const cwd = path.resolve(__dirname, '..');

console.log('[CryptoEats] Building web app with Expo...');
try {
  const domain = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || '';
  const env = { ...process.env };
  if (domain) {
    env.EXPO_PUBLIC_DOMAIN = domain;
    console.log(`[CryptoEats] Using domain: ${domain}`);
  } else {
    console.log('[CryptoEats] No domain set — web app will use relative URLs');
    delete env.EXPO_PUBLIC_DOMAIN;
  }
  execSync('npx expo export --platform web --output-dir static-build', { stdio: 'inherit', cwd, env });
  console.log('[CryptoEats] Web build complete.');
} catch (err) {
  console.warn('[CryptoEats] Web build warning (non-fatal):', err.message);
}

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
    execSync('npx drizzle-kit push', { stdio: 'inherit', cwd });
    console.log('[CryptoEats] Database migrations complete.');
  } catch (err) {
    console.warn('[CryptoEats] Database migration warning:', err.message);
  }

  console.log('[CryptoEats] Running database seed...');
  try {
    execSync('npx tsx scripts/run-seed.ts', { stdio: 'inherit', cwd, timeout: 60000 });
    console.log('[CryptoEats] Database seed complete.');
  } catch (err) {
    console.warn('[CryptoEats] Seed warning:', err.message);
  }
} else {
  console.log('[CryptoEats] No DATABASE_URL — skipping migrations and seed.');
}
