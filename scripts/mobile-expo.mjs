import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { spawnSync } from 'node:child_process';
import './sync-mobile-public.mjs';

const root = resolve(import.meta.dirname, '..');
const localEnv = resolve(root, '.env.local');
if (existsSync(localEnv)) {
  loadEnvFile(localEnv);
}

const args = process.argv.slice(2);
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const result = spawnSync(pnpm, ['--filter', '@powerchain/mobile', 'exec', 'expo', ...args], {
  cwd: root,
  env: process.env,
  stdio: 'inherit',
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
