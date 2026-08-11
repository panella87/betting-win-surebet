import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import {
  buildReadOnlyQueryContractRequest,
  createReadOnlyQueryApiClient,
  describeReadOnlyQueryApiClientBoundary,
} from '../src/adapters/betting-win-query-client.js';
import type { BettingWinUpstreamLock } from '../packages/upstream/src/upstream/betting-win-upstream-lock.js';

const TEST_TIMESTAMP = '2026-07-14T10:00:00.000Z';

test('read-only query client exposes the BWS-140 boundary marker', () => {
  assert.equal(describeReadOnlyQueryApiClientBoundary(), '@betting-win-surebet/bootstrap:BWS-140');
});

test('read-only query client rejects malformed contract versions before config dereference escapes', () => {
  for (const contractVersion of [undefined, 42, '   ']) {
    const result = createReadOnlyQueryApiClient({
      baseUrl: 'http://betting-win-query.test',
      contractVersion,
      fetchImplementation: globalThis.fetch.bind(globalThis),
      maxPageSize: 50,
      retryBackoffMs: 5,
      retryLimit: 1,
      timeoutMs: 25,
      upstreamLock: sampleUpstreamLock(),
    } as never);
    assert.equal(result.ok, false);
    assert.equal(result.blockers[0]?.code, 'QUERY_CONTRACT_NOT_PINNED');
  }

  const request = buildReadOnlyQueryContractRequest(undefined as never);
  assert.equal(request.ok, false);
  assert.equal(request.blockers[0]?.code, 'QUERY_CONTRACT_REQUEST_INVALID');
});

test('read-only query client rejects invalid base URLs and explicit credentialed endpoints', () => {
  const invalidUrl = createReadOnlyQueryApiClient({
    baseUrl: 'not-a-url',
    contractVersion: '1.0.0',
    fetchImplementation: globalThis.fetch.bind(globalThis),
    maxPageSize: 50,
    retryBackoffMs: 5,
    retryLimit: 1,
    timeoutMs: 25,
    upstreamLock: sampleUpstreamLock(),
  });
  assert.equal(invalidUrl.ok, false);
  assert.equal(invalidUrl.blockers[0]?.code, 'QUERY_BASE_URL_INVALID');

  const credentialedUrl = createReadOnlyQueryApiClient({
    baseUrl: 'https://user:pass@example.test/read-only',
    contractVersion: '1.0.0',
    fetchImplementation: globalThis.fetch.bind(globalThis),
    maxPageSize: 50,
    retryBackoffMs: 5,
    retryLimit: 1,
    timeoutMs: 25,
    upstreamLock: sampleUpstreamLock(),
  });
  assert.equal(credentialedUrl.ok, false);
  assert.equal(credentialedUrl.blockers[0]?.code, 'QUERY_BASE_URL_CREDENTIALS_FORBIDDEN');

  for (const baseUrl of [
    'http://127.0.0.1:4312',
    'http://127.0.0.2:4312',
    'http://127.1.2.3:4312',
    'http://127.2.3.4:4312',
    'http://127.255.255.255:4312',
    'http://localhost:4312',
    'http://[::1]:4312',
    'http://[::ffff:127.0.0.1]:4312',
    'http://[::ffff:127.0.0.2]:4312',
    'http://[::ffff:127.2.3.4]:4312',
    'http://[::ffff:7f00:1]:4312',
    'http://[::ffff:7f01:203]:4312',
    'http://[::ffff:7f02:304]:4312',
    'http://0.0.0.0:4312',
    'http://[::]:4312',
  ]) {
    const localBwsApi = createReadOnlyQueryApiClient({
      baseUrl,
      contractVersion: '1.0.0',
      fetchImplementation: globalThis.fetch.bind(globalThis),
      maxPageSize: 50,
      retryBackoffMs: 5,
      retryLimit: 1,
      timeoutMs: 25,
      upstreamLock: sampleUpstreamLock(),
    });
    assert.equal(localBwsApi.ok, false);
    assert.equal(localBwsApi.blockers[0]?.code, 'QUERY_BASE_URL_LOCAL_BWS_API_FORBIDDEN');
  }

  for (const baseUrl of [
    'http://localhost:4301',
    'http://127.0.0.2:4301',
    'http://127.1.2.3:4301',
    'http://127.255.255.255:4301',
    'http://[::ffff:127.0.0.2]:4301',
    'http://[::ffff:127.2.3.4]:4301',
    'http://[::ffff:7f02:304]:4301',
  ]) {
    const configuredLocalBwsApi = createReadOnlyQueryApiClient({
      baseUrl,
      contractVersion: '1.0.0',
      fetchImplementation: globalThis.fetch.bind(globalThis),
      localBwsApiPort: 4301,
      maxPageSize: 50,
      retryBackoffMs: 5,
      retryLimit: 1,
      timeoutMs: 25,
      upstreamLock: sampleUpstreamLock(),
    });
    assert.equal(configuredLocalBwsApi.ok, false);
    assert.equal(configuredLocalBwsApi.blockers[0]?.code, 'QUERY_BASE_URL_LOCAL_BWS_API_FORBIDDEN');
  }

  for (const baseUrl of ['http://0.0.0.0:4301', 'http://[::]:4301']) {
    const configuredUnspecifiedLocalBwsApi = createReadOnlyQueryApiClient({
      baseUrl,
      contractVersion: '1.0.0',
      fetchImplementation: globalThis.fetch.bind(globalThis),
      localBwsApiPort: 4301,
      maxPageSize: 50,
      retryBackoffMs: 5,
      retryLimit: 1,
      timeoutMs: 25,
      upstreamLock: sampleUpstreamLock(),
    });
    assert.equal(configuredUnspecifiedLocalBwsApi.ok, false);
    assert.equal(configuredUnspecifiedLocalBwsApi.blockers[0]?.code, 'QUERY_BASE_URL_LOCAL_BWS_API_FORBIDDEN');
  }

  const externalUnspecifiedPort = createReadOnlyQueryApiClient({
    baseUrl: 'http://0.0.0.0:4302',
    contractVersion: '1.0.0',
    fetchImplementation: globalThis.fetch.bind(globalThis),
    localBwsApiPort: 4301,
    maxPageSize: 50,
    retryBackoffMs: 5,
    retryLimit: 1,
    timeoutMs: 25,
    upstreamLock: sampleUpstreamLock(),
  });
  assert.equal(externalUnspecifiedPort.ok, true);

  for (const localBwsApiPort of [1, 65_535]) {
    const validLocalBwsApiPort = createReadOnlyQueryApiClient({
      baseUrl: 'http://betting-win-query.test/read-only',
      contractVersion: '1.0.0',
      fetchImplementation: globalThis.fetch.bind(globalThis),
      localBwsApiPort,
      maxPageSize: 50,
      retryBackoffMs: 5,
      retryLimit: 1,
      timeoutMs: 25,
      upstreamLock: sampleUpstreamLock(),
    });
    assert.equal(validLocalBwsApiPort.ok, true);
  }

  for (const localBwsApiPort of [0, 65_536, 1.5, '4301', Number.MAX_SAFE_INTEGER + 1]) {
    const invalidLocalBwsApiPort = createReadOnlyQueryApiClient({
      baseUrl: 'http://localhost:4301',
      contractVersion: '1.0.0',
      fetchImplementation: globalThis.fetch.bind(globalThis),
      localBwsApiPort,
      maxPageSize: 50,
      retryBackoffMs: 5,
      retryLimit: 1,
      timeoutMs: 25,
      upstreamLock: sampleUpstreamLock(),
    } as never);
    assert.equal(invalidLocalBwsApiPort.ok, false);
    assert.equal(invalidLocalBwsApiPort.blockers[0]?.code, 'QUERY_LOCAL_BWS_API_PORT_INVALID');
  }
});

test('read-only query client rejects unsupported per-resource filter keys before fetch', async () => {
  let fetchTouched = false;
  const client = createReadOnlyQueryApiClient({
    baseUrl: 'http://127.0.0.1:9999/read-only',
    contractVersion: '1.0.0',
    fetchImplementation: async () => {
      fetchTouched = true;
      throw new Error('fetch should not be called');
    },
    maxPageSize: 50,
    retryBackoffMs: 5,
    retryLimit: 1,
    timeoutMs: 25,
    upstreamLock: sampleUpstreamLock(),
  });
  assert.equal(client.ok, true);

  const result = await client.value.queryIdentity({
    filters: {
      canonicalId: 'market-001',
      unsupportedSecretToken: 'abc',
    } as never,
    pageSize: 1,
  });

  assert.equal(result.ok, false);
  assert.equal(result.blockers[0]?.code, 'QUERY_FILTER_UNSUPPORTED');
  assert.equal(fetchTouched, false);
});

test('read-only query client rejects noncanonical per-resource filter values before fetch', async () => {
  let fetchTouched = false;
  const client = createReadOnlyQueryApiClient({
    baseUrl: 'http://127.0.0.1:9999/read-only',
    contractVersion: '1.0.0',
    fetchImplementation: async () => {
      fetchTouched = true;
      throw new Error('fetch should not be called');
    },
    maxPageSize: 50,
    retryBackoffMs: 5,
    retryLimit: 1,
    timeoutMs: 25,
    upstreamLock: sampleUpstreamLock(),
  });
  assert.equal(client.ok, true);

  const identityResult = await client.value.queryIdentity({
    filters: {
      canonicalId: ' market-001 ',
    },
    pageSize: 1,
  });
  assert.equal(identityResult.ok, false);
  assert.deepEqual(identityResult.blockers, [
    {
      code: 'QUERY_FILTER_VALUE_INVALID',
      message: 'Read-only query filter canonicalId must be a canonical non-empty string.',
      evidenceRequired: 'Typed read-only query filter value for identity.',
    },
  ]);

  const rulesResult = await client.value.queryRules({
    filters: {
      provider: ' polymarket ',
    },
    pageSize: 1,
  });
  assert.equal(rulesResult.ok, false);
  assert.deepEqual(rulesResult.blockers, [
    {
      code: 'QUERY_FILTER_VALUE_INVALID',
      message: 'Read-only query filter provider must be a canonical non-empty string.',
      evidenceRequired: 'Typed read-only query filter value for rules.',
    },
  ]);

  const quotesResult = await client.value.queryQuotes({
    filters: {
      marketId: ' market-001 ',
    },
    pageSize: 1,
  });
  assert.equal(quotesResult.ok, false);
  assert.deepEqual(quotesResult.blockers, [
    {
      code: 'QUERY_FILTER_VALUE_INVALID',
      message: 'Read-only query filter marketId must be a canonical non-empty string.',
      evidenceRequired: 'Typed read-only query filter value for quotes.',
    },
  ]);

  const settlementResult = await client.value.querySettlement({
    filters: {
      provider: '   ',
    },
    pageSize: 1,
  });
  assert.equal(settlementResult.ok, false);
  assert.deepEqual(settlementResult.blockers, [
    {
      code: 'QUERY_FILTER_VALUE_INVALID',
      message: 'Read-only query filter provider must be a canonical non-empty string.',
      evidenceRequired: 'Typed read-only query filter value for settlement.',
    },
  ]);

  assert.equal(fetchTouched, false);
});

test('read-only query client negotiates identity queries and validates pagination against loopback fixtures', async () => {
  await withLoopbackServer(async (baseUrl) => {
    const client = createClient(baseUrl);
    assert.equal(client.ok, true);

    const result = await client.value.queryIdentity({
      filters: {
        entityType: 'sport',
        provider: 'polymarket',
      },
      pageSize: 1,
    });

    assert.equal(result.ok, true);
    assert.equal(result.value.resource, 'identity');
    assert.equal(result.value.page.pageSize, 1);
    assert.equal(result.value.page.returnedCount, 1);
    assert.equal(result.value.page.nextCursor, 'cursor.identity.1');
    assert.equal(result.value.page.items[0]?.canonicalId, 'sport.soccer');
    assert.equal(result.value.provenance.commitSha, sampleUpstreamLock().commitSha);
  }, (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    assert.equal(url.pathname, '/query/identity-entities');
    assert.equal(url.searchParams.get('pageSize'), '1');
    assert.equal(url.searchParams.get('entityType'), 'sport');
    assert.equal(url.searchParams.get('provider'), 'polymarket');
    assert.deepEqual(url.searchParams.getAll('expand'), ['providerReferences']);
    assert.equal(request.headers['x-betting-win-contract-version'], '1.0.0');
    assert.equal(request.headers['x-betting-win-query-resource'], 'identity');

    writeJson(response, 200, createEnvelope('identity', {
      page: {
        items: [
          {
            canonicalId: 'sport.soccer',
            entityType: 'sport',
            providerReferences: [
              {
                provider: 'polymarket',
                providerGeneration: 'pm-gen-001',
                sourceLineageRecordId: 'record-001',
              },
            ],
          },
        ],
        nextCursor: 'cursor.identity.1',
        pageSize: 1,
        returnedCount: 1,
      },
    }));
  });
});

test('read-only query client rejects noncanonical identity rules and normalized response strings', async () => {
  let requestCount = 0;
  const client = createReadOnlyQueryApiClient({
    baseUrl: 'http://betting-win-query.test/read-only',
    contractVersion: '1.0.0',
    fetchImplementation: async () => {
      requestCount += 1;
      if (requestCount === 1) {
        return new Response(`${JSON.stringify(createEnvelope('identity', {
          page: {
            items: [
              {
                canonicalId: ' sport.soccer ',
                entityType: 'sport',
                providerReferences: [
                  {
                    provider: 'polymarket',
                    providerGeneration: 'pm-gen-001',
                    sourceLineageRecordId: 'record-identity-001',
                  },
                ],
              },
            ],
            pageSize: 1,
            returnedCount: 1,
          },
        }))}\n`, {
          headers: { 'content-type': 'application/json' },
          status: 200,
        });
      }
      if (requestCount === 2) {
        return new Response(`${JSON.stringify(createEnvelope('rules', {
          page: {
            items: [
              {
                resultSource: { resultSourceId: 'result-source-001' },
                ruleProfile: { ruleProfileId: ' rule-profile-001 ' },
              },
            ],
            pageSize: 1,
            returnedCount: 1,
          },
        }))}\n`, {
          headers: { 'content-type': 'application/json' },
          status: 200,
        });
      }
      if (requestCount === 3) {
        return new Response(`${JSON.stringify(createEnvelope('quotes', {
          page: {
            items: [
              {
                normalizedEvidence: {
                  provider: 'polymarket',
                  providerGenerationId: ' pm-gen-001 ',
                  sourceLineageRecordId: 'record-quote-001',
                },
                recordType: 'evidence',
              },
            ],
            pageSize: 1,
            returnedCount: 1,
          },
        }))}\n`, {
          headers: { 'content-type': 'application/json' },
          status: 200,
        });
      }
      return new Response(`${JSON.stringify(createEnvelope('settlement', {
        page: {
          items: [
            {
              normalizedRejection: {
                provider: 'polymarket',
                providerGenerationId: 'pm-gen-001',
                sourceLineageRecordId: ' record-settlement-001 ',
              },
              recordType: 'rejection',
            },
          ],
          pageSize: 1,
          returnedCount: 1,
        },
      }))}\n`, {
        headers: { 'content-type': 'application/json' },
        status: 200,
      });
    },
    maxPageSize: 50,
    retryBackoffMs: 5,
    retryLimit: 1,
    timeoutMs: 50,
    upstreamLock: sampleUpstreamLock(),
  });
  assert.equal(client.ok, true);

  const identityResult = await client.value.queryIdentity({
    filters: {
      entityType: 'sport',
    },
    pageSize: 1,
  });
  assert.equal(identityResult.ok, false);
  assert.equal(identityResult.blockers[0]?.code, 'QUERY_PROVENANCE_INVALID');

  const rulesResult = await client.value.queryRules({
    filters: {
      provider: 'polymarket',
    },
    pageSize: 1,
  });
  assert.equal(rulesResult.ok, false);
  assert.equal(rulesResult.blockers[0]?.code, 'QUERY_RULES_ITEM_INVALID');

  const quotesResult = await client.value.queryQuotes({
    filters: {
      marketId: 'market-001',
    },
    pageSize: 1,
  });
  assert.equal(quotesResult.ok, false);
  assert.equal(quotesResult.blockers[0]?.code, 'QUERY_PROVENANCE_INVALID');

  const settlementResult = await client.value.querySettlement({
    filters: {
      marketId: 'market-001',
    },
    pageSize: 1,
  });
  assert.equal(settlementResult.ok, false);
  assert.equal(settlementResult.blockers[0]?.code, 'QUERY_PROVENANCE_INVALID');
});

test('read-only query client fails closed on contract negotiation mismatches', async () => {
  await withLoopbackServer(async (baseUrl) => {
    const client = createClient(baseUrl);
    assert.equal(client.ok, true);

    const result = await client.value.queryRules({
      filters: {
        provider: 'polymarket',
      },
      pageSize: 1,
    });

    assert.equal(result.ok, false);
    assert.equal(result.blockers[0]?.code, 'QUERY_CONTRACT_NEGOTIATION_FAILED');
  }, (_request, response) => {
    writeJson(response, 200, createEnvelope('rules', {
      contractVersion: '2.0.0',
      page: {
        items: [
          {
            resultSource: { resultSourceId: 'result-source-001' },
            ruleProfile: { ruleProfileId: 'rule-profile-001' },
          },
        ],
        pageSize: 1,
        returnedCount: 1,
      },
    }));
  });
});

test('read-only query client rejects response provenance with mismatched lock verification time', async () => {
  const client = createReadOnlyQueryApiClient({
    baseUrl: 'http://betting-win-query.test/read-only',
    contractVersion: '1.0.0',
    fetchImplementation: async () => new Response(`${JSON.stringify(createEnvelope('rules', {
      page: {
        items: [
          {
            resultSource: { resultSourceId: 'result-source-001' },
            ruleProfile: { ruleProfileId: 'rule-profile-001' },
          },
        ],
        pageSize: 1,
        returnedCount: 1,
      },
      provenance: {
        commitSha: sampleUpstreamLock().commitSha,
        repository: 'betting-win',
        responseReceivedAt: TEST_TIMESTAMP,
        sourceView: 'committed_git_head',
        verifiedAt: '2026-07-14T10:00:01.000Z',
      },
    }))}\n`, {
      headers: { 'content-type': 'application/json' },
      status: 200,
    }),
    maxPageSize: 50,
    retryBackoffMs: 5,
    retryLimit: 1,
    timeoutMs: 50,
    upstreamLock: sampleUpstreamLock(),
  });
  assert.equal(client.ok, true);

  const result = await client.value.queryRules({
    filters: {
      provider: 'polymarket',
    },
    pageSize: 1,
  });

  assert.equal(result.ok, false);
  assert.equal(result.blockers[0]?.code, 'QUERY_PROVENANCE_MISMATCH');
});

test('read-only query client rejects regex-shaped impossible response provenance timestamps', async () => {
  for (const provenance of [
    Object.freeze({ responseReceivedAt: '2026-99-99T99:99:99.999Z' }),
    Object.freeze({ verifiedAt: '2026-99-99T99:99:99.999Z' }),
  ] as const) {
    const client = createReadOnlyQueryApiClient({
      baseUrl: 'http://betting-win-query.test/read-only',
      contractVersion: '1.0.0',
      fetchImplementation: async () => new Response(`${JSON.stringify(createEnvelope('rules', {
        page: {
          items: [
            {
              resultSource: { resultSourceId: 'result-source-001' },
              ruleProfile: { ruleProfileId: 'rule-profile-001' },
            },
          ],
          pageSize: 1,
          returnedCount: 1,
        },
        provenance: {
          commitSha: sampleUpstreamLock().commitSha,
          repository: 'betting-win',
          responseReceivedAt: TEST_TIMESTAMP,
          sourceView: 'committed_git_head',
          verifiedAt: TEST_TIMESTAMP,
          ...provenance,
        },
      }))}\n`, {
        headers: { 'content-type': 'application/json' },
        status: 200,
      }),
      maxPageSize: 50,
      retryBackoffMs: 5,
      retryLimit: 1,
      timeoutMs: 50,
      upstreamLock: sampleUpstreamLock(),
    });
    assert.equal(client.ok, true);

    const result = await client.value.queryRules({
      filters: {
        provider: 'polymarket',
      },
      pageSize: 1,
    });

    assert.equal(result.ok, false);
    assert.equal(result.blockers[0]?.code, 'QUERY_PROVENANCE_FORMAT_INVALID');
  }
});

test('read-only query client retries retryable quote errors before succeeding', async () => {
  let attempts = 0;
  await withLoopbackServer(async (baseUrl) => {
    const client = createClient(baseUrl, {
      retryBackoffMs: 1,
      retryLimit: 2,
      timeoutMs: 100,
    });
    assert.equal(client.ok, true);

    const result = await client.value.queryQuotes({
      filters: {
        marketId: 'market-001',
        provider: 'polymarket',
      },
      pageSize: 1,
    });

    assert.equal(result.ok, true);
    assert.equal(result.value.page.items[0]?.recordType, 'evidence');
    assert.equal(attempts, 2);
  }, (_request, response) => {
    attempts += 1;
    if (attempts === 1) {
      response.statusCode = 503;
      response.setHeader('content-type', 'application/json');
      response.end('{"error":"retry"}');
      return;
    }
    writeJson(response, 200, createEnvelope('quotes', {
      page: {
        items: [
          {
            normalizedEvidence: {
              provider: 'polymarket',
              providerGenerationId: 'pm-gen-001',
              sourceLineageRecordId: 'record-quote-001',
            },
            recordType: 'evidence',
          },
        ],
        pageSize: 1,
        returnedCount: 1,
      },
    }));
  });
});

test('read-only query client fails closed on timeout and does not silently fall back', async () => {
  await withLoopbackServer(async (baseUrl) => {
    const client = createClient(baseUrl, {
      retryBackoffMs: 1,
      retryLimit: 0,
      timeoutMs: 10,
    });
    assert.equal(client.ok, true);

    const result = await client.value.querySettlement({
      filters: {
        marketId: 'market-001',
        provider: 'polymarket',
      },
      pageSize: 1,
    });

    assert.equal(result.ok, false);
    assert.equal(result.blockers[0]?.code, 'QUERY_TIMEOUT');
  }, async (_request, response) => {
    await sleep(40);
    writeJson(response, 200, createEnvelope('settlement', {
      page: {
        items: [
          {
            normalizedEvidence: {
              provider: 'polymarket',
              providerGenerationId: 'pm-gen-001',
              sourceLineageRecordId: 'record-settlement-001',
            },
            recordType: 'evidence',
          },
        ],
        pageSize: 1,
        returnedCount: 1,
      },
    }));
  });
});

test('read-only query client rejects missing normalized-record provenance and incompatible resources', async () => {
  let requestCount = 0;
  await withLoopbackServer(async (baseUrl) => {
    const client = createClient(baseUrl);
    assert.equal(client.ok, true);

    const missingProvenance = await client.value.queryQuotes({
      filters: {
        marketId: 'market-001',
        provider: 'polymarket',
      },
      pageSize: 1,
    });
    assert.equal(missingProvenance.ok, false);
    assert.equal(missingProvenance.blockers[0]?.code, 'QUERY_PROVENANCE_INVALID');

    const missingGeneration = await client.value.querySettlement({
      filters: {
        marketId: 'market-001',
        provider: 'polymarket',
      },
      pageSize: 1,
    });
    assert.equal(missingGeneration.ok, false);
    assert.equal(missingGeneration.blockers[0]?.code, 'QUERY_PROVENANCE_INVALID');

    const missingIdentityGeneration = await client.value.queryIdentity({
      filters: {
        entityType: 'sport',
        provider: 'polymarket',
      },
      pageSize: 1,
    });
    assert.equal(missingIdentityGeneration.ok, false);
    assert.equal(missingIdentityGeneration.blockers[0]?.code, 'QUERY_PROVENANCE_INVALID');

    const incompatibleResource = await client.value.queryIdentity({
      filters: {
        entityType: 'sport',
      },
      pageSize: 1,
    });
    assert.equal(incompatibleResource.ok, false);
    assert.equal(incompatibleResource.blockers[0]?.code, 'QUERY_RESOURCE_INCOMPATIBLE');
  }, (_request, response) => {
    requestCount += 1;
    if (requestCount === 1) {
      writeJson(response, 200, createEnvelope('quotes', {
        page: {
          items: [
            {
              normalizedEvidence: {
                provider: 'polymarket',
                providerGenerationId: 'pm-gen-001',
              },
              recordType: 'evidence',
            },
          ],
          pageSize: 1,
          returnedCount: 1,
        },
      }));
      return;
    }
    if (requestCount === 2) {
      writeJson(response, 200, createEnvelope('settlement', {
        page: {
          items: [
            {
              normalizedRejection: {
                provider: 'polymarket',
                sourceLineageRecordId: 'record-settlement-001',
              },
              recordType: 'rejection',
            },
          ],
          pageSize: 1,
          returnedCount: 1,
        },
      }));
      return;
    }
    if (requestCount === 3) {
      writeJson(response, 200, createEnvelope('identity', {
        page: {
          items: [
            {
              canonicalId: 'sport.soccer',
              entityType: 'sport',
              providerReferences: [
                {
                  provider: 'polymarket',
                  sourceLineageRecordId: 'record-identity-001',
                },
              ],
            },
          ],
          pageSize: 1,
          returnedCount: 1,
        },
      }));
      return;
    }

    writeJson(response, 200, createEnvelope('rules', {
      page: {
        items: [
          {
            resultSource: { resultSourceId: 'result-source-001' },
            ruleProfile: { ruleProfileId: 'rule-profile-001' },
          },
        ],
        pageSize: 1,
        returnedCount: 1,
      },
    }));
  });
});

test('read-only query client rejects inconsistent pagination metadata', async () => {
  await withLoopbackServer(async (baseUrl) => {
    const client = createClient(baseUrl);
    assert.equal(client.ok, true);

    const result = await client.value.queryRules({
      filters: {
        provider: 'polymarket',
      },
      pageSize: 2,
    });

    assert.equal(result.ok, false);
    assert.equal(result.blockers[0]?.code, 'QUERY_PAGINATION_INVALID');
  }, (_request, response) => {
    writeJson(response, 200, createEnvelope('rules', {
      page: {
        items: [
          {
            resultSource: { resultSourceId: 'result-source-001' },
            ruleProfile: { ruleProfileId: 'rule-profile-001' },
          },
        ],
        pageSize: 2,
        returnedCount: 2,
      },
    }));
  });
});

function createClient(
  baseUrl: string,
  overrides: Partial<{
    readonly maxPageSize: number;
    readonly retryBackoffMs: number;
    readonly retryLimit: number;
    readonly timeoutMs: number;
  }> = {},
) {
  return createReadOnlyQueryApiClient({
    baseUrl,
    contractVersion: '1.0.0',
    fetchImplementation: globalThis.fetch.bind(globalThis),
    maxPageSize: overrides.maxPageSize ?? 50,
    retryBackoffMs: overrides.retryBackoffMs ?? 5,
    retryLimit: overrides.retryLimit ?? 1,
    timeoutMs: overrides.timeoutMs ?? 50,
    upstreamLock: sampleUpstreamLock(),
  });
}

async function withLoopbackServer(
  run: (baseUrl: string) => Promise<void>,
  handler: (
    request: IncomingMessage,
    response: ServerResponse<IncomingMessage>,
  ) => void | Promise<void>,
): Promise<void> {
  const server = createServer((request, response) => {
    Promise.resolve(handler(request, response)).catch((error: unknown) => {
      response.statusCode = 500;
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'unknown error' }));
    });
  });

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, 'object');
  const loopbackAddress = address as AddressInfo;

  try {
    await run(`http://127.0.0.1:${loopbackAddress.port}`);
  } finally {
    server.close();
    await once(server, 'close');
  }
}

function createEnvelope(
  resource: 'identity' | 'quotes' | 'rules' | 'settlement',
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    contractAlias: 'betting-win-strategy-export.v1',
    contractSchema: 'betting-win.strategy-export.v1',
    contractVersion: '1.0.0',
    page: {
      items: [],
      pageSize: 1,
      returnedCount: 0,
    },
    provenance: {
      commitSha: sampleUpstreamLock().commitSha,
      repository: 'betting-win',
      responseReceivedAt: TEST_TIMESTAMP,
      sourceView: 'committed_git_head',
      verifiedAt: TEST_TIMESTAMP,
    },
    resource,
    surebetProfile: 'surebet_standard_binary_v0',
    ...overrides,
  };
}

function writeJson(response: ServerResponse<IncomingMessage>, statusCode: number, body: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json');
  response.end(`${JSON.stringify(body)}\n`);
}

function sampleUpstreamLock(): BettingWinUpstreamLock {
  return Object.freeze({
    schema: 'betting-win-surebet-upstream-lock-v1',
    repository: 'betting-win',
    repositoryPath: '/tmp/betting-win',
    commitSha: '1'.repeat(40),
    gitTreeSha: '2'.repeat(40),
    sourceView: 'committed_git_head',
    packageVersion: '0.48.0',
    trackedTreeListingSha256: '3'.repeat(64),
    sourceFingerprintAlgorithm: 'sha256_git_ls_tree_r_full_tree_head_v1',
    contractSchema: 'betting-win.strategy-export.v1',
    contractAlias: 'betting-win-strategy-export.v1',
    surebetProfile: 'surebet_standard_binary_v0',
    verifiedAt: TEST_TIMESTAMP,
    packageVersions: Object.freeze({
      '@betting-win/provider-collection': '0.48.0',
    }),
    capabilities: Object.freeze([
      'exportHistoricalBundle',
      'getHistoricalQuotes',
      'getProviderGenerations',
      'inspectSourceLineage',
    ]),
  });
}

async function sleep(durationMs: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
}
