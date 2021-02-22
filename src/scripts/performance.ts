import pino from 'pino';

import { scrape } from '../components/performance/scraper';

const logger = pino({
  prettyPrint: {
    ignore: 'time,pid,hostname',
  },
  timestamp: false,
}, process.stderr);

async function run(): Promise<void> {
  const data = await scrape({
    pingdom: {},
    prometheus: {
      endpoint: process.env['PLATFORM_PROMETHEUS_ENDPOINT'] || '',
      password: process.env['PLATFORM_PROMETHEUS_PASSWORD'] || '',
      username: process.env['PLATFORM_PROMETHEUS_USERNAME'] || '',
    },
  }, logger);

  logger.info('All done!');

  process.stdout.write(JSON.stringify(data));
}

run().catch(logger.error);
