import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { writeBettingWinUpstreamLock } from '../../packages/upstream/src/index.js';

const WORKSPACE_PACKAGES = [
  '@betting-win/contracts',
  '@betting-win/foundation',
  '@betting-win/identity',
  '@betting-win/paper-ledger',
  '@betting-win/provider-collection',
  '@betting-win/provider-generation',
  '@betting-win/query-service',
  '@betting-win/quotes',
  '@betting-win/rules',
  '@betting-win/source-lineage',
  '@betting-win/evidence-import',
  '@betting-win/jobs',
  '@betting-win/api',
  '@betting-win/web',
  '@betting-win/workers',
] as const;

export function createFixtureBettingWinCheckout(upstreamRoot: string): void {
  mkdirSync(upstreamRoot, { recursive: true });

  writeJson(join(upstreamRoot, 'package.json'), {
    name: 'betting-win',
    private: true,
    version: '0.48.0',
    workspaces: ['packages/*', 'apps/*'],
  });

  for (const packageName of WORKSPACE_PACKAGES) {
    const [scope, slug] = packageName.split('/');
    if (scope === undefined || slug === undefined || scope.length === 0 || slug.length === 0) {
      throw new Error(`Invalid betting-win workspace package fixture name: ${packageName}`);
    }
    const workspaceRoot = slug === 'api' || slug === 'web' || slug === 'workers' ? 'apps' : 'packages';
    const workspacePath = join(upstreamRoot, workspaceRoot, slug);
    mkdirSync(workspacePath, { recursive: true });
    writeJson(join(workspacePath, 'package.json'), {
      name: `${scope}/${slug}`,
      private: true,
      type: 'module',
      version: '0.48.0',
    });
  }

  const providerCollectionSourcePath = join(upstreamRoot, 'packages', 'provider-collection', 'src');
  mkdirSync(providerCollectionSourcePath, { recursive: true });
  writeFileSync(
    join(providerCollectionSourcePath, 'index.ts'),
    [
      'export const downstreamContractFamily = {',
      "  schema: 'betting-win.strategy-export.v1',",
      "  canonicalContractAlias: 'betting-win-strategy-export.v1',",
      "  supportedProfiles: ['predictive_fixture_dataset_v0', 'surebet_standard_binary_v0'],",
      "  readOnlyFunctions: ['exportHistoricalBundle', 'getHistoricalQuotes', 'getProviderGenerations', 'inspectSourceLineage'],",
      '};',
    ].join('\n'),
    'utf-8',
  );

  runGit(upstreamRoot, ['init', '-q']);
  runGit(upstreamRoot, ['config', 'user.name', 'BWS Test']);
  runGit(upstreamRoot, ['config', 'user.email', 'bws-test@example.com']);
  runGit(upstreamRoot, ['add', '.']);
  runGit(upstreamRoot, ['commit', '-q', '-m', 'fixture']);
}

export function writeFixtureBettingWinUpstreamLock(input: Readonly<{
  readonly allowedBoundaryRoot: string;
  readonly repositoryRoot: string;
  readonly upstreamRoot: string;
  readonly verifiedAt: string;
}>): void {
  writeBettingWinUpstreamLock({
    allowedBoundaryRoot: input.allowedBoundaryRoot,
    bettingWinRepoPath: input.upstreamRoot,
    repositoryRoot: input.repositoryRoot,
    schemaPath: join(input.repositoryRoot, 'schemas', 'betting-win-upstream-lock.v1.schema.json'),
    verifiedAt: input.verifiedAt,
  });
}

function runGit(cwd: string, args: readonly string[]): string {
  return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf-8', stdio: 'pipe' });
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}
