import express from 'express';
import stubUaa from './stub-uaa';
import stubAccounts from './stub-accounts';
import stubCf from './stub-cf';

const app = express();

const adminPort = process.env['PORT'] || '3000';
const stubApiPort = process.env['STUB_API_PORT'] || '3001';
const config = {adminPort: adminPort, stubApiPort: stubApiPort};

const cyan = '\x1b[36m';
const reset = '\x1b[0m';

app.use((req, _res, next) => {
  console.log(`${cyan}stub-api${reset} ${req.method} ${req.path}`);
  next();
});

stubUaa(app, config);
stubAccounts(app, config);
stubCf(app, config);

app.listen(stubApiPort, () => console.log(`${cyan}stub-api${reset} Started, listening on port ${stubApiPort}`));
