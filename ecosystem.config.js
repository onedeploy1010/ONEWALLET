/**
 * PM2 Ecosystem Configuration for ONE Platform
 *
 * Ports:
 * - one-dashboard: 4001 (dashboard.one23.io)
 * - one-engine: 4002 (api.one23.io)
 */

module.exports = {
  apps: [
    {
      name: 'one-dashboard',
      cwd: '/home/tgtgdeploy/work/One/ONEWALLET/one-dashboard',
      script: 'node_modules/.bin/next',
      args: 'start -p 4001',
      env: {
        NODE_ENV: 'production',
        PORT: 4001,
        ENGINE_URL: 'http://localhost:4002',
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/one-dashboard-error.log',
      out_file: '/var/log/pm2/one-dashboard-out.log',
      merge_logs: true,
      time: true,
    },
    {
      name: 'one-engine',
      cwd: '/home/tgtgdeploy/work/One/one-engine',
      script: 'node_modules/.bin/next',
      args: 'start -p 4002',
      env: {
        NODE_ENV: 'production',
        PORT: 4002,
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      error_file: '/var/log/pm2/one-engine-error.log',
      out_file: '/var/log/pm2/one-engine-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
