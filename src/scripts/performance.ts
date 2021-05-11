import pino from 'pino'

import { scrape } from '../components/performance/scraper'

const logger = pino({
  prettyPrint: {
    ignore: 'time,pid,hostname'
  },
  timestamp: false
}, process.stderr)

async function run (): Promise<void> {
  const data = await scrape({
    pingdom: {
      checkID: process.env.PINGDOM_CHECK_ID || '0',
      endpoint: 'https://api.pingdom.com',
      token: process.env.PINGDOM_API_TOKEN || 'token'
    },
    prometheus: {
      endpoint: process.env.PLATFORM_PROMETHEUS_ENDPOINT || '',
      password: process.env.PLATFORM_PROMETHEUS_PASSWORD || '',
      username: process.env.PLATFORM_PROMETHEUS_USERNAME || ''
    }
  }, logger)

  logger.info('All done!')

  process.stdout.write(JSON.stringify(data))
}

run().catch(logger.error)
