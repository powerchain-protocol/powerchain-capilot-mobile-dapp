import { readFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";

const roots = ["apps/mobile"];
const expected = [
  ["assets/icons/app-icon-light-1024.png", 1024, 1024],
  ["assets/icons/app-icon-dark-1024.png", 1024, 1024],
  ["assets/icons/app-icon-tinted-1024.png", 1024, 1024],
  ["assets/icons/adaptive-foreground.png", 1024, 1024],
  ["assets/icons/monochrome.png", 1024, 1024],
  ["assets/icons/notification-icon.png", 96, 96],
  ["assets/icons/favicon.png", 48, 48],
  ["assets/icons/splash-icon.png", 1024, 1024],
  ["assets/brand/logo-green.png", 1024, 1024],
  ["assets/brand/logo-white.png", 1024, 1024],
];

function pngSize(buf) {
  const sig = buf.subarray(0, 8).toString("hex");
  if (sig !== "89504e470d0a1a0a") throw new Error("not PNG");
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

let failed = false;
for (const root of roots) {
  for (const [relative, width, height] of expected) {
    const path = `${root}/${relative}`;
    try {
      const buf = await readFile(path);
      const [w, h] = pngSize(buf);
      const ok = w === width && h === height;
      console.log(`${ok ? "✓" : "✗"} ${path} ${w}x${h}`);
      if (!ok) failed = true;
    } catch (error) {
      failed = true;
      console.error(`✗ ${path}: ${error.message}`);
    }
  }
}

for (const path of [
  "apps/mobile/public/favicon.ico",
  "apps/mobile/public/manifest.json",
  "apps/mobile/public/pwa/icon-192x192.png",
  "apps/mobile/public/pwa/icon-512x512.png",
  "apps/mobile/public/pwa/maskable-icon-512x512.png",
  "docs/assets/app-icons/ICON-PACK-MANIFEST.json",
  "docs/assets/app-icons/ICON-PACK-VERSION",
]) {
  try {
    await access(path);
    console.log(`✓ ${path}`);
  } catch {
    failed = true;
    console.error(`✗ missing ${path}`);
  }
}

for (const configPath of ["apps/mobile/app.config.ts"]) {
  const text = await readFile(configPath, "utf8");
  const checks = [
    ['light iOS icon', 'light: "./assets/icons/app-icon-light-1024.png"'],
    ['dark iOS icon', 'dark: "./assets/icons/app-icon-dark-1024.png"'],
    ['tinted iOS icon', 'tinted: "./assets/icons/app-icon-tinted-1024.png"'],
    ['Android foreground', 'foregroundImage: "./assets/icons/adaptive-foreground.png"'],
    ['Android monochrome', 'monochromeImage: "./assets/icons/monochrome.png"'],
    ['notification icon', '"icon": "./assets/icons/notification-icon.png"'],
    ['web favicon', 'favicon: "./assets/icons/favicon.png"'],
  ];
  for (const [label, needle] of checks) {
    const ok = text.includes(needle);
    console.log(`${ok ? "✓" : "✗"} ${configPath}: ${label}`);
    if (!ok) failed = true;
  }
}

const manifest = JSON.parse(await readFile("docs/assets/app-icons/ICON-PACK-MANIFEST.json", "utf8"));
console.log(`✓ source icon pack manifest: ${manifest.name} ${manifest.version}`);

if (failed) process.exit(1);
