import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const workspaceRoots = ['apps', 'packages', 'backend'];
const manifests = [path.join(root, 'package.json')];

for (const dirName of workspaceRoots) {
  const dir = path.join(root, dirName);
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    continue;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifest = path.join(dir, entry.name, 'package.json');
    try {
      if ((await stat(manifest)).isFile()) manifests.push(manifest);
    } catch {}
  }
}

const packages = new Map();
for (const manifestPath of manifests) {
  const pkg = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (!pkg.name) throw new Error(`Workspace package missing name: ${path.relative(root, manifestPath)}`);
  packages.set(pkg.name, { pkg, manifestPath });
}

const rootPkg = packages.get('powerchain-capilot-mobile-dapp')?.pkg;
if (!rootPkg) throw new Error('Root package was not discovered');
if (rootPkg.packageManager !== 'pnpm@11.24.0') {
  throw new Error(`Expected packageManager pnpm@11.24.0, found ${rootPkg.packageManager ?? 'missing'}`);
}

for (const required of ['@powerchain/mobile', '@powerchain/operations-contracts', '@powerchain/operations-api']) {
  if (!packages.has(required)) throw new Error(`Required workspace package not discovered: ${required}`);
}

const dependencyFields = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
for (const [packageName, { pkg, manifestPath }] of packages) {
  for (const field of dependencyFields) {
    for (const [dependencyName, version] of Object.entries(pkg[field] ?? {})) {
      if (typeof version === 'string' && version.startsWith('workspace:') && !packages.has(dependencyName)) {
        throw new Error(`${packageName} references missing workspace package ${dependencyName} in ${path.relative(root, manifestPath)}`);
      }
    }
  }
}

console.log(`Workspace verification passed: ${packages.size} packages discovered.`);
console.log([...packages.keys()].sort().join('\n'));
