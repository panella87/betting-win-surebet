import { execFileSync } from 'node:child_process';

const port = process.env.BWS_API_PORT;
if (typeof port !== 'string' || !/^\d+$/.test(port) || Number.parseInt(port, 10) <= 0) {
  throw new Error('BWS_API_PORT must be set to a base-10 positive integer before building the managed cockpit.');
}

const apiBaseUrl = `http://127.0.0.1:${port}`;
execFileSync(
  'npm',
  ['run', '--workspace', '@betting-win-surebet/web', 'build'],
  {
    env: {
      ...process.env,
      VITE_BWS_COCKPIT_API_BASE_URL: apiBaseUrl,
      VITE_BWS_COCKPIT_DATA_MODE: 'api',
    },
    stdio: 'inherit',
  },
);
