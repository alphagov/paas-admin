import { ChildProcess, spawn } from 'child_process'

import request from 'supertest'

const envVars = {
  ACCOUNTS_SECRET: '__ACCOUNTS_SECRET__',
  ACCOUNTS_URL: 'https://example.com/accounts',
  API_URL: 'https://example.com/api',
  AUTHORIZATION_URL: 'https://example.com/login',
  AWS_REGION: 'eu-west-1',
  BILLING_URL: 'https://example.com/billing',
  DOMAIN_NAME: 'https://admin.example.com',
  GOOGLE_CLIENT_ID: 'GOOGLE_CLIENT_ID',
  GOOGLE_CLIENT_SECRET: 'GOOGLE_CLIENT_SECRET',
  MS_CLIENT_ID: 'CLIENTID',
  MS_CLIENT_SECRET: 'CLIENTSECRET',
  MS_TENANT_ID: 'TENANTID',
  NOTIFY_API_KEY: 'notify-1234',
  OAUTH_CLIENT_ID: 'uaa-id',
  OAUTH_CLIENT_SECRET: 'uaa-secret',
  PATH: process.env.PATH,
  PLATFORM_METRICS_ENDPOINT: 'https://example.com/performance',
  PROMETHEUS_ENDPOINT: 'https://example.com/prom',
  PROMETHEUS_PASSWORD: 'password',
  PROMETHEUS_USERNAME: 'admin',
  TEST_TIMEOUT: process.env.TEST_TIMEOUT as string,
  UAA_URL: 'https://example.com/uaa'
}

export interface IProcess extends ChildProcess {
  logs?: string[]
  port?: number
}

jest.setTimeout(parseInt(envVars.TEST_TIMEOUT, 10) || 30000)

async function run (env = {}): Promise<any> {
  return await new Promise((resolve, reject) => {
    const proc: IProcess = spawn(process.argv0, ['./dist/main.js'], { env })
    let isListening = false
    const logs = (proc.logs != null) || []

    // @ts-expect-error
    proc.stdout.on('data', data => {
      logs.push(data.toString())
      if (!isListening && /listening/.test(data.toString())) {
        isListening = true

        try {
          proc.port = JSON.parse(data.toString()).port
        } catch (err) {
          reject(
            new Error(
              `expected to be able to parse the log line to extract the port number: ${err}`
            )
          )
          proc.kill('SIGKILL')

          return
        }

        resolve(proc)
      }
    })

    proc.once('close', code => {
      if (!isListening) {
        reject(
          new Error(`process exited with code ${code}: ${logs.join('\n')}`)
        )
      }
    })

    proc.logs = logs
  })
}

async function kill (proc: IProcess, sig?: string) {
  return await new Promise((resolve, reject) => {
    proc.once('close', resolve)
    proc.once('error', reject)
    proc.kill(sig || 'SIGKILL')
  })
}

async function sleep (ms: number) {
  return await new Promise(resolve => setTimeout(resolve, ms))
}

async function waitForOutput (
  proc: IProcess,
  regexp: RegExp,
  attempt?: number
): Promise<any> {
  return await new Promise((resolve, reject) => {
    if (proc.logs == null) {
      return reject(new Error('no logs provided'))
    }

    for (const line of proc.logs) {
      if (regexp.test(line)) {
        return resolve(line)
      }
    }

    const att = attempt || 1

    if (att > 10) {
      return reject(
        new Error(`timeout waiting for log line to match: ${regexp.toString()}\n
      proc logs: ${proc.logs.join('\n')}`)
      )
    }

    return resolve(
      sleep(100).then(async () => await waitForOutput(proc, regexp, att + 1))
    )
  })
}

describe.only('main test suite', () => {
  it('should listen on a random port by default', async () => {
    const proc = await run(envVars)
    expect(proc.port).toBeGreaterThan(0)

    const response = await request(`http://localhost:${proc.port}`).get(
      '/healthcheck'
    )
    expect(response.status).toEqual(200)

    await kill(proc)
  })

  it('should listen on PORT environment variable', async () => {
    const newEnvVars = { ...envVars, PORT: 4551 }
    const proc = await run(newEnvVars)
    const response = await request('http://localhost:4551').get('/healthcheck')

    expect(response.status).toEqual(200)

    return await kill(proc)
  })

  it('should emit structured request logs', async () => {
    const newEnvVars = { ...envVars, LOG_LEVEL: 'info' }

    const proc = await run(newEnvVars)
    try {
      const response = await request(`http://localhost:${proc.port}`).get(
        '/healthcheck'
      )
      expect(response.status).toEqual(200)

      const line = await waitForOutput(proc, /request completed/)
      const data = JSON.parse(line)
      expect(data.req).toBeDefined()
      expect(data.req.method).toEqual('GET')
    } catch (err) {
      expect(err).not.toBeDefined()
    }

    return await kill(proc)
  })

  it('should exit gracefully on SIGTERM', async () => {
    const proc = await run(envVars)
    const code = await kill(proc, 'SIGTERM')
    expect(code).toEqual(0)
  })

  it('should exit gracefully on SIGINT', async () => {
    const proc = await run(envVars)
    const code = await kill(proc, 'SIGINT')
    expect(code).toEqual(0)
  })

  it('should exit with non-zero status on error (invalid PORT)', done => {
    const newEnvVars = { ...envVars, PORT: '-1' }
    const proc = spawn(process.argv0, ['./dist/main.js'], { env: newEnvVars })
    proc.once('error', fail)
    proc.once('close', code => {
      expect(code).not.toEqual(0)
      done()
    })
  })

  it('should exit due to a missing variable', done => {
    const newEnvVars = { ...envVars }
    newEnvVars.API_URL = ''
    const proc = spawn(process.argv0, ['./dist/main.js'], { env: newEnvVars })
    proc.once('error', fail)
    proc.once('close', code => {
      expect(code).not.toEqual(0)
      done()
    })
  })
})
