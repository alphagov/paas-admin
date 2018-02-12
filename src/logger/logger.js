import pino from 'pino';
import pinoMiddleware from 'express-pino-logger';

const logger = pino();

logger.level = 'info';

export function loggerMiddleware() {
  return pinoMiddleware({logger});
}

export default logger;
