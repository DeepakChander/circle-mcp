import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('Resources');

export function registerResources(_server: McpServer): void {
  logger.info('Resources feature is optional - skipping for now');
  // Resources can be added later if needed
}