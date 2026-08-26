import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const required = {
  'assets/icon-pack/masters/app-icon-1024.png': [1024, 1024],
  'assets/icon-pack/masters/ios-light-1024.png': [1024, 1024],
  'assets/icon-pack/masters/ios-dark-1024.png': [1024, 1024],
  'assets/icon-pack/masters/ios-tinted-1024.png': [1024, 1024],
  'assets/icon-pack/masters/brandmark-dark.png': [1024, 1024],
  'assets/icon-pack/masters/brandmark-light.png': [1024, 1024],
  'assets/icon-pack/android/adaptive/foreground.png': [1024, 1024],
  'assets/icon-pack/android/adaptive/background.png': [1024, 1024],
  'assets/icon-pack/android/adaptive/monochrome.png': [1024, 1024],
  'assets/icon-pack/android/notification/notification-icon-96.png': [96, 96],
  'assets/icon-pack/store/app-store-1024.png': [1024, 1024],
  'assets/icon-pack/store/google-play-512.png': [512, 512],
  'public/icons/favicon-16.png': [16, 16],
  'public/icons/favicon-32.png': [32, 32],
  'public/icons/favicon-48.png': [48, 48],
  'public/icons/apple-touch-icon.png': [180, 180],
  'public/icons/pwa-192.png': [192, 192],
  'public/icons/pwa-512.png': [512, 512],
  'public/icons/maskable-192.png': [192, 192],
  'public/icons/maskable-512.png': [512, 512],
  'public/icons/mstile-144.png': [144, 144],
};

function pngSize(file) {
  const b = readFileSync(file);
  if (b.length < 24 || b.toString('ascii', 1, 4) !== 'PNG') throw new Error(`${file} is not PNG`);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

for (const [rel, expected] of Object.entries(required)) {
  const path = resolve(root, rel);
  if (!existsSync(path)) throw new Error(`Missing icon asset: ${rel}`);
  const actual = pngSize(path);
  if (actual[0] !== expected[0] || actual[1] !== expected[1]) {
    throw new Error(`${rel} is ${actual.join('x')}; expected ${expected.join('x')}`);
  }
}

for (const rel of ['public/favicon.ico', 'public/manifest.json', 'public/site.webmanifest', 'public/browserconfig.xml', 'assets/icon-pack/ios/AppIcon.appiconset/Contents.json']) {
  if (!existsSync(resolve(root, rel))) throw new Error(`Missing required web/native metadata: ${rel}`);
}

const config = readFileSync(resolve(root, 'apps/mobile/app.config.ts'), 'utf8');
const requiredConfig = [
  "ios-light-1024.png",
  "ios-dark-1024.png",
  "ios-tinted-1024.png",
  "adaptive/foreground.png",
  "adaptive/background.png",
  "adaptive/monochrome.png",
  "notification-icon-96.png",
  "expo-splash-screen",
  "expo-notifications",
];
for (const token of requiredConfig) if (!config.includes(token)) throw new Error(`apps/mobile/app.config.ts missing ${token}`);

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
if (pkg.version !== '1.0.0') throw new Error(`Product version changed: ${pkg.version}`);
if (pkg.scripts?.['verify:icons'] !== 'node scripts/verify-icons.mjs') throw new Error('verify:icons script missing');

for (const rel of ['public/manifest.json', 'public/site.webmanifest']) {
  const manifest = JSON.parse(readFileSync(resolve(root, rel), 'utf8'));
  const purposes = new Set(manifest.icons.map((icon) => icon.purpose));
  if (!purposes.has('any') || !purposes.has('maskable')) throw new Error(`${rel} must include any + maskable icons`);
}

const mobileLogo = readFileSync(resolve(root, 'apps/mobile/components/brand/Logo.tsx'), 'utf8');
if (!mobileLogo.includes('brandmark-dark.png') || !mobileLogo.includes('brandmark-light.png')) throw new Error('Mobile brand component is not theme-aware');

console.log(`[icons] verified ${Object.keys(required).length} dimensioned assets + Expo/PWA/native wiring; version ${pkg.version}`);
