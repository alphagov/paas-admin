import {spawn} from 'child_process';
import t from 'tap';
import request from 'supertest';

t.jobs = 8;

const envVars = {
  OAUTH_AUTHORIZATION_URL: 'auth-url',
  OAUTH_TOKEN_URL: 'token-url',
  OAUTH_CLIENT_ID: 'uaa-id',
  OAUTH_CLIENT_SECRET: 'uaa-secret',
  API_URL: 'https://example.com/api',
  UAA_URL: 'https://example.com/uaa',
  NOTIFY_API_KEY: 'notify-1234'
};

t.test('should listen on a random port by default', async t => {
  const proc = await run(envVars);
  t.ok(proc.port > 0);
  await t.resolves(request(`http://localhost:${proc.port}`).get('/').expect(302));
  return kill(proc);
});

t.test('should listen on PORT environment variable', async t => {
  const newEnvVars = Object.assign({}, envVars);
  newEnvVars.PORT = 4551;
  const proc = await run(newEnvVars);
  await t.resolves(request(`http://localhost:4551`).get('/').expect(302));
  return kill(proc);
});

t.test('should emit structured request logs', async t => {
  const proc = await run(envVars);
  try {
    await t.resolves(request(`http://localhost:${proc.port}`).get('/').expect(302));

    const line = await waitForOutput(proc, /request completed/);
    const data = JSON.parse(line);
    t.ok(data.req);
    t.equal(data.req.method, 'GET');
  } catch (err) {
    t.fail(err);
  }
  return kill(proc);
});

t.test('should exit gracefully on SIGTERM', async t => {
  const proc = await run(envVars);
  const code = await kill(proc, 'SIGTERM');
  t.equal(code, 0);
});

t.test('should exit gracefully on SIGINT', async t => {
  const proc = await run(envVars);
  const code = await kill(proc, 'SIGINT');
  t.equal(code, 0);
});

t.test('should exit with non-zero status on error (invalid PORT)', t => {
  const newEnvVars = Object.assign({}, envVars);
  newEnvVars.PORT = 1;
  const proc = spawn(process.argv0, ['./dist/main.js'], {env: newEnvVars});
  proc.once('error', t.fail);
  proc.once('close', code => {
    t.ok(code > 0);
    t.end();
  });
});

t.test('should exit due to a missing variable', t => {
  const newEnvVars = Object.assign({}, envVars);
  newEnvVars.OAUTH_TOKEN_URL = '';
  const proc = spawn(process.argv0, ['./dist/main.js'], {env: newEnvVars});
  proc.once('error', t.fail);
  proc.once('close', code => {
    t.ok(code > 0);
    t.end();
  });
});

async function run(env = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.argv0, ['./dist/main.js'], {env});
    let isListening = false;
    proc.logs = [];
    proc.stdout.on('data', data => {
      proc.logs.push(data.toString());
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
        reject(new Error(`process exited with code ${code}: ${proc.logs.join('\n')}`));
      }
    });
  });
}

async function kill(proc, sig) {
  return new Promise((resolve, reject) => {
    proc.once('close', resolve);
    proc.once('error', reject);
    proc.kill(sig || 'SIGKILL');
  });
}

async function waitForOutput(proc, regexp, attempt) {
  return new Promise((resolve, reject) => {
    for (let i = 0; i < proc.logs.length; i++) {
      const line = proc.logs[i];
      if (regexp.test(line)) {
        return resolve(line);
      }
    }
    if (!attempt) {
      attempt = 1;
    }
    if (attempt > 10) {
      return reject(new Error(`timeout waiting for log line to match: ${regexp.toString()}`));
    }
    return resolve(sleep(100).then(() => waitForOutput(proc, regexp, attempt + 1)));
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
