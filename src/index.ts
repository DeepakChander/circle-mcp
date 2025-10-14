#!/usr/bin/env node

import { CircleMCPServer } from './server.js';
import { Logger } from './utils/logger.js';

const logger = new Logger('Main');

async function main(): Promise<void> {
  try {
    logger.info('Starting Circle MCP Server...');

    const server = new CircleMCPServer();

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      await server.stop();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Start server
    await server.start();
  } catch (error) {
    logger.error('Fatal error', error as Error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});