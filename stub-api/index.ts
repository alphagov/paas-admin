import express from 'express';

import stubAccounts from './stub-accounts';
import stubAws from './stub-aws';
import stubBilling from './stub-billing';
import stubCf from './stub-cf';
import stubPlatformMetrics from './stub-platform-metrics';
import stubPrometheus from './stub-prometheus';
import stubUaa from './stub-uaa';

export interface IStubServerConfig {
  readonly name: string;
  readonly ports: IStubServerPorts;
  readonly factory: StubServerFactory;
}
export interface IStubServerPorts {
  readonly apiPort: number;
  readonly adminPort: number;
}
export type StubServerFactory = (app: express.Application, config: IStubServerPorts) => express.Application;

const adminPort = parseInt(process.env['PORT'] || '3000', 10);

const cyan = '\x1b[36m';
const reset = '\x1b[0m';

const apis: ReadonlyArray<IStubServerConfig> = [
  {
    name: 'accounts',
    ports: { adminPort, apiPort: parseInt(process.env['STUB_ACCOUNTS_PORT'] || '3001', 10) },
    factory: stubAccounts,
  },
  {
    name: 'billing',
    ports: { adminPort, apiPort: parseInt(process.env['STUB_BILLING_PORT'] || '3002', 10) },
    factory: stubBilling,
  },
  {
    name: 'cf',
    ports: { adminPort, apiPort: parseInt(process.env['STUB_CF_PORT'] || '3003', 10) },
    factory: stubCf,
  },
  {
    name: 'uaa',
    ports: { adminPort, apiPort: parseInt(process.env['STUB_UAA_PORT'] || '3004', 10) },
    factory: stubUaa,
  },
  {
    name: 'aws',
    ports: { adminPort, apiPort: parseInt(process.env['STUB_AWS_PORT'] || '3005', 10) },
    factory: stubAws,
  },
  {
    name: 'prometheus',
    ports: { adminPort, apiPort: parseInt(process.env['STUB_PROMETHEUS_PORT'] || '3005', 10) },
    factory: stubPrometheus,
  },
  {
    name: 'platform-metrics',
    ports: { adminPort, apiPort: parseInt(process.env['STUB_PLATFORM_METRICS_PORT'] || '3006', 10) },
    factory: stubPlatformMetrics,
  },
];

for (const api of apis) {
  let app: express.Application = express();
  app.use((req, _res, next) => {
    console.log(`${cyan}stub-${api.name}-api${reset} ${req.method} ${req.path}`);
    next();
  });

  app = api.factory(app, api.ports);
  app.listen(
    api.ports.apiPort,
    () => console.log(`${cyan}stub-${api.name}-api${reset} Started, listening on port ${api.ports.apiPort}`),
  );
}
