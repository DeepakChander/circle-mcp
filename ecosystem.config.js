/**
 * PM2 Ecosystem Configuration
 * Production process manager configuration for Circle MCP Server
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 restart circle-mcp-websocket
 *   pm2 logs circle-mcp-websocket
 *   pm2 monit
 */

module.exports = {
  apps: [
    {
      name: 'circle-mcp-websocket',
      script: './dist/http-server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=2048',

      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
        HOST: '0.0.0.0',
        PUBLIC_DOMAIN: 'circle-mcp.duckdns.org',
        LOG_LEVEL: 'info',
      },

      // Development environment
      env_development: {
        NODE_ENV: 'development',
        PORT: '3000',
        HOST: 'localhost',
        PUBLIC_DOMAIN: 'localhost',
        LOG_LEVEL: 'debug',
      },

      // Staging environment
      env_staging: {
        NODE_ENV: 'staging',
        PORT: '3000',
        HOST: '0.0.0.0',
        PUBLIC_DOMAIN: 'staging.circle-mcp.duckdns.org',
        LOG_LEVEL: 'info',
      },

      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      combine_logs: true,
      merge_logs: true,

      // Advanced PM2 features
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,

      // Listen timeout
      listen_timeout: 10000,
      kill_timeout: 5000,

      // Source map support
      source_map_support: true,

      // PM2 Plus (optional monitoring)
      // instance_var: 'INSTANCE_ID',
      // pmx: true,
    }
  ],

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'ubuntu',
      host: '54.152.106.177',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/circle-mcp.git',
      path: '/home/ubuntu/circle-mcp',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};
