/** @type {import('pm2').StartOptions[]} */
module.exports = {
  apps: [
    {
      name: 'receiptbrain-dev',
      cwd: __dirname,
      script: 'pnpm',
      args: 'dev',
      interpreter: 'none',
      autorestart: true,
      max_restarts: 10,
    },
    {
      name: 'receiptbrain-tunnel',
      cwd: __dirname,
      script: 'pnpm',
      args: 'run tunnel',
      interpreter: 'none',
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
