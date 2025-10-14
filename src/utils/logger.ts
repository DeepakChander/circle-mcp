import winston from 'winston';
import { config } from '../config/config.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(meta).length > 0) {
    log += ` ${JSON.stringify(meta)}`;
  }
  if (stack) {
    log += `\n${stack}`;
  }
  return log;
});

export const logger = winston.createLogger({
  level: config.logLevel,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
      stderrLevels: ['error', 'warn', 'info', 'debug'],
    }),
  ],
});

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    logger.debug(message, { context: this.context, ...meta });
  }

  info(message: string, meta?: Record<string, unknown>): void {
    logger.info(message, { context: this.context, ...meta });
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    logger.warn(message, { context: this.context, ...meta });
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    logger.error(message, { context: this.context, error, ...meta });
  }
}