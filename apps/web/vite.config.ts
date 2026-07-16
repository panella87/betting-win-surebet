import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, type Plugin, type ResolvedConfig } from 'vite';

const COCKPIT_BUILD_METADATA_FILE = 'bws-cockpit-build.json';
const COCKPIT_BUILD_METADATA_SCHEMA = 'bws.operator_cockpit_build.v1';

function bwsCockpitBuildMetadataPlugin(): Plugin {
  let resolvedConfig: ResolvedConfig | undefined;
  return {
    configResolved(config) {
      resolvedConfig = config;
    },
    name: 'bws-cockpit-build-metadata',
    writeBundle() {
      if (resolvedConfig === undefined) {
        throw new Error('Vite config was not resolved before writing cockpit build metadata.');
      }
      const outputDirectory = resolvedConfig.build.outDir;
      mkdirSync(outputDirectory, { recursive: true });
      writeFileSync(
        join(outputDirectory, COCKPIT_BUILD_METADATA_FILE),
        `${JSON.stringify({
          apiBaseUrl: process.env.VITE_BWS_COCKPIT_API_BASE_URL ?? null,
          dataMode: process.env.VITE_BWS_COCKPIT_DATA_MODE ?? null,
          schema: COCKPIT_BUILD_METADATA_SCHEMA,
        }, null, 2)}\n`,
        'utf-8',
      );
    },
  };
}

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: '../../dist/apps/web',
  },
  plugins: [bwsCockpitBuildMetadataPlugin()],
});
