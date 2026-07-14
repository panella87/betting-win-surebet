# BWS service run contract

The current repo does not yet have the final BWS service stack. `BWS-400` through `BWS-500` implement API, workers, UI, configuration, security, observability, and process definitions.

Until those tasks are validated:

- retained paper evaluation is no-service and fixture/pinned-bundle only;
- no provider endpoint or provider credential is accepted;
- no direct betting-win database access is allowed;
- no execution path is enabled.

After `BWS-510`, service processes remain loopback/read-only by default. Continuous external paper observation still requires `BWS-600` evidence and operator configuration.
