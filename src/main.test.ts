import { ChildProcess, spawn } from 'child_process';
import request from 'supertest';
import { test } from 'tap';

const envVars = {
  OAUTH_AUTHORIZATION_URL: 'auth-url',
  OAUTH_TOKEN_URL: 'token-url',
  OAUTH_CLIENT_ID: 'uaa-id',
  OAUTH_CLIENT_SECRET: 'uaa-secret',
  API_URL: 'https://example.com/api',
  UAA_URL: 'https://example.com/uaa',
  NOTIFY_API_KEY: 'notify-1234',
};

export interface IProcess extends ChildProcess {
  logs?: string[]; // tslint:disable-line:readonly-array
  port?: number;
}

test('should listen on a random port by default', async ts => {
  const proc = await run(envVars);
  ts.ok(proc.port > 0);
  await ts.resolves(request(`http://localhost:${proc.port}`).get('/healthcheck').expect(200));
  kill(proc);
});

test('should listen on PORT environment variable', async ts => {
  const newEnvVars = {...envVars, PORT: 4551};
  const proc = await run(newEnvVars);
  await ts.resolves(request(`http://localhost:4551`).get('/healthcheck').expect(200));
  kill(proc);
});

test('should emit structured request logs', async ts => {
  const newEnvVars = {...envVars, LOG_LEVEL: 'info'};

  const proc = await run(newEnvVars);
  try {
    await ts.resolves(request(`http://localhost:${proc.port}`).get('/healthcheck').expect(200));

    const line = await waitForOutput(proc, /request completed/);
    const data = JSON.parse(line);
    ts.ok(data.req);
    ts.equal(data.req.method, 'GET');
  } catch (err) {
    ts.fail(err);
  }
  kill(proc);
});

test('should exit gracefully on SIGTERM', async ts => {
  const proc = await run(envVars);
  const code = await kill(proc, 'SIGTERM');
  ts.equal(code, 0);
});

test('should exit gracefully on SIGINT', async ts => {
  const proc = await run(envVars);
  const code = await kill(proc, 'SIGINT');
  ts.equal(code, 0);
});

test('should exit with non-zero status on error (invalid PORT)', ts => {
  const newEnvVars = {...envVars, PORT: -1};
  const proc = spawn(process.argv0, ['./dist/main.js'], {env: newEnvVars});
  proc.once('error', ts.fail);
  proc.once('close', code => {
    ts.ok(code > 0);
    ts.end();
  });
});

test('should exit due to a missing variable', ts => {
  const newEnvVars = {...envVars};
  newEnvVars.OAUTH_TOKEN_URL = '';
  const proc = spawn(process.argv0, ['./dist/main.js'], {env: newEnvVars});
  proc.once('error', ts.fail);
  proc.once('close', code => {
    ts.ok(code > 0);
    ts.end();
  });
});

async function run(env = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const proc: IProcess = spawn(process.argv0, ['./dist/main.js'], {env});
    let isListening = false;
    const logs = proc.logs || [];

    proc.stdout.on('data', data => {
      logs.push(data.toString());
      if (!isListening && /listening/.test(data.toString())) {
        isListening = true;

        try {
          proc.port = JSON.parse(data.toString()).port;
        } catch (err) {
          reject(new Error(`expected to be able to parse the log line to extract the port number: ${err}`));
          proc.kill('SIGKILL');
          return;
        }

        resolve(proc);
      }
    });

    proc.once('close', code => {
      if (!isListening) {
        reject(new Error(`process exited with code ${code}: ${logs.join('\n')}`));
      }
    });

    proc.logs = logs;
  });
}

async function kill(proc: IProcess, sig?: string) {
  return new Promise((resolve, reject) => {
    proc.once('close', resolve);
    proc.once('error', reject);
    proc.kill(sig || 'SIGKILL');
  });
}

async function waitForOutput(proc: IProcess, regexp: RegExp, attempt?: number): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!proc.logs) {
      return reject(new Error(`no logs provided`));
    }

    for (const line of proc.logs) {
      if (regexp.test(line)) {
        return resolve(line);
      }
    }

    const att = attempt || 1;

    if (att > 10) {
      return reject(new Error(`timeout waiting for log line to match: ${regexp.toString()}\n
      proc logs: ${proc.logs.join('\n')}`));
    }
    return resolve(sleep(100).then(() => waitForOutput(proc, regexp, att + 1)));
  });
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
