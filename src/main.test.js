import {spawn} from 'child_process';
import t from 'tap';
import request from 'supertest';

t.jobs = 8;

t.test('should listen on a random port by default', async t => {
  const proc = await run();
  t.ok(proc.port > 0);
  await t.resolves(request(`http://localhost:${proc.port}`).get('/').expect(200));
  return kill(proc);
});

t.test('should listen on PORT environment variable', async t => {
  const proc = await run({PORT: 4551});
  await t.resolves(request(`http://localhost:4551`).get('/four-oh-four').expect(404));
  return kill(proc);
});

t.test('should emit structured request logs', async t => {
  const proc = await run();
  await t.resolves(request(`http://localhost:${proc.port}`).get('/structured-req-log-test').expect(404));
  const line = await waitForOutput(proc, /structured-req-log-test/);
  const data = JSON.parse(line);
  t.ok(data);
  t.ok(data.req);
  t.equal(data.req.method, 'GET');
  return kill(proc);
});

t.test('should exit gracefully on SIGTERM', async t => {
  const proc = await run();
  const code = await kill(proc, 'SIGTERM');
  t.equal(code, 0);
});

t.test('should exit gracefully on SIGINT', async t => {
  const proc = await run();
  const code = await kill(proc, 'SIGINT');
  t.equal(code, 0);
});

t.test('should exit with non-zero status on error (invalid PORT)', t => {
  const proc = spawn('node', ['./dist/main.js'], {env: {PORT: 1}, shell: true});
  proc.once('error', t.fail);
  proc.once('close', code => {
    t.ok(code > 0);
    t.end();
  });
});

async function run(env = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', ['./dist/main.js'], {env, shell: '/bin/bash'});
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
