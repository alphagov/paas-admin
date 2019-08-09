import express from 'express';

import stubAccounts from './stub-accounts';
import stubBilling from './stub-billing';
import stubCf from './stub-cf';
import stubPrometheus from './stub-prometheus';
import stubReverseLogProxyGateway from './stub-reverse-log-proxy-gateway';
import stubUaa from './stub-uaa';

export interface IStubServerConfig {
  name: string;
  ports: IStubServerPorts;
  factory: StubServerFactory;
}
export interface IStubServerPorts {
  apiPort: number,
  adminPort: number,
}
export type StubServerFactory = (app: express.Application, config: IStubServerPorts) => express.Application;

const adminPort = parseInt(process.env['PORT'] || '3000', 10);

const cyan = '\x1b[36m';
const reset = '\x1b[0m';

const apis: readonly IStubServerConfig[] = [
  {
    name: 'accounts',
    ports: { adminPort, apiPort: parseInt(process.env['STUB_ACCOUNTS_PORT'] || '3001', 10) },
    factory: stubAccounts,
  },
  {
    name: 'billing',
    ports: { adminPort, apiPort: parseInt(process.env['STUB_BILLING_PORT'] || '3002', 10)},
    factory: stubBilling,
  },
  {
    name: 'cf',
    ports: {adminPort, apiPort: parseInt(process.env['STUB_CF_PORT'] || '3003', 10)},
    factory: stubCf,
  },
  {
    name: 'uaa',
    ports: {adminPort, apiPort: parseInt(process.env['STUB_UAA_PORT'] || '3004', 10)},
    factory: stubUaa,
  },
  {
    name: 'prometheus',
    ports: {adminPort, apiPort: parseInt(process.env['STUB_PROMETHEUS_PORT'] || '3005', 10)},
    factory: stubPrometheus,
  },
  {
    name: 'reverse-log-proxy-gateway',
    ports: {adminPort, apiPort: parseInt(process.env['STUB_REVERSE_LOG_PROXY_GATEWAY_PORT'] || '3006', 10)},
    factory: stubReverseLogProxyGateway,
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
