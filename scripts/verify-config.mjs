import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const rootApp = readJson('tsconfig.json');
const mobile = readJson('apps/mobile/tsconfig.json');
const node = readJson('tsconfig.node.json');
const server = readJson('tsconfig.server.json');
const express = readJson('backend/express/tsconfig.json');
const operations = readJson('backend/operations-api/tsconfig.json');
const docs = readJson('apps/docs/tsconfig.json');
const pkg = readJson('package.json');
const mobilePkg = readJson('apps/mobile/package.json');
const gitignore = readFileSync(resolve(root, '.gitignore'), 'utf8');

assert(pkg.packageManager === 'pnpm@11.24.0', 'Root packageManager must be pnpm@11.24.0.');
assert(mobilePkg.name === '@powerchain/mobile', 'Mobile workspace package is missing.');
assert(mobilePkg.main === 'expo-router/entry', 'Mobile workspace must use Expo Router entry.');
assert(!existsSync(resolve(root, 'src')), 'Legacy root src/ must be removed.');
for (const dir of ['app','components','services','hooks','config','types']) {
  assert(existsSync(resolve(root, 'apps/mobile', dir)), `apps/mobile/${dir} is missing.`);
}

for (const [name, config] of [['root compatibility', rootApp], ['mobile', mobile]]) {
  assert(config.extends === 'expo/tsconfig.base', `${name} tsconfig must extend expo/tsconfig.base.`);
  assert(config.compilerOptions?.noEmit === true, `${name} tsconfig must be noEmit.`);
  assert(config.compilerOptions?.strict === true, `${name} tsconfig must enable strict mode.`);
}
assert(mobile.compilerOptions?.paths?.['@/*']?.[0] === './*', 'Mobile @/* alias must resolve inside apps/mobile.');
assert(rootApp.compilerOptions?.paths?.['@/*']?.[0] === 'apps/mobile/*', 'Root compatibility alias must target apps/mobile.');

assert(node.compilerOptions?.moduleResolution === 'Bundler', 'Node base config must support explicit .ts imports used by tsx runtime.');
assert(node.compilerOptions?.allowImportingTsExtensions === true, 'Node base config must allow TypeScript extension imports.');
assert(node.compilerOptions?.noEmit === true, 'Node base config must not emit during typecheck.');
assert(node.compilerOptions?.types?.includes('node'), 'Node base config must load Node types.');
assert(server.extends === './tsconfig.node.json', 'Server config must extend Node base config.');
assert(express.extends === '../../tsconfig.node.json', 'Express gateway must not inherit Expo settings.');
assert(operations.extends === '../../tsconfig.node.json', 'Operations API must inherit Node base config.');
assert(docs.compilerOptions?.noEmit === true && docs.compilerOptions?.strict === true, 'Docs config must remain strict/noEmit.');

for (const envPath of ['.env.example', '.env.local']) assert(existsSync(resolve(root, envPath)), `${envPath} is missing at repository root.`);
const example = readFileSync(resolve(root, '.env.example'), 'utf8');
for (const token of ['EXPO_PUBLIC_API_URL=', 'DATABASE_URL=', 'SOLANA_NETWORK=', 'PWRC_DECIMALS=9', 'POWERCHAIN_CREDIT_TOKEN=PWRC']) {
  assert(example.includes(token), `.env.example missing ${token}`);
}

for (const pattern of ['node_modules/', '.expo/', '.next/', 'coverage/', '*.tsbuildinfo', '.env.*', '!.env.*.example', '__pycache__/', '*.py[cod]', '*.p12', '*.keystore', '.eas/', '*.ipa', '*.aab']) {
  assert(gitignore.includes(pattern), `.gitignore missing required pattern: ${pattern}`);
}
assert(pkg.scripts?.start?.includes('mobile-expo.mjs'), 'Root start script must delegate to apps/mobile.');
assert(pkg.scripts?.['server:typecheck'], 'package.json must expose server:typecheck.');
assert(pkg.scripts?.['express:typecheck'], 'package.json must expose express:typecheck.');
assert(pkg.scripts?.check?.includes('verify:config'), 'check must run verify:config first.');

console.log('Configuration verification passed.');
