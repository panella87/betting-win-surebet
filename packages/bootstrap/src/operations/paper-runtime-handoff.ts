import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  closeSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import {
  getManagedBwsReadOnlyApiStatus,
  type BwsLifecycleRequest,
  type BwsOperatorLifecycleCommandResult,
} from './operator-lifecycle.js';

const BWS_PAPER_RUNTIME_HANDOFF_SCHEMA = 'bws.paper_runtime_handoff.v1' as const;
const PROGRAM = 'BWS_FULL_PLATFORM_IMPLEMENTATION_V1' as const;
const CURRENT_TASK = 'BWS-580' as const;
const SAFE_LOCAL_TERMINAL_GATE = 'BWS-580' as const;
const REPOSITORY_NAME = 'betting-win-surebet' as const;
const DEFAULT_RUNTIME_HANDOFF_DIRECTORY = 'runtime/bws-paper-runtime-handoff';
const DEFAULT_SOURCE_ARCHIVE_DIRECTORY = 'artifacts/bws-paper-runtime-handoff';

export interface BwsPaperRuntimeHandoffArchiveRecord {
  readonly archiveFile: string;
  readonly sha256: string;
  readonly sizeBytes: number;
}

export interface BwsPaperRuntimeHandoffRecord {
  readonly automation: Readonly<{
    readonly integrationStatus: 'pending_protected_controller_review';
    readonly machineReadableFormat: 'json';
    readonly nextGate: 'BWS-600';
  }>;
  readonly closedBoundary: Readonly<{
    readonly automaticFallback: 'forbidden';
    readonly execution: 'disabled';
    readonly providerConnections: 'disabled';
    readonly runtimeMode: 'paper';
  }>;
  readonly currentTask: typeof CURRENT_TASK;
  readonly generatedAt: string;
  readonly packaging: Readonly<{
    readonly sourceHandoffArchive: BwsPaperRuntimeHandoffArchiveRecord;
  }>;
  readonly process: Exclude<BwsOperatorLifecycleCommandResult['process'], { readonly ownership: 'missing' }>;
  readonly program: typeof PROGRAM;
  readonly repository: Readonly<{
    readonly name: typeof REPOSITORY_NAME;
    readonly root: string;
  }>;
  readonly runtime: Readonly<{
    readonly command: 'status';
    readonly configuration: BwsOperatorLifecycleCommandResult['configuration'];
    readonly evidenceFile: string;
    readonly health: BwsOperatorLifecycleCommandResult['health'];
    readonly outcome: 'running';
    readonly readiness: BwsOperatorLifecycleCommandResult['readiness'];
    readonly service: BwsOperatorLifecycleCommandResult['service'];
    readonly stateFile: string;
  }>;
  readonly safeLocalTerminalGate: typeof SAFE_LOCAL_TERMINAL_GATE;
  readonly schema: typeof BWS_PAPER_RUNTIME_HANDOFF_SCHEMA;
  readonly sourceFingerprints: BwsOperatorLifecycleCommandResult['sourceFingerprints'];
}

export interface CreateBwsPaperRuntimeHandoffResult {
  readonly archive: BwsPaperRuntimeHandoffArchiveRecord;
  readonly generatedAt: string;
  readonly handoff: BwsPaperRuntimeHandoffRecord;
  readonly handoffFile: string;
  readonly latestHandoffFile: string;
}

export interface CreateBwsPaperRuntimeHandoffRequest {
  readonly archiveFilePath?: string;
  readonly createSourceHandoffArchive?: CreateBwsSourceHandoffArchive;
  readonly getLifecycleStatus?: (request: BwsLifecycleRequest) => Promise<BwsOperatorLifecycleCommandResult>;
  readonly handoffFilePath?: string;
  readonly latestHandoffFilePath?: string;
  readonly lifecycleStatus?: BwsOperatorLifecycleCommandResult;
  readonly now?: () => string;
  readonly repositoryRoot?: string;
  readonly runtimeStateDirectory?: string;
}

export interface CreateBwsSourceHandoffArchiveRequest {
  readonly outputPath: string;
  readonly repositoryRoot: string;
}

export type CreateBwsSourceHandoffArchive = (
  request: CreateBwsSourceHandoffArchiveRequest,
) => BwsPaperRuntimeHandoffArchiveRecord;

export async function createBwsPaperRuntimeHandoff(
  request: CreateBwsPaperRuntimeHandoffRequest = {},
): Promise<CreateBwsPaperRuntimeHandoffResult> {
  const repositoryRoot = realpathSync(request.repositoryRoot ?? process.cwd());
  const now = request.now ?? defaultNow;
  const generatedAt = now();
  const lifecycleRequest: BwsLifecycleRequest = Object.freeze({
    repositoryRoot,
    ...(request.runtimeStateDirectory === undefined
      ? {}
      : { runtimeStateDirectory: request.runtimeStateDirectory }),
  });
  const lifecycleStatus = request.lifecycleStatus
    ?? await (request.getLifecycleStatus ?? getManagedBwsReadOnlyApiStatus)(lifecycleRequest);
  assertLifecycleStatusIsReady(lifecycleStatus);

  const handoffDirectory = resolveRepositoryPath(
    repositoryRoot,
    dirname(request.handoffFilePath ?? join(DEFAULT_RUNTIME_HANDOFF_DIRECTORY, 'latest.json')),
  );
  const versionedHandoffPath = resolveRepositoryPath(
    repositoryRoot,
    request.handoffFilePath
      ?? join(handoffDirectory, `handoff_${formatTimestampForFileName(generatedAt)}.json`),
  );
  const latestHandoffPath = resolveRepositoryPath(
    repositoryRoot,
    request.latestHandoffFilePath ?? join(handoffDirectory, 'latest.json'),
  );
  const archiveOutputPath = resolveRepositoryPath(
    repositoryRoot,
    request.archiveFilePath
      ?? join(
        DEFAULT_SOURCE_ARCHIVE_DIRECTORY,
        `source_handoff_${formatTimestampForFileName(generatedAt)}.tar.gz`,
      ),
  );
  validateArtifactPath(repositoryRoot, archiveOutputPath, 'BWS paper runtime handoff source archive path');

  const archive = (request.createSourceHandoffArchive ?? createSourceHandoffArchive)({
    outputPath: archiveOutputPath,
    repositoryRoot,
  });
  validateSourceArchiveRecord(repositoryRoot, archiveOutputPath, archive);
  const handoff: BwsPaperRuntimeHandoffRecord = Object.freeze({
    automation: Object.freeze({
      integrationStatus: 'pending_protected_controller_review',
      machineReadableFormat: 'json',
      nextGate: 'BWS-600',
    }),
    closedBoundary: Object.freeze({
      automaticFallback: 'forbidden',
      execution: 'disabled',
      providerConnections: 'disabled',
      runtimeMode: 'paper',
    }),
    currentTask: CURRENT_TASK,
    generatedAt,
    packaging: Object.freeze({
      sourceHandoffArchive: archive,
    }),
    process: lifecycleStatus.process,
    program: PROGRAM,
    repository: Object.freeze({
      name: REPOSITORY_NAME,
      root: repositoryRoot,
    }),
    runtime: Object.freeze({
      command: 'status',
      configuration: lifecycleStatus.configuration,
      evidenceFile: lifecycleStatus.evidenceFile,
      health: lifecycleStatus.health,
      outcome: 'running',
      readiness: lifecycleStatus.readiness,
      service: lifecycleStatus.service,
      stateFile: lifecycleStatus.stateFile,
    }),
    safeLocalTerminalGate: SAFE_LOCAL_TERMINAL_GATE,
    schema: BWS_PAPER_RUNTIME_HANDOFF_SCHEMA,
    sourceFingerprints: lifecycleStatus.sourceFingerprints,
  });

  writeJsonAtomically(repositoryRoot, versionedHandoffPath, handoff);
  writeJsonAtomically(repositoryRoot, latestHandoffPath, handoff);

  return Object.freeze({
    archive,
    generatedAt,
    handoff,
    handoffFile: relative(repositoryRoot, versionedHandoffPath),
    latestHandoffFile: relative(repositoryRoot, latestHandoffPath),
  });
}

export function createSourceHandoffArchive(
  request: CreateBwsSourceHandoffArchiveRequest,
): BwsPaperRuntimeHandoffArchiveRecord {
  const outputPath = resolveRepositoryPath(request.repositoryRoot, request.outputPath);
  const relativeOutputPath = relative(request.repositoryRoot, outputPath);
  validateArtifactPath(request.repositoryRoot, outputPath, 'BWS paper runtime handoff source archive path');
  rejectExistingPathSymlinkSegments(request.repositoryRoot, dirname(outputPath), 'BWS paper runtime handoff source archive directory');
  mkdirSync(dirname(outputPath), { recursive: true });
  rejectExistingPathSymlinkSegments(request.repositoryRoot, dirname(outputPath), 'BWS paper runtime handoff source archive directory');
  execFileSync('bash', ['scripts/create-source-handoff-archive.sh', relativeOutputPath], {
    cwd: request.repositoryRoot,
    encoding: 'utf-8',
    stdio: 'pipe',
  });

  if (!existsSync(outputPath) || !statSync(outputPath).isFile()) {
    throw new Error(`BWS paper runtime handoff source archive was not created: ${outputPath}`);
  }

  const archiveBytes = readFileSync(outputPath);
  return Object.freeze({
    archiveFile: relative(request.repositoryRoot, outputPath),
    sha256: createHash('sha256').update(archiveBytes).digest('hex'),
    sizeBytes: archiveBytes.byteLength,
  });
}

function assertLifecycleStatusIsReady(
  status: BwsOperatorLifecycleCommandResult,
): asserts status is BwsOperatorLifecycleCommandResult & {
  readonly outcome: 'running';
  readonly process: Exclude<BwsOperatorLifecycleCommandResult['process'], { readonly ownership: 'missing' }>;
} {
  if (status.command !== 'status') {
    throw new Error(`BWS paper runtime handoff requires lifecycle command=status. Received ${status.command}.`);
  }
  if (status.outcome !== 'running') {
    throw new Error(`BWS paper runtime handoff requires a running repo-owned API lifecycle. Received ${status.outcome}.`);
  }
  if ('ownership' in status.process) {
    throw new Error('BWS paper runtime handoff requires a persisted repo-owned lifecycle process.');
  }
  if (!statusProbeIsReady(status.health, 'health')) {
    throw new Error('BWS paper runtime handoff requires a healthy runtime status probe.');
  }
  if (!statusProbeIsReady(status.readiness, 'readiness')) {
    throw new Error('BWS paper runtime handoff requires a ready runtime status probe.');
  }
  if (status.configuration.policy.executionEnabled !== false) {
    throw new Error('BWS paper runtime handoff requires executionEnabled=false.');
  }
  if (status.configuration.policy.providerConnections !== 'disabled') {
    throw new Error('BWS paper runtime handoff requires providerConnections=disabled.');
  }
  if (status.configuration.policy.runtimeMode !== 'paper') {
    throw new Error('BWS paper runtime handoff requires runtimeMode=paper.');
  }
  for (const definition of status.configuration.processDefinitions) {
    if (definition.automaticFallback !== 'forbidden') {
      throw new Error(`BWS paper runtime handoff requires automaticFallback=forbidden for ${definition.processName}.`);
    }
  }
}

function statusProbeIsReady(
  probe: BwsOperatorLifecycleCommandResult['health'] | BwsOperatorLifecycleCommandResult['readiness'],
  label: 'health' | 'readiness',
): probe is Extract<BwsOperatorLifecycleCommandResult['health'], { readonly ok: boolean }> {
  if (!('ok' in probe)) {
    return false;
  }
  if (probe.ok !== true || probe.statusCode !== 200) {
    return false;
  }
  if (probe.body === null || typeof probe.body !== 'object' || Array.isArray(probe.body)) {
    return false;
  }
  if (!(label in probe.body)) {
    return false;
  }
  return true;
}

function resolveRepositoryPath(repositoryRoot: string, targetPath: string): string {
  const resolvedRoot = resolve(repositoryRoot);
  const resolvedPath = resolve(resolvedRoot, targetPath);
  if (!(resolvedPath === resolvedRoot || resolvedPath.startsWith(`${resolvedRoot}/`))) {
    throw new Error(`BWS paper runtime handoff paths must stay within the repository root. Received ${targetPath}.`);
  }
  return resolvedPath;
}

function writeJsonAtomically(repositoryRoot: string, filePath: string, value: unknown): void {
  rejectExistingPathSymlinkSegments(repositoryRoot, dirname(filePath), 'BWS paper runtime handoff output directory');
  if (existsSync(filePath) && lstatSync(filePath).isSymbolicLink()) {
    throw new Error(`BWS paper runtime handoff output path must not be a symlink: ${filePath}`);
  }
  mkdirSync(dirname(filePath), { recursive: true });
  rejectExistingPathSymlinkSegments(repositoryRoot, dirname(filePath), 'BWS paper runtime handoff output directory');
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  const temporaryFile = openSync(temporaryPath, 'wx', 0o600);
  let temporaryFileClosed = false;
  try {
    writeFileSync(temporaryFile, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
    closeSync(temporaryFile);
    temporaryFileClosed = true;
    renameSync(temporaryPath, filePath);
  } catch (error) {
    if (!temporaryFileClosed) {
      closeSync(temporaryFile);
    }
    rmSync(temporaryPath, { force: true });
    throw error;
  }
}

function validateArtifactPath(repositoryRoot: string, absolutePath: string, label: string): void {
  const root = realpathSync(repositoryRoot);
  const artifactsRoot = resolve(root, 'artifacts');
  const target = resolve(absolutePath);
  if (!(target === artifactsRoot || target.startsWith(`${artifactsRoot}/`))) {
    throw new Error(`${label} must stay under repository artifacts.`);
  }
  rejectExistingPathSymlinkSegments(root, target, label);
}

function validateSourceArchiveRecord(
  repositoryRoot: string,
  expectedOutputPath: string,
  archive: BwsPaperRuntimeHandoffArchiveRecord,
): void {
  const archivePath = resolveRepositoryPath(repositoryRoot, archive.archiveFile);
  if (archivePath !== expectedOutputPath) {
    throw new Error('BWS paper runtime handoff source archive record must match the requested archive path.');
  }
  validateArtifactPath(repositoryRoot, archivePath, 'BWS paper runtime handoff source archive record');
}

function rejectExistingPathSymlinkSegments(boundaryRoot: string, targetPath: string, label: string): void {
  const root = resolve(boundaryRoot);
  const target = resolve(targetPath);
  if (!(target === root || target.startsWith(`${root}/`))) {
    throw new Error(`${label} escapes repository: ${targetPath}`);
  }
  const relativePath = target.slice(root.length).replace(/^\//u, '');
  let current = root;
  for (const part of relativePath.split('/')) {
    if (part.length === 0) {
      continue;
    }
    current = join(current, part);
    if (!existsSync(current)) {
      break;
    }
    if (lstatSync(current).isSymbolicLink()) {
      throw new Error(`${label} must not contain symlinks: ${current}`);
    }
  }
}

function formatTimestampForFileName(value: string): string {
  return value.replace(/[:.]/g, '').replace(/-/g, '');
}

function defaultNow(): string {
  return new Date().toISOString();
}
