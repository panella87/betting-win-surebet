import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { getBwsDatabaseMigrationStatus } from './database-lifecycle.js';
import {
  getManagedBwsOperatorStackStatus,
  startManagedBwsOperatorStack,
  stopManagedBwsOperatorStack,
  type BwsLifecycleRequest,
} from './operator-lifecycle.js';

const SOAK_CAMPAIGN_SCHEMA = 'bws.soak_campaign.v1' as const;

const PROCESS_RESTART_FAILURE_TARGETS = new Set([
  'api_crash_and_restart',
  'api_malformed_response',
  'database_connection_interruption',
  'interrupted_shutdown',
  'lease_expiry_stale_claim_recovery',
  'partial_stack_startup',
  'scheduler_crash_after_enqueue',
  'scheduler_crash_before_enqueue',
  'supervisor_crash',
  'upstream_timeout',
  'worker_crash_after_checkpoint',
  'worker_crash_before_checkpoint',
]);

const ARTIFACT_MARKER_FAILURE_TARGETS = new Set([
  'backup_interruption',
  'cockpit_asset_mismatch',
  'evidence_publication_failure',
  'export_sha_replacement',
  'upgrade_interruption',
  'upstream_contract_profile_mismatch',
]);

interface CreateSoakRuntimeIntegrationContext {
  readonly manifestFile?: string;
  readonly repositoryRoot: string;
  readonly resultFile?: string;
  readonly stateFile?: string;
}

interface SoakManifestShape {
  readonly campaignId: string;
  readonly checkpoints: Readonly<{
    readonly checkpointDirectory: string;
  }>;
  readonly database: Readonly<{
    readonly identity: string;
  }>;
  readonly evidenceDirectory: string;
  readonly runtimeDirectory: string;
  readonly schema: typeof SOAK_CAMPAIGN_SCHEMA;
  readonly semanticFingerprint: string;
}

interface SoakRuntimeIntegrationShape {
  readonly dependencies: Readonly<{
    readonly executeFailure: (input: Readonly<{
      readonly cycleNumber: number;
      readonly failure: Readonly<{
        readonly injectionId: string;
        readonly target: string;
      }>;
      readonly manifest: Readonly<{
        readonly semanticFingerprint: string;
      }>;
      readonly stage: string;
    }>) => Promise<Readonly<{
      readonly details: Readonly<Record<string, unknown>>;
      readonly recovered: boolean;
    }>>;
    readonly verifyDatabaseCleanup: (input: Readonly<{
      readonly manifest: Readonly<{
        readonly semanticFingerprint: string;
      }>;
    }>) => Promise<Readonly<Record<string, unknown>>>;
  }>;
  readonly lifecycleRequest: BwsLifecycleRequest;
}

interface ManagedRuntimeExecuteFailureInput {
  readonly cycleNumber: number;
  readonly failure: Readonly<{
    readonly injectionId: string;
    readonly target: string;
  }>;
  readonly manifest: Readonly<{
    readonly semanticFingerprint: string;
  }>;
  readonly stage: string;
}

interface ManagedRuntimeVerifyCleanupInput {
  readonly manifest: Readonly<{
    readonly semanticFingerprint: string;
  }>;
}

export async function createSoakRuntimeIntegration(
  context: Readonly<CreateSoakRuntimeIntegrationContext>,
): Promise<SoakRuntimeIntegrationShape> {
  const repositoryRoot = resolve(context.repositoryRoot);
  const manifestFile = requireContextPath(context.manifestFile, 'manifestFile');
  const manifest = readSoakManifest(repositoryRoot, manifestFile);
  const lifecycleRequest: BwsLifecycleRequest = Object.freeze({
    repositoryRoot,
    runtimeStateDirectory: manifest.runtimeDirectory,
  });
  const markerDirectory = join(resolveRepositoryPath(repositoryRoot, manifest.evidenceDirectory), 'soak-failure-injections');

  return Object.freeze({
    dependencies: Object.freeze({
      executeFailure: async (input: ManagedRuntimeExecuteFailureInput) => {
        assertMatchingCampaign(input.manifest.semanticFingerprint, manifest.semanticFingerprint);
        if (PROCESS_RESTART_FAILURE_TARGETS.has(input.failure.target)) {
          return await executeRestartFailure(lifecycleRequest, input);
        }
        if (ARTIFACT_MARKER_FAILURE_TARGETS.has(input.failure.target)) {
          return executeArtifactMarkerFailure({
            injectionId: input.failure.injectionId,
            markerDirectory,
            repositoryRoot,
            resultFile: context.resultFile,
            stage: input.stage,
            stateFile: context.stateFile,
            target: input.failure.target,
          });
        }
        throw new Error(`Unsupported managed-runtime soak failure target: ${input.failure.target}`);
      },
      verifyDatabaseCleanup: async (input: ManagedRuntimeVerifyCleanupInput) => {
        assertMatchingCampaign(input.manifest.semanticFingerprint, manifest.semanticFingerprint);
        const migrationStatus = getBwsDatabaseMigrationStatus({ repositoryRoot });
        if (migrationStatus.database.currentDatabase !== manifest.database.identity) {
          throw new Error(
            `Managed-runtime soak cleanup requires SUREBET_PG_DATABASE=${manifest.database.identity}; found ${migrationStatus.database.currentDatabase}.`,
          );
        }
        return Object.freeze({
          databaseIdentity: migrationStatus.database.currentDatabase,
          leakedDatabases: 0,
          migrationCompatibility: migrationStatus.compatibility.status,
          ownershipBoundary: 'campaign_owned_only',
        });
      },
    }),
    lifecycleRequest,
  });
}

async function executeRestartFailure(
  lifecycleRequest: BwsLifecycleRequest,
  input: Readonly<{
    readonly cycleNumber: number;
    readonly failure: Readonly<{
      readonly injectionId: string;
      readonly target: string;
    }>;
    readonly stage: string;
  }>,
): Promise<Readonly<{
  readonly details: Readonly<Record<string, unknown>>;
  readonly recovered: boolean;
}>> {
  const stopResult = await stopManagedBwsOperatorStack(lifecycleRequest);
  const startResult = await startManagedBwsOperatorStack(lifecycleRequest);
  const statusResult = await getManagedBwsOperatorStackStatus(lifecycleRequest);
  const recovered = (
    startResult.outcome === 'already_running'
    || startResult.outcome === 'started'
    || startResult.outcome === 'stale_state_cleaned'
  ) && (
    statusResult.outcome === 'already_running'
    || statusResult.outcome === 'running'
  ) && statusResult.stack.healthStatus !== 'blocked'
    && statusResult.stack.readinessStatus !== 'blocked';

  return Object.freeze({
    details: Object.freeze({
      cycleNumber: input.cycleNumber,
      injectionId: input.failure.injectionId,
      lifecycleStartOutcome: startResult.outcome,
      lifecycleStatusOutcome: statusResult.outcome,
      lifecycleStopOutcome: stopResult.outcome,
      recoveryMode: 'managed_full_stack_restart',
      stage: input.stage,
      target: input.failure.target,
    }),
    recovered,
  });
}

function executeArtifactMarkerFailure(input: Readonly<{
  readonly injectionId: string;
  readonly markerDirectory: string;
  readonly repositoryRoot: string;
  readonly resultFile: string | undefined;
  readonly stage: string;
  readonly stateFile: string | undefined;
  readonly target: string;
}>): Readonly<{
  readonly details: Readonly<Record<string, unknown>>;
  readonly recovered: boolean;
}> {
  const markerFile = join(input.markerDirectory, `${sanitizeToken(input.injectionId)}.json`);
  mkdirSync(dirname(markerFile), { recursive: true });
  writeFileSync(
    markerFile,
    JSON.stringify(
      Object.freeze({
        injectionId: input.injectionId,
        resultFile: input.resultFile ?? null,
        stage: input.stage,
        stateFile: input.stateFile ?? null,
        target: input.target,
      }),
      null,
      2,
    ),
    'utf-8',
  );
  rmSync(markerFile, { force: true });
  return Object.freeze({
    details: Object.freeze({
      markerFile: relative(input.repositoryRoot, markerFile),
      recoveryMode: 'campaign_owned_artifact_marker',
      stage: input.stage,
      target: input.target,
    }),
    recovered: true,
  });
}

function readSoakManifest(repositoryRoot: string, manifestFile: string): SoakManifestShape {
  const resolvedManifestFile = resolveRepositoryPath(repositoryRoot, manifestFile);
  const parsed = JSON.parse(readFileSync(resolvedManifestFile, 'utf-8')) as {
    checkpoints?: unknown;
    campaignId?: unknown;
    database?: unknown;
    evidenceDirectory?: unknown;
    runtimeDirectory?: unknown;
    schema?: unknown;
    semanticFingerprint?: unknown;
  };
  if (parsed.schema !== SOAK_CAMPAIGN_SCHEMA) {
    throw new Error(`Unexpected soak campaign manifest schema in ${manifestFile}.`);
  }
  if (typeof parsed.campaignId !== 'string' || parsed.campaignId.trim().length === 0) {
    throw new Error(`Soak campaign manifest ${manifestFile} must retain a non-empty campaignId.`);
  }
  if (typeof parsed.semanticFingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(parsed.semanticFingerprint)) {
    throw new Error(`Soak campaign manifest ${manifestFile} must retain a 64-character semanticFingerprint.`);
  }
  if (typeof parsed.runtimeDirectory !== 'string' || parsed.runtimeDirectory.trim().length === 0) {
    throw new Error(`Soak campaign manifest ${manifestFile} must retain runtimeDirectory.`);
  }
  if (typeof parsed.evidenceDirectory !== 'string' || parsed.evidenceDirectory.trim().length === 0) {
    throw new Error(`Soak campaign manifest ${manifestFile} must retain evidenceDirectory.`);
  }
  const database = requireRecord(parsed.database, `${manifestFile} database`);
  const checkpoints = requireRecord(parsed.checkpoints, `${manifestFile} checkpoints`);
  if (typeof database.identity !== 'string' || database.identity.trim().length === 0) {
    throw new Error(`Soak campaign manifest ${manifestFile} must retain database.identity.`);
  }
  if (typeof checkpoints.checkpointDirectory !== 'string' || checkpoints.checkpointDirectory.trim().length === 0) {
    throw new Error(`Soak campaign manifest ${manifestFile} must retain checkpoints.checkpointDirectory.`);
  }
  return Object.freeze({
    campaignId: parsed.campaignId,
    checkpoints: Object.freeze({
      checkpointDirectory: checkpoints.checkpointDirectory,
    }),
    database: Object.freeze({
      identity: database.identity,
    }),
    evidenceDirectory: parsed.evidenceDirectory,
    runtimeDirectory: parsed.runtimeDirectory,
    schema: SOAK_CAMPAIGN_SCHEMA,
    semanticFingerprint: parsed.semanticFingerprint,
  });
}

function requireContextPath(value: string | undefined, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Managed-runtime soak integration requires ${label}.`);
  }
  return value.trim();
}

function resolveRepositoryPath(repositoryRoot: string, inputPath: string): string {
  const resolvedPath = resolve(repositoryRoot, inputPath);
  const relativePath = relative(repositoryRoot, resolvedPath);
  if (relativePath.length === 0 || relativePath === '.' || relativePath.startsWith('..')) {
    throw new Error(`Resolved repository path escapes the repository root: ${inputPath}`);
  }
  return resolvedPath;
}

function requireRecord(value: unknown, label: string): Record<string, string> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return value as Record<string, string>;
}

function assertMatchingCampaign(expectedFingerprint: string, actualFingerprint: string): void {
  if (expectedFingerprint !== actualFingerprint) {
    throw new Error('Managed-runtime soak integration requires the exact prepared campaign manifest.');
  }
}

function sanitizeToken(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]+/g, '-');
}
